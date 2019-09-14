const graphUtils = require('./graph_utils');

test('removeComments removes comments', () => {
  const myQuery = `// Well this comment
  MATCH (n:Node) // also this one
  SET n.NoComments = true`;
  const withOutComment = `
  MATCH (n:Node) 
  SET n.NoComments = true`;
  expect(graphUtils.removeComments(myQuery)).toBe(withOutComment);
});

test('queryId returns same id no matter whitespace or comments or case', () => {
  const queries = [
    `// this comment
    MATCH (n:Node) RETURN n`,
    `MATCH(n:Node)RETURNn`,
    `// comment
    // comment
    // comment
    MATch (n:node) return n`,
  ];
  const ids = queries.map(q => graphUtils.queryId(q));
  // expect ids to be the same as ids filtered to the ones that match ids[0]
  // i.e. expect all the ids to be the same
  expect(ids.every(id => id === ids[0])).toBeTruthy();
});

test('graphUtils can connect to graph', async () => {
  const connections = await graphUtils.testConnectionsAsync();
  expect(connections.main).toBeTruthy();
  expect(connections.explain).toBeTruthy();
});

test('runExplainAsync returns explain plan for queries', async () => {
  // include a parameter in the return so it will fail to run if not explain
  const testQueries = [
    `EXPLAIN PROFILE MATCH (n) RETURN n, $foo`,
    `PROFILE MATCH (n) RETURN n, $foo`,
    `// Some comment
    PROFILE MATCH (n) RETURN n, $foo`,
    `// Some Comment
    profile profile match (n) return n, $foo`,
    `MATCH (n) return n, $foo`,
    `//Comment
    MATCH (n) RETURN n, $foo`,
    `// one last
    PROFILE
    PROfile MATCH (n) RETURN n, $foo`,
  ];
  await testQueries.forEach(async (q) => {
    const result = await graphUtils.runExplainAsync(q);
    expect(result.statement.plan).toBeTruthy();
  });
});

