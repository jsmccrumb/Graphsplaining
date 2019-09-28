const parseQueryLog = (logEntry) => {
  console.log('Query log entry: ', logEntry);
  console.log('Split on \\t: ', logEntry.split(/\t/));
};

module.exports = {
  parseQueryLog,
};
