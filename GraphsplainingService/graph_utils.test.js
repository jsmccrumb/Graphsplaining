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
