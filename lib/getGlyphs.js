var Promise = require("bluebird"),
  getIconList = require("./getIconList"),
  getFontData = require("./getFontData");

function getGlyphs() {
  return Promise.all([getIconList(), getFontData()]).spread(function (icons, fontData) {

    return icons.map(function (icon) {
      return {
        id: icon.id,
        unicodeHex: icon.unicodeHex,
        unicodeDec: icon.unicodeDec,
        data: fontData[icon.unicodeDec].data
      }
    });

  });
}

module.exports = getGlyphs;
