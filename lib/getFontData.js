var Promise = require("bluebird"),
  readFile = Promise.promisify(require("fs").readFile);

var SVG_FILE = require.resolve("font-awesome/fonts/fontawesome-webfont.svg");

function getFontData() {
  return readFile(SVG_FILE).then(function (fontData) {
    return fontData.toString("utf-8");
  });
}

module.exports = getFontData;
