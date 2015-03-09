var fs = require('graceful-fs');

var SVGO = require('svgo');

var Promise = require("bluebird");

var execFile = Promise.promisify(require('child_process').execFile);

var getGlyphs = require("./getGlyphs");

var svgo = new SVGO({
  removeViewBox: true
});

var template =
  '<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">' +
  '<g transform="translate({shiftX} {shiftY})">' +
  '<g transform="scale(1 -1) translate(0 -1280)">' +
  '<path d="{path}" fill="{color}" />' +
  '</g></g>' +
  '</svg>';

var spawn = require('child_process').spawn;
var http = require('http');
var extend = require('extend');

var pathModule = require('path');

function run(argv) {
  var color = argv.color;

  var sizes = (argv.sizes || '').toString().split(',');
  function mkdir(dir) {
    try {
      fs.mkdirSync(dir);
    } catch(err) {
      if(err.code != 'EEXIST')
        throw err
    }
  }

  var PIXEL = 128;


  function getTemplate(options, params) {
    var out = template.substr(0);
    params = extend({}, params, {
      shiftX: -(-(14*PIXEL - params.advWidth)/2 - options.paddingLeft),
      shiftY: -(-2*PIXEL - options.paddingTop),
      width: 14*PIXEL + options.paddingLeft + options.paddingRight,
      height: 14*PIXEL + options.paddingBottom + options.paddingTop
    });
    out = out.substr(0);
    Object.keys(params).forEach(function(key) {
      out = out.replace(new RegExp("{" + key + "}", 'g'), params[key]);
    });
    return out;
  }

  function optionsForSize(siz) {
    var padding = 0;
    if(!argv.nopadding) {
      var pad = parseInt(siz / 14)*14;
      padding = ((siz - pad) / 2) * (PIXEL/2);
    }

    return {
      paddingTop: padding,
      paddingBottom: padding,
      paddingLeft: padding,
      paddingRight: padding
    };
  }

  function generatePng(siz, name, params) {
    return new Promise(function(resolve, reject) {
      var rsvgConvert;
      var color = params.color;
      var svgCode = getTemplate(optionsForSize(siz), params);
      var filename = pathModule.join(color, 'png', siz.toString(), name+'.png');
      rsvgConvert = spawn('rsvg-convert', ['-f', 'png', '-w', siz, '-o', filename]);
      if(process.env.INTERMEDIATE_SVG) {
        fs.writeFileSync(pathModule.join(color, 'png', siz.toString(), name+'.svg'), svgCode);
      }
      rsvgConvert.stdin.end(svgCode);
      rsvgConvert.once('error', reject);
      rsvgConvert.once('exit', function(code) {
        if(code) return reject(code);
        resolve(filename);
      });
    }).then(function(filename) {
        if(argv.optipng) {
          return execFile('optipng', [filename]).catch(function(err) {
            throw Error("Cannot run 'optipng' - is it installed? " + err.code);
          });
        }
      });
  }


  function generatePngs(sizes, name, params) {
    mkdir(pathModule.join(params.color));
    mkdir(pathModule.join(params.color, 'png'));
    return Promise.map(sizes, function(siz) {
      mkdir(pathModule.join(params.color, 'png', siz));
      return generatePng(siz, name, params);
    }, {concurrency: process.env['JOBS'] || 4});
  }

  function generateSvg(name, params) {
    mkdir(pathModule.join(params.color, 'svg'));
    return new Promise(function(resolve, reject) {
      var outSvg = fs.createWriteStream(pathModule.join(params.color, 'svg', name + '.svg'));
      svgo.optimize(getTemplate({
        paddingTop: 0,
        paddingLeft: 0,
        paddingBottom: 0,
        paddingRight: 0
      }, params), function(result) {
        outSvg.end(result.data);
        resolve();
      });
    });
  }

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


  function generateIcon(name, params) {
    console.log("Generating icon", name, "for color", params.color);
    var workChain = [];
    if(argv.png) {
      workChain.push(generatePngs(sizes, name, params));
    }
    if(argv.svg) {
      workChain.push(generateSvg(name, params));
    }
    return Promise.all(workChain);
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

  return getGlyphs().then(function (glyphs) {

    if (argv.icons) {
      glyphs = glyphs.filter(function (glyph) {
        return argv.icons.indexOf(glyph.id) >= 0;
      });
    }

    if (color) {
      var iconsPromise = Promise.map(glyphs, function (glyph) {
        return Promise.map(color.split(/,/), function (color) {
          return generateIcon(glyph.id, extend(true, {}, {
            advWidth: glyph.data['horiz-adv-x'] || 1536,
            path: glyph.data.d,
            color: color
          }));
        }, {concurrency: 1})
      });
    }

    if(argv.sprites) {
      var spritesPromise = generateSprites(glyphs);
    }

    return Promise.all([ iconsPromise, spritesPromise ]).then(function() {
      console.log('All done!');
    });

  });
}

module.exports = run;
