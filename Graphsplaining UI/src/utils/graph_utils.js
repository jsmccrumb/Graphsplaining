import neo4j from 'neo4j-driver';

// v1.0.0 use hode coded driver, future version add login
// note: currently hard coded to website
const driver = neo4j.driver('bolt://jacobmccrumb.com:17687',
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
  if (neo4jInt == null) return neo4jInt;
  if (neo4j.integer.inSafeRange(neo4jInt)) {
    return neo4jInt.toNumber == null ? neo4jInt : neo4jInt.toNumber();
  } else {
    return neo4jInt.toString();
  }
};

const getIndexRecommendations = async () => {
  const cypher = `
  MATCH (label)<-[:COULD_INDEX_LABEL]-(ex:Explain)-[:COULD_INDEX_PROPERTY]->(prop)
  RETURN label.labelName AS label, prop.expression AS expression`;
  const session = driver.session();
  try {
    const {records} = await readTransactionAsync(session, cypher);
    return Object.entries(records.map(r => ({label: r.get('label'), property: r.get('expression').split(/[. <>=]/)[1]}))
        .reduce((acc, r) => {
          if (acc[r.label]) {
            if (acc[r.label][r.property]) {
              acc[r.label][r.property]++;
            } else {
              acc[r.label][r.property] = 1;
            }
          } else {
            acc[r.label] = {[r.property]: 1};
          }
          return acc;
        }, {})).map(([label, obj]) => {
          return Object.entries(obj).map(([property, timesRecommended]) => ({label, property, timesRecommended}));
        }).reduce((acc, curr) => ([...acc, ...curr]), []);
  } catch (e) {
    console.error('Error getting potential indexes');
  } finally {
    session.close();
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
         exists((latestExplain)-[:COULD_INDEX_PROPERTY]->()) AS hasIndex,
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

const getPotentialBottlnecks = async () => {
  const cypher = `// get potential bottlenecks
    MATCH (s:Statement)<-[:EXPLAINS]-(ex)
    WITH s, ex ORDER BY ex.createdOn DESC
    WITH s, head(collect(ex)) as latestExplain
    WHERE exists((latestExplain)-[:VIOLATES]->())
    OPTIONAL MATCH (s)<-[:LOGS]-(ql)
	WITH s, latestExplain, sum(ql.queryTime) AS totalTime, count(ql) AS totalLogs, min(ql.queryTime) AS minTime, max(ql.queryTime) AS maxTime, avg(ql.queryTime) AS avgTime
    RETURN s.text AS statement, 
           size([(latestExplain)-[:VIOLATES]->(check) | check ]) AS violations, 
           avgTime, 
           maxTime,
           minTime`;
  const session = driver.session();
  try {
    return await readTransactionAsync(session, cypher);
  } catch (e) {
    console.error('Error getting potential bottlenecks', e);
    return Promise.resolve(null);
  } finally {
    session.close();
  }
};

const getPerformanceChecksAsync = async () => {
  const cypher = `// get all current performance checks
    MATCH (n:PerformanceCheck)
    RETURN n { .* } AS check`;
  const session = driver.session();
  try {
    return await readTransactionAsync(session, cypher);
  } catch (e) {
    console.error('Error getting performance checks', e);
  } finally {
    session.close();
  }
};

const violationCheckStart = 'MATCH (statement:Statement {queryId: $queryId})<-[:EXPLAINS]-(explain:Explain {createdOn: $createdOn})<-[:ENDS]-(lastPlan)';

const violationCheckExplains = (violationCheck) => {
  const cypher = `EXPLAIN ${violationCheckStart}
  ${violationCheck}`;
  const session = driver.session();
  console.log('checking');
  return readTransactionAsync(session, cypher)
    .then((resp) => {
      console.log('good');
      return true;
    }).catch((err) => {
      console.log('bad');
      return false;
    }).finally(() => {console.log('finally!'); session.close();});
};

const savePerformanceCheck = async (check) => {
  const cypher = `// only create check if doesn't exist with name
  OPTIONAL MATCH (c:PerformanceCheck {name: $check.name})
  WITH c WHERE c IS NULL
  CREATE (realCheck:PerformanceCheck {name: $check.name})
  SET realCheck += $check
  RETURN realCheck`;
  const session = driver.session();
  try {
    return await writeTransactionAsync(session, cypher, {check});
  } catch (e) {
    console.error('Error saving validation check', e);
  } finally {
    session.close();
  }
};

const performanceCheckExists = async (name) => {
  const cypher = 'MATCH (n:PerformanceCheck {name: $name}) RETURN n'
  const session = driver.session();
  try {
    const resp = (await readTransactionAsync(session, cypher, {name}))
    console.log(resp);
    return !(resp == null || resp.records == null || resp.records.length === 0);
  } catch (e) {
    console.error('Error confirming performance check exists', e);
    return true;
  } finally {
    session.close();
  }
};

const getQueryTimesAsync = async () => {
  const cypher = `
  MATCH (ql:QueryLog)
  WITH CASE
    WHEN ql.queryTime < 100 THEN '< 100ms'
    WHEN ql.queryTime < 300 THEN '< 300ms'
    WHEN ql.queryTime < 1000 THEN '< 1000ms'
    WHEN ql.queryTime < 3000 THEN '< 3000ms'
    WHEN ql.queryTime < 10000 THEN '< 10 sec'
    WHEN ql.queryTime < 60000 THEN '< 1 min'
    ELSE '> 1 min'
  END AS category, date(ql.createdOn) AS date, count(*) AS count
  RETURN category, date, count`;
  const session = driver.session();
  try {
    return await readTransactionAsync(session, cypher);
  } catch (e) {
    console.error('Error getting query times', e);
  } finally {
    session.close();
  }
};

export default {
  getQueryCountsAsync,
  getLatestStatsAsync,
  getPerformanceChecksAsync,
  safeInteger,
  violationCheckStart,
  violationCheckExplains,
  savePerformanceCheck,
  performanceCheckExists,
  getPotentialBottlnecks,
  getIndexRecommendations,
  getQueryTimesAsync,
};
