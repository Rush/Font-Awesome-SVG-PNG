var Promise = require("bluebird"),
  fs = require('graceful-fs'),
  mkdirp = require("mkdirp"),
  SVGO = require('svgo'),
  pathModule = require('path'),
  spawn = require('child_process').spawn,
  execFile = Promise.promisify(require('child_process').execFile),
  getIconSvg = require("./getIconSvg");

var svgo = new SVGO({
  removeViewBox: true
});

function generatePng(siz, name, params) {
  return new Promise(function(resolve, reject) {
    var rsvgConvert;
    var color = params.color;
    var svgCode = getIconSvg(params, siz);
    var filename = pathModule.join(params.destFolder, color, 'png', siz.toString(), name + '.png');
    rsvgConvert = spawn('rsvg-convert', ['-f', 'png', '-w', siz, '-o', filename]);
    if (process.env.INTERMEDIATE_SVG) {
      fs.writeFileSync(pathModule.join(params.destFolder, color, 'png', siz.toString(), name + '.svg'), svgCode);
    }
    rsvgConvert.stdin.end(svgCode);
    rsvgConvert.once('error', reject);
    rsvgConvert.once('exit', function (code) {
      if (code) return reject(code);
      resolve(filename);
    });
  }).then(function (filename) {
      if (params.optipng) {
        return execFile('optipng', [filename]).catch(function (err) {
          throw Error("Cannot run 'optipng' - is it installed? " + err.code);
        });
      }
    });
}


function generatePngs(name, params) {
  return Promise.map(params.sizes, function (siz) {
    mkdirp.sync(pathModule.join(params.destFolder, params.color, 'png', siz));
    return generatePng(siz, name, params);
  }, {concurrency: process.env['JOBS'] || 4});
}

function generateSvg(name, params) {
  var svgFolder = pathModule.join(params.destFolder, params.color, 'svg');
  mkdirp.sync(svgFolder);

  return new Promise(function(resolve, reject) {
    var outSvg = fs.createWriteStream(pathModule.join(svgFolder, name + '.svg'));
    svgo.optimize(getIconSvg(params), function(result) {
      outSvg.end(result.data);
      resolve();
    });
  });
}

function generateIcon(params) {
  var name = params.id;
  console.log("Generating", params.color, name);
  var workChain = [];
  if(params.generatePng) {
    workChain.push(generatePngs(name, params));
  }
  if(params.generateSvg) {
    workChain.push(generateSvg(name, params));
  }
  return Promise.all(workChain).then(function () {
    return { id: name, color: params.color };
  });
}

module.exports = generateIcon;
