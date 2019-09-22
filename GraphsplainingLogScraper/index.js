const fs = require('fs');
const graphUtils = require('./graph_utils');
let currentEntry = '';
let isAdding = false;
let logTime = '';
const logDateTimeFormat = /(?<date>\d{4}-\d{2}-\d{2}) (?<time>\d{2}:\d{2}:\d{2}\.\d{3}\+\d{4})/;
process.stdin.setEncoding('utf8');

const isNewEntry = (line) => {
  return logDateTimeFormat.test(line);
};

const isStaleQuery = (line) => {
  return line.indexOf('Discarded stale plan from the plan cache') > -1;
};

const queryLogAvailable = () => {
  return fs.existsSync('/neo4j_logs/query.log');
};

const getLogTime = (line) => {
  const match = logDateTimeFormat.exec(line);
  if (match) {
    return `${match.groups.date}T${match.groups.time}`;
  }
};

const handleCompletedStaleQuery = (query, logTime) => {
  graphUtils.setQueryExplainMeAsync(query, logTime);
};

const checkDebugLine = (line) => {
  if (isNewEntry(line)) {
    if (isAdding) {
      isAdding = false;
      console.log('added:', currentEntry);
      console.log('at: ', logTime);
      handleCompletedStaleQuery(currentEntry, logTime);
      currentEntry = '';
    }
    if (isStaleQuery(line)) {
      logTime = getLogTime(line);
      currentEntry = line.replace(/^.+?plan cache after \d+ seconds: /, '');
      isAdding = true;
    }
  } else if (isAdding) {
    currentEntry = `${currentEntry}
    ${line}`;
  }
};

process.stdin.on('data', (lines) => {
  if (process.env.LOG_TYPE === 'debug') {
    lines.split(/\n/).forEach(checkDebugLine);
  }
});

process.on('SIGINT', () => {
  console.log('Stop received.... stopping...');
  process.exit(0);
});
