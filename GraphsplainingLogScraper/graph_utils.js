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

/**
 * Merge :Statement on queryId, set :ExplainMe
 */
const setQueryExplainMeAsync = async (query, logTime) => {
  const id = queryId(query);
  const cypher = `// merge on queryId
    MERGE (s:Statement {queryId: $id})
      ON CREATE SET
        s.text = $query,
        s.createdOn = datetime()
    SET s.lastLogTime = datetime($logTime),
      s:ExplainMe`;
  const session = explainDriver.session();
  try {
    const result = await writeTransactionAsync(session,
        cypher,
        {id, query, logTime});
  } catch {
    console.error('ERROR: unable to save :ExplainMe');
  } finally {
    session.close();
  }
};

/**
 * Add :Stale label to a query
 */
const setQueryStaleAsync = async (query, logTime) => {
  const id = queryId(query);
  const cypher = `// merge on queryId and set :Stale
    MERGE (s:Statement {queryId: $id})
      ON CREATE SET
        s.text = $query,
        s.createdOn = datetime()
    SET s.lastLogTime = datetime($logTime),
      s:Stale`;
  const session = explainDriver.session();
  try {
    const result = await writeTransactionAsync(session,
        cypher,
        {id, query, logTime});
  } catch {
    console.error('ERROR: unable to save :Stale');
  } finally {
    session.close();
  }
};

/**
 * Merge :Statement on queryId, set :ExplainMe on create
 * or if Statement is :Stale
 */
const setQueryExplainMeIfStaleAsync = async (query, logTime) => {
  const id = queryId(query);
  const cypher = `// merge on queryId
    MERGE (s:Statement {queryId: $id})
      ON CREATE SET
        s.text = $query,
        s.createdOn = datetime()
    SET s.lastLogTime = datetime($logTime)
    WITH s WHERE s:Stale
    SET s:ExplainMe`;
  const session = explainDriver.session();
  try {
    const result = await writeTransactionAsync(session,
        cypher,
        {id, query, logTime});
  } catch {
    console.error('ERROR: unable to save :ExplainMe');
  } finally {
    session.close();
  }
};

const saveQueryLogAsync = async (queryLog) => {
  const cypher = `// create the query and query log
    MERGE (statement:Statement {queryId: $id})
      ON CREATE SET statement.text = $queryLog.query,
        statement:ExplainMe
    MERGE (statement)<-[:LOGS]-(ql:QueryLog {createdOn: datetime({date: date($queryLog.date), time: time($queryLog.time)})})
    SET ql.logLevel = $queryLog.logLevel,
      ql.queryTime = toInteger($queryLog.queryTime),
      ql.planning = toInteger($queryLog.planning),
      ql.waiting = toInteger($queryLog.waiting),
      ql.cpu = toInteger($queryLog.cpu),
      ql.pageHits = toInteger($queryLog.pageHits),
      ql.pageFaults = toInteger($queryLog.pageFaults),
      ql.protocol = $queryLog.protocol,
      ql.user = $queryLog.user,
      ql.driverVersion = $queryLog.driverVersion,
      ql.itemAtIndexFour = $queryLog.itemAtIndexFour,
      ql.clientIP = $queryLog.clientIP,
      ql.server = $queryLog.server,
      ql.query = $queryLog.query
    WITH statement WHERE statement:Stale
    SET statement:ExplainMe REMOVE statement:State`;
  const id = queryId(queryLog.query);
  const session = explainDriver.session();
  try {
    await writeTransactionAsync(session, cypher, {id, queryLog});
  } catch (e) {
    console.error('Unable to save query log entry', e);
  } finally {
    session.close();
  }
};

module.exports = {
  removeComments,
  queryId,
  testConnectionsAsync,
  setQueryExplainMeAsync,
  setQueryStaleAsync,
  setQueryExplainMeIfStaleAsync,
  saveQueryLogAsync,
};
