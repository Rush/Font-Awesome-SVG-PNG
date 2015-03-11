var Promise = require("bluebird"),
  readFile = Promise.promisify(require("fs").readFile);

var LESS_FILE = require.resolve("font-awesome/less/variables.less");

var LESS_VARIABLE_REGEX = /@fa-var-([\w-]+):\s*"\\([0-9a-f]+)";/g;

function parseIconListFromLess(lines) {
  lines = lines.toString();
  var match, result = [];
  while (match = LESS_VARIABLE_REGEX.exec(lines)) {
    result.push({
      id: match[1],
      unicodeHex: match[2],
      unicodeDec: parseInt(match[2], 16)
    })
  }
  return result;
}

function getIconList() {
  return readFile(LESS_FILE).then(parseIconListFromLess);
}

module.exports = getIconList;
