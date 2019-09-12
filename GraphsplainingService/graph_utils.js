const crypto = require('crypto');
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


module.exports = {
  removeComments,
  queryId,
};
