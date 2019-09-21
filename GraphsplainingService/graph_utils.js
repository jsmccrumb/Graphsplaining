const crypto = require('crypto');
const neo4j = require('neo4j-driver').v1;

const explainDriver = neo4j.driver(process.env.NEO4J_EXPLAIN_BOLT,
    neo4j.auth.basic(process.env.NEO4J_EXPLAIN_USER,
        process.env.NEO4J_EXPLAIN_PASS));
const mainDriver = neo4j.driver(process.env.NEO4J_MAIN_BOLT,
    neo4j.auth.basic(process.env.NEO4J_MAIN_USER, process.env.NEO4J_MAIN_PASS));

/**
 * runs a read transaction using given session, query, and optional params
 * @return {neo4j.statementResult} statementResult
 */
const readTransactionAsync = async (session, query, params) => {
  return await session.readTransaction(async (tx) => {
    return await tx.run(query, params);
  });
};

/**
 * runs a write transaction using given session, query, and optional params
 * @return {neo4j.statementResult} statementResult
 */
const writeTransactionAsync = async (session, query, params) => {
  return await session.writeTransaction(async (tx) => {
    return await tx.run(query, params);
  });
};

/**
 * Checks that the given driver can reach the graph
 *
 * @param {neo4j.driver} driver
 * @return {boolean} isReady Whether connection is live
 */
const testConnectionAsync = async (driver) => {
  const session = driver.session();
  try {
    const checkUser = 'call dbms.showCurrentUser()';
    const resp = await readTransactionAsync(session, checkUser);
    session.close();
    // it does not matter who user it,
    // just checking that connection to db is live for current user
    return !!resp.records[0];
  } catch {
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
    main: (await testConnectionAsync(mainDriver)),
    explain: (await testConnectionAsync(explainDriver)),
  };
  return connections;
};

/**
 * Removes comments from a cypher query
 */
const removeComments = (query) => {
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
const queryId = (query) => {
  const strippedQuery = removeComments(query).replace(/\s/g, '').toLowerCase();
  return crypto.createHash('sha1').update(strippedQuery).digest('base64');
};

/**
 * Makes query into an EXPLAIN query by removing comments
 * and any number of initial explains or profiles
 * @param {string} query
 * @return {string} formattedQuery
 */
const transformQueryToExplain = (query) => {
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
const runExplainAsync = async (query) => {
  query = transformQueryToExplain(query);
  return await readTransactionAsync(mainDriver.session(), query);
};

const getCypherForSaveExplain = ({summary}, queryId) => {
  // integer to increment as new node added to query to create unique aliases
  let currentNode = 0;
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
    const myChildren = (child.children || [])
        .map(c => formatChild(childAlias, c));
    // reduce children params into this one
    const params = myChildren.reduce((acc, [statement, params]) => {
      return {...acc, ...params};
    }, {[childAlias]: {
      operatorType: child.operatorType,
      identifiers: child.identifiers,
      estimatedRows: child.arguments.EstimatedRows,
    }});
    // reduce children statements into this one
    const statement = myChildren.reduce((acc, [statement, params]) => {
      return `${acc}
        ${statement}`;
    }, `CREATE (${childAlias}:Plan {
      operatorType: $${childAlias}.operatorType,
      identifiers: $${childAlias}.identifiers,
      estimatedRows: $${childAlias}.estimatedRows
    })
    CREATE (${parentNode})-[:HAS_CHILD]->(${childAlias})`);
    return [statement, params];
  };

  const recursivelyFormatChildren = (parentNode, children = []) => {
    return children.map(child => formatChild(parentNode, child))
        .reduce((acc, [statement, params]) => {
          return [`${acc[0]}
            ${statement}`, {...acc[1], ...params}];
        }, ['', {}]);
  };
  const initialAlias = `plan${currentNode}`;
  const [childrenStatement, childrenParams] =
      recursivelyFormatChildren(initialAlias, summary.plan.children);
  const statement = `
    // match the statement node, create the explain node, link the children
    MATCH (q:Statement {queryId: $queryId})
    REMOVE q:ExplainMe
    WITH q
    CREATE (e:Explain {
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
    CREATE (${initialAlias}:Plan {
      operatorType: $${initialAlias}.operatorType,
      identifiers: $${initialAlias}.identifiers,
      estimatedRows: $${initialAlias}.estimatedRows
    })
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
      estimatedRows: summary.plan.arguments.EstimatedRows,
    },
    ...childrenParams,
  };
  return [statement, params];
};

const saveExplainAsync = async (result, queryId) => {
  const [statement, params] = getCypherForSaveExplain(result, queryId);
  const session = explainDriver.session();
  console.log('save?', statement, params);
  try {
    return await writeTransactionAsync(session, statement, params);
  } catch {
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
  } catch {
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
    ];
    for (let i = 0; i < createIndices.length; i++) {
      await writeTransactionAsync(session, createIndices[i]);
    }
  } catch {
    console.error('ERROR: Unable to init indices');
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
};
