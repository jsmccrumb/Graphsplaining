const crypto = require('crypto');
const neo4j = require('neo4j-driver').v1;
const checks = require('./performance_checks');

const explainDriver = neo4j.driver(
    process.env.NEO4J_EXPLAIN_BOLT,
    neo4j.auth.basic(
        process.env.NEO4J_EXPLAIN_USER,
        process.env.NEO4J_EXPLAIN_PASS
    )
);
const mainDriver = neo4j.driver(
    process.env.NEO4J_MAIN_BOLT,
    neo4j.auth.basic(process.env.NEO4J_MAIN_USER, process.env.NEO4J_MAIN_PASS)
);

/**
 * runs a read transaction using given session, query, and optional params
 * @return {neo4j.statementResult} statementResult
 */
const readTransactionAsync = async (session, query, params) => {
  return await session.readTransaction(async tx => {
    return await tx.run(query, params);
  });
};

/**
 * runs a write transaction using given session, query, and optional params
 * @return {neo4j.statementResult} statementResult
 */
const writeTransactionAsync = async (session, query, params) => {
  return await session.writeTransaction(async tx => {
    return await tx.run(query, params);
  });
};

/**
 * Checks that the given driver can reach the graph
 *
 * @param {neo4j.driver} driver
 * @return {boolean} isReady Whether connection is live
 */
const testConnectionAsync = async driver => {
  const session = driver.session();
  try {
    const checkUser = 'call dbms.showCurrentUser()';
    const resp = await readTransactionAsync(session, checkUser);
    session.close();
    // it does not matter who user it,
    // just checking that connection to db is live for current user
    return !!resp.records[0];
  } catch (e) {
    session.close();
    return false;
  }
};

/**
 * checks whether connections to both explain and main graphs are ready
 * @return {Object} connections
 * @return {boolean} connections.main Whether connection to main graph is ready
 * @return {boolean} connections.explain
 *     Whether connection to explain graph is ready
 */
const testConnectionsAsync = async () => {
  const connections = {
    main: await testConnectionAsync(mainDriver),
    explain: await testConnectionAsync(explainDriver),
  };
  return connections;
};

/**
 * Removes comments from a cypher query
 */
const removeComments = query => {
  return query.replace(/\/\/.+/g, '');
};

/**
 * Returns a hash of the query after
 *   stripping comments
 *   and whitespace
 *   and converting to all lower case
 *
 * @param {string} query
 * @return {string} SHA1 hash
 */
const queryId = query => {
  const strippedQuery = removeComments(query)
      .replace(/\s/g, '')
      .toLowerCase();
  return crypto
      .createHash('sha1')
      .update(strippedQuery)
      .digest('base64');
};

/**
 * Makes query into an EXPLAIN query by removing comments
 * and any number of initial explains or profiles
 * @param {string} query
 * @return {string} formattedQuery
 */
const transformQueryToExplain = query => {
  query = removeComments(query);
  // REGEX ^ = start of string
  // (\s*(explain|profile)) = 0+ whitespace characters then explain or profile
  // * = 0+ of that last group
  // i = case insensitive
  query = query.replace(/^(\s*(explain|profile))*/i, 'EXPLAIN ');
  return query;
};

/**
 * Runs explain against main graph for given query
 * @param {string} query Query that needs explaining
 * @return {neo4j.statementResult} result of explain
 */
const runExplainAsync = async (query, queryId) => {
  query = transformQueryToExplain(query);
  const session = mainDriver.session();
  try {
    return await readTransactionAsync(session, query);
  } catch (e) {
    console.error('Unexplainable query found', e);
    removeExplainMeAsync(queryId);
  } finally {
    session.close();
  }
};

const getCypherForSaveExplain = ({summary}, queryId) => {
  // integer to increment as new node added to query to create unique aliases
  let currentNode = 0;
  const extractPlanArguments = args => {
    const excludedKeys = [
      'planner',
      'version',
      'runtime',
      'runtime-impl',
      'runtime-version',
      'planner-impl',
      'planner-version',
    ];
    return Object.entries(args)
        .filter(([key, value]) => {
          return excludedKeys.indexOf(key) === -1;
        })
        .reduce((acc, [key, value]) => {
          const formattedKey =
          key.substring(0, 1).toLowerCase() + key.substring(1);
          acc[formattedKey] =
          value === parseInt(value) ? neo4j.int(value) : value;
          return acc;
        }, {});
  };
  /**
   * Formats a plan (child of parentNode) along with any children of that plan
   * @param {String} parentNode alias of parentNode
   * @param {Neo4j.Plan} child
   * @return {Array} [statement, params]
   */
  const formatChild = (parentNode, child) => {
    currentNode++;
    const childAlias = `plan${currentNode}`;
    // call this method on children
    const myChildren = (child.children || []).map(c =>
      formatChild(childAlias, c)
    );
    // reduce children params into this one
    const params = myChildren.reduce(
        (acc, [statement, params]) => {
          return {...acc, ...params};
        },
        {
          [childAlias]: {
            operatorType: child.operatorType,
            identifiers: child.identifiers,
            ...extractPlanArguments(child.arguments),
          },
        }
    );
    // reduce children statements into this one
    const statement = myChildren.reduce(
        (acc, [statement, params]) => {
          return `${acc}
        ${statement}`;
        },
        `CREATE (${childAlias}:Plan)
      SET ${childAlias} += $${childAlias}
    CREATE (${parentNode})-[:HAS_CHILD]->(${childAlias})`
    );
    return [statement, params];
  };

  const recursivelyFormatChildren = (parentNode, children = []) => {
    return children
        .map(child => formatChild(parentNode, child))
        .reduce(
            (acc, [statement, params]) => {
              return [
                `${acc[0]}
            ${statement}`,
                {...acc[1], ...params},
              ];
            },
            ['', {}]
        );
  };
  const initialAlias = `plan${currentNode}`;
  const [childrenStatement, childrenParams] = recursivelyFormatChildren(
      initialAlias,
      summary.plan.children
  );
  const statement = `
    // match the statement node, create the explain node, link the children
    MATCH (q:Statement {queryId: $queryId})
    REMOVE q:ExplainMe
    WITH q
    CREATE (e:Explain:CheckMe:CheckMissingIndex {
      statementType: $explain.statementType,
      serverAddress: $explain.serverAddress,
      serverVersion: $explain.serverVersion,
      createdOn: datetime(),
      planner: $explain.planner,
      version: $explain.version,
      runtime: $explain.runtime,
      runtimeImpl: $explain.runtimeImpl,
      runtimeVersion: $explain.runtimeVersion,
      plannerImpl: $explain.plannerImpl,
      plannerVersion: $explain.plannerVersion
    })
    CREATE (e)-[:EXPLAINS]->(q)
    CREATE (${initialAlias}:Plan)
    SET ${initialAlias} += $${initialAlias}
    CREATE (${initialAlias})-[:ENDS]->(e)
    ${childrenStatement}`;
  const params = {
    queryId,
    explain: {
      statementType: summary.statementType,
      serverAddress: summary.server.address,
      serverVersion: summary.server.version,
      planner: summary.plan.arguments.planner,
      version: summary.plan.arguments.version,
      runtime: summary.plan.arguments.runtime,
      runtimeImpl: summary.plan.arguments['runtime-impl'],
      runtimeVersion: summary.plan.arguments['runtime-version'],
      plannerImpl: summary.plan.arguments['planner-impl'],
      plannerVersion: summary.plan.arguments['planner-version'],
    },
    [initialAlias]: {
      operatorType: summary.plan.operatorType,
      identifiers: summary.plan.identifiers,
      ...extractPlanArguments(summary.plan.arguments),
    },
    ...childrenParams,
  };
  return [statement, params];
};

const saveExplainAsync = async (result, queryId) => {
  const [statement, params] = getCypherForSaveExplain(result, queryId);
  const session = explainDriver.session();
  try {
    return await writeTransactionAsync(session, statement, params);
  } catch (e) {
    console.error('error saving explain!', queryId);
  } finally {
    session.close();
  }
};

const getQueriesToExplainAsync = async () => {
  const cypher = `// get all :ExplainMe nodes
    MATCH (n:ExplainMe)
    RETURN n { .queryId, .text } AS query`;
  const session = explainDriver.session();
  try {
    return await readTransactionAsync(session, cypher);
  } catch (e) {
    console.error('Error getting queries to explain');
  } finally {
    session.close();
  }
};

const initIndicesAsync = async () => {
  const session = explainDriver.session();
  try {
    const createIndices = [
      `CREATE CONSTRAINT ON (statement:Statement)
      ASSERT statement.queryId IS UNIQUE`,
      `CREATE INDEX ON :Explain(createdOn)`,
      `CREATE CONSTRAINT ON (check:PerformanceCheck)
      ASSERT check.name IS UNIQUE`,
    ];
    for (let i = 0; i < createIndices.length; i++) {
      await writeTransactionAsync(session, createIndices[i]);
    }
  } catch (e) {
    console.error('ERROR: Unable to init indices');
  } finally {
    session.close();
  }
};

const initPerformanceChecksAsync = async () => {
  const session = explainDriver.session();
  try {
    const createChecks = `// unwind a list of checks and merge on name, setting properties on create
      UNWIND $checks AS check
      MERGE (n:PerformanceCheck {name: check.name})
        ON CREATE SET
          n.createdOn = datetime(),
          n.severity = check.severity,
          n.description = check.description,
          n.violationCheck = check.violationCheck`;
    await writeTransactionAsync(session, createChecks, {checks});
  } catch (e) {
    console.error('ERROR: Unable to init :PerformanceChecks');
  } finally {
    session.close();
  }
};

const getPerformanceChecksAsync = async () => {
  const cypher = `// get all rules
    MATCH (n:PerformanceCheck)
    RETURN n { .* } AS check`;
  const session = explainDriver.session();
  try {
    const result = await readTransactionAsync(session, cypher);
    if (result == null || result.records == null) {
      return [];
    } else {
      return result.records.map((record) => {
        const props = record.get('check');
        return {...props, severity: neo4j.int(props.severity)};
      });
    }
  } catch (e) {
    console.error('ERROR: Could get get performance checks');
  } finally {
    session.close();
  }
};

const checkMissingIndexesAsync = async () => {
  const cypher = `
    MATCH (ex:CheckMissingIndex)
    WITH ex LIMIT 30
    REMOVE ex:CheckMissingIndex
    WITH ex
    MATCH (ex)<-[:ENDS]-()-[:HAS_CHILD]->(fp {operatorType: 'Filter'})-[:HAS_CHILD*1..3]->(ns)
    WHERE fp.expression CONTAINS '.' AND ns.operatorType IN ['NodeByLabelScan', 'AllNodesScan']
    MERGE (ex)-[:COULD_INDEX_PROPERTY]->(fp)
    WITH ex, ns
    WHERE ns.operatorType = 'NodeByLabelScan'
    MERGE (ex)-[:COULD_INDEX_LABEL]->(ns)`;
  const session = explainDriver.session();
  let resp = null;
  try {
    do {
      resp = await writeTransactionAsync(session, cypher);
    } while (resp.summary.counters.labelsRemoved() > 0);
  } catch (e) {
    console.error('Error checking for missing indexes', e);
  } finally {
    session.close();
  }
};

const runPerformanceChecksAsync = async ({queryId, createdOn}) => {
  const checks = await getPerformanceChecksAsync();
  const cypherBegin = `// for checking a rule violation, first find the query and explain to check
    MATCH (statement:Statement {queryId: $queryId})<-[:EXPLAINS]-(explain:Explain {createdOn: $createdOn})<-[:ENDS]-(lastPlan)`;
  const cleanupCypher = `MATCH (statement:Statement {queryId: $queryId})<-[:EXPLAINS]-(explain {createdOn: $createdOn})
    REMOVE explain:CheckMe`;
  const session = explainDriver.session();
  try {
    for (let i = 0; i < checks.length; i++) {
      const check = checks[i];
      const cypher = `${cypherBegin}
        ${check.violationCheck}`;
      const params = {
        queryId: queryId,
        createdOn: createdOn,
        checkName: check.name,
      };
      await writeTransactionAsync(session, cypher, params);
    }
    await writeTransactionAsync(session, cleanupCypher, {queryId, createdOn});
  } catch (e) {
    console.error('ERROR: unable to check performance on: ', queryId, createdOn, e);
  } finally {
    session.close();
  }
};

const getExplainsToCheckAsync = async () => {
  const cypher = `MATCH (s)<-[:EXPLAINS]-(e:CheckMe)
    RETURN s.queryId AS queryId, e.createdOn AS createdOn`;
  const session = explainDriver.session();
  try {
    const result = await readTransactionAsync(session, cypher);
    if (result == null || result.records == null) {
      return [];
    } else {
      return result.records.map((record) => {
        return {
          queryId: record.get('queryId'),
          createdOn: record.get('createdOn'),
        };
      });
    }
  } catch (e) {
    console.error('ERROR: unable to get explains to check');
  } finally {
    session.close();
  }
};

const removeExplainMeAsync = async (id) => {
  const cypher = `MATCH (s:Statement {queryId: $id})
    REMOVE s:ExplainMe SET s:Unexplainable`;
  const session = explainDriver.session();
  try {
    return await writeTransactionAsync(session, cypher, {id});
  } catch (e) {
    console.error('Unable to remove explain me');
  } finally {
    session.close();
  }
};

module.exports = {
  removeComments,
  queryId,
  testConnectionsAsync,
  runExplainAsync,
  getCypherForSaveExplain,
  saveExplainAsync,
  getQueriesToExplainAsync,
  initIndicesAsync,
  initPerformanceChecksAsync,
  getExplainsToCheckAsync,
  runPerformanceChecksAsync,
  checkMissingIndexesAsync,
};
