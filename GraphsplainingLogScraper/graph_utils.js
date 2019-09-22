const crypto = require('crypto');
const neo4j = require('neo4j-driver').v1;

const explainDriver = neo4j.driver(process.env.NEO4J_EXPLAIN_BOLT,
    neo4j.auth.basic(process.env.NEO4J_EXPLAIN_USER,
        process.env.NEO4J_EXPLAIN_PASS));

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
 * @return {boolean} connections.explain
 *     Whether connection to explain graph is ready
 */
const testConnectionsAsync = async () => {
  const connections = {
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

const setQueryExplainMeAsync = async (query, logTime) => {
  const id = queryId(query);
  const cypher = `// merge on queryId
    MERGE (s:Statement {queryId: $queryId})
      ON CREATE SET
        s.text = $query,
        s.createdOn = datetime()
    SET s:ExplainMe,
      s.lastLogTime = datetime($logTime)`;
  const session = explainDriver.session();
  try {
    const result = await writeTransactionAsync(session,
        cypher,
        {queryId: id, query, logTime});

  } catch {
    console.error('ERROR: unable to save :ExplainMe');
  } finally {
    session.close();
  }
};

module.exports = {
  removeComments,
  queryId,
  testConnectionsAsync,
  setQueryExplainMeAsync,
};
