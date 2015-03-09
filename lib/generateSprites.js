var Promise = require("bluebird"),
  fs = require('graceful-fs'),
  SVGO = require('svgo'),
  pathModule = require('path'),
  getTemplate = require("./getTemplate");

var svgo = new SVGO({
  removeViewBox: true
});

function generateSprite(name, params) {

  return new Promise(function(resolve, reject) {
    svgo.optimize(getTemplate({
      paddingTop: 0,
      paddingLeft: 0,
      paddingBottom: 0,
      paddingRight: 0
    }, params), function(result) {

      var m = result.data.match('(<path.*\/>)');

      var svgPath = m[1].replace('path', 'path id="fa-' + name + '"');

      resolve(svgPath.replace(/\s*fill="[^"]+"/, ''));
    });
  });
}

function generateSprites(glyphs) {
  var outPath = pathModule.join('sprites.svg');
  console.log('Generating sprites to', outPath);
  var workChain = [];
  glyphs.forEach(function(glyph) {
    workChain.push(generateSprite(glyph.id, {
      advWidth: glyph.data['horiz-adv-x'] || 1536,
      path: glyph.data.d
    }));
  });
  return Promise.all(workChain).then(function(lines) {
    var outSvgSheet = fs.createWriteStream(outPath);
    outSvgSheet.write('<svg height="0" width="0" style="position:absolute;margin-left: -100%;">\n');
    outSvgSheet.write(lines.join('\n'));
    outSvgSheet.end('\n<\/svg>\n');
  });
}

module.exports = generateSprites;
