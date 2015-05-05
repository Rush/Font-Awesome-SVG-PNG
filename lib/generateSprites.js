var Promise = require("bluebird"),
  fs = require('graceful-fs'),
  SVGO = require('svgo'),
  pathModule = require('path'),
  mkdirp = require("mkdirp"),
  getIconSvg = require("./getIconSvg");

var svgo = new SVGO({
  removeViewBox: false
});

function generateSprite(name, params) {

  return new Promise(function(resolve, reject) {
    svgo.optimize(getIconSvg(params), function(result) {

      var viewBox = result.data.match(/viewBox="(.*?)"/)[0];
      var m = result.data.match('(<path.*\/>)');
      var svgPath = '<symbol id="fa-' + name + '" ' + viewBox + '>' + m[1] + '</symbol>';

      resolve(svgPath.replace(/\s*fill="[^"]+"/, ''));
    });
  });
}

function generateSprites(glyphs, params) {
  mkdirp.sync(params.destFolder);
  var outPath = pathModule.join(params.destFolder, 'sprites.svg');
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
    outSvgSheet.write('<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">\n');
    outSvgSheet.write('\t' + lines.join('\n\t'));
    outSvgSheet.end('\n<\/svg>\n');
  });
}

module.exports = generateSprites;
