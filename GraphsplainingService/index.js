const graphUtils = require('./graph_utils');
let sleepTime = 60000;

const runExplainsAsync = async (queries) => {
  console.log('run queries', queries.length);
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    try {
      const result = await graphUtils.runExplainAsync(query.text);
      await graphUtils.saveExplainAsync(result, query.queryId);
    } catch (e) {
      console.error(`ERROR: Could not explain and save ${query.queryId}`);
    }
  }
  console.log('ran queries', queries.length);
  return true;
};

const getQueriesAsync = async () => {
  const result = await graphUtils.getQueriesToExplainAsync();
  const queries = [];
  if (result && result.records) {
    result.records.forEach(r => queries.push(r.get('query')));
  }
  return queries;
};

const graphsplainingAsync = async () => {
  const queries = await getQueriesAsync();
  if (queries.length > 0) {
    console.log('Time for some Graphsplaining');
    sleepTime = 100;
    await runExplainsAsync(queries);
  } else {
    console.log('No queries found');
    sleepTime = 60000;
  }
  // recall graphingsplaining after sleepTime has passed
  setTimeout(graphsplainingAsync, sleepTime);
};

console.log(`Starting Graphsplaing...
Will explain :ExplainMe from ${process.env.NEO4J_EXPLAIN_BOLT}
Against the graph at ${process.env.NEO4J_MAIN_BOLT}
Enjoy!`);

graphUtils.testConnectionsAsync().then(async ({main, explain}) => {
  if (main && explain) {
    await graphUtils.initIndicesAsync();
    await graphUtils.initPerformanceChecksAsync();
    graphsplainingAsync();
  } else {
    console.error('Graph connections are not ready, check env and graphs');
    process.exitCode = 1;
  }
});
