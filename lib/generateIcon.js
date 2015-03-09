var Promise = require("bluebird"),
  fs = require('graceful-fs'),
  SVGO = require('svgo'),
  pathModule = require('path'),
  spawn = require('child_process').spawn,
  execFile = Promise.promisify(require('child_process').execFile),
  getTemplate = require("./getTemplate");


var svgo = new SVGO({
  removeViewBox: true
});


function mkdir(dir) {
  try {
    fs.mkdirSync(dir);
  } catch(err) {
    if(err.code != 'EEXIST')
      throw err
  }
}

var PIXEL = 128;
function optionsForSize(siz, addPadding) {
  var padding = 0;
  if(addPadding) {
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
    var svgCode = getTemplate(optionsForSize(siz, params.addPadding), params);
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
      if(params.optipng) {
        return execFile('optipng', [filename]).catch(function(err) {
          throw Error("Cannot run 'optipng' - is it installed? " + err.code);
        });
      }
    });
}


function generatePngs(name, params) {
  mkdir(pathModule.join(params.color));
  mkdir(pathModule.join(params.color, 'png'));
  return Promise.map(params.sizes, function(siz) {
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

function generateIcon(params) {
  var name = params.id;
  console.log("Generating icon", name, "for colors", params.color);
  var workChain = [];
  if(params.generatePng) {
    workChain.push(generatePngs(name, params));
  }
  if(params.generateSvg) {
    workChain.push(generateSvg(name, params));
  }
  return Promise.all(workChain);
}

module.exports = generateIcon;
