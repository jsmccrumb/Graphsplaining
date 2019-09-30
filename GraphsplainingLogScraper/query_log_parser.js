const graphUtils = require('./graph_utils');

// TODO: If anyone finds out the specification for query log file,
// please create an enhancement with it ;)
const parseQueryLog = (logEntry) => {
  const splitEntry = logEntry.split(/\t/);
  // working with what I have... 8 entries seen so far
  if (splitEntry.length === 8) {
    const query = {
      ...parseIndex0(splitEntry[0]),
      ...parseIndex1(splitEntry[1]),
      ...parseIndex2(splitEntry[2]),
      ...parseIndex3(splitEntry[3]),
      ...parseIndex4(splitEntry[4]),
      ...parseIndex5(splitEntry[5]),
      ...parseIndex6(splitEntry[6]),
      ...parseIndex7(splitEntry[7]),
    };
    graphUtils.saveQueryLogAsync(query);
  }
};

/**
 * date, times, page hits
 */
const parseIndex0 = (item) => {
  const regex = /^(?<date>\d{4}-\d{2}-\d{2}) (?<time>\d{2}:\d{2}:\d{2}\.\d{3}\+\d{4}) (?<logLevel>[A-Z]+) +(?<queryTime>\d+) ms: *(?:\((?:planning: (?<planning>\d+))?,? ?(?:waiting: (?<waiting>\d+))?,? ?(?:cpu: (?<cpu>\d+))?\))?(?: ?- (?<pageHits>\d+) page hits, (?<pageFaults>\d+) page faults)?/;
  const groups = item.match(regex).groups;
  return groups;
};

// bolt? protocol..?
const parseIndex1 = (item) => {
  return {protocol: item};
};

// neo4j? user...?
const parseIndex2 = (item) => {
  return {user: item};
};

// 'neo4j-javascript/1.7.4' ... driver version?
const parseIndex3 = (item) => {
  return {driverVersion: item};
};

// blank...
const parseIndex4 = (item) => {
  return {itemAtIndexFour: item};
};

// client ip
const parseIndex5 = (item) => {
  return {clientIP: item};
};

// server
const parseIndex6 = (item) => {
  return {server: item};
};

/**
 * query and stuff
 */
const parseIndex7 = (item) => {
  return {query: item.split(/ - /)[1]};
};
module.exports = {
  parseQueryLog,
};
