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

module.exports = {
  removeComments,
  queryId,
  testConnectionsAsync,
  runExplainAsync,
};
