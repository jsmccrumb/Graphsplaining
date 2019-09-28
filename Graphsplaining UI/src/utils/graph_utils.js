import neo4j from 'neo4j-driver';

// v1.0.0 use hode coded driver, future version add login
const driver = neo4j.driver('bolt://localhost:17687',
    neo4j.auth.basic('neo4j', 'explain'));

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

const safeInteger = (neo4jInt) => {
  if (neo4j.integer.inSafeRange(neo4jInt)) {
    return neo4jInt.toNumber();
  } else {
    return neo4jInt.toString();
  }
};

const getQueryCountsAsync = async () => {
  const cyphers = [`// Get count of query log entries
    MATCH (ql:QueryLog)-[:LOGS]->(s)
    RETURN date(ql.createdOn) AS date, count(ql) AS queryLogs`,
    `// Get count of explains, and explains with violations
    MATCH (ex:Explain)
    WITH ex, CASE WHEN exists((ex)-[:VIOLATES]->()) THEN 1 ELSE 0 END as violatesCheck
    RETURN date(ex.createdOn) AS date, count(ex) AS explains, sum(violatesCheck) AS violatesCheck`
  ];
  const results = cyphers.map(async (cypher) => {
    const session = driver.session();
    try {
      return await readTransactionAsync(session, cypher);
    } catch (e) {
      console.error('Error getting query counts', e);
      return Promise.resolve(null);
    } finally {
      session.close();
    }
  });
  // return array of results instead of array of promises of results
  return await Promise.all(results);
};

const getLatestStatsAsync = async () => {
  const cypher = `// get info about the latest explain per statement
    MATCH (s:Statement)<-[:EXPLAINS]-(ex)
    WITH s, ex ORDER BY ex.createdOn DESC
    WITH s, head(collect(ex)) as latestExplain
    WITH exists((latestExplain)-[:VIOLATES]->()) AS hasViolation,
         exists((latestExplain)-[:COULD_INDEX]->()) AS hasIndex,
         count(*) AS count
    RETURN hasViolation, hasIndex, count`;
  const session = driver.session();
  try {
    return await readTransactionAsync(session, cypher);
  } catch (e) {
    console.error('Error getting latest stats', e);
    return Promise.resolve(null);
  } finally {
    session.close();
  }
};

export default {
  getQueryCountsAsync,
  getLatestStatsAsync,
  safeInteger,
};
