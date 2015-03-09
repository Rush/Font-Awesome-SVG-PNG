var Promise = require("bluebird"),
  indexBy = require('lodash.indexby'),
  readFile = Promise.promisify(require("fs").readFile),
  parseXml = Promise.promisify(require("xml2js").parseString);

var SVG_FILE = require.resolve("font-awesome/fonts/fontawesome-webfont.svg");

function getFontData() {
  return readFile(SVG_FILE)
    .then(function (fontData) {
      return fontData.toString("utf-8");
    })
    .then(parseXml)
    .then(function (parsedXml) {
      return parsedXml.svg.defs[0].font[0].glyph;
    })
    .map(function (xmlGlyph) {
      return {
        data: xmlGlyph.$,
        unicodeDec: xmlGlyph.$.unicode.charCodeAt(0)
      };
    })
    .then(function (fontData) {
      return indexBy(fontData, "unicodeDec");
    });
}

module.exports = getFontData;
