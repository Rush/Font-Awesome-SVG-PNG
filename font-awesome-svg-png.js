#!/usr/bin/env node
var fs = require('graceful-fs');

var template =
'<svg width="1792" height="1792" viewBox="{shiftX} -256 1792 1792">' +
'<g transform="scale(1 -1) translate(0 -1280)">' +
'<path d="{path}" fill="{color}" />' +
'</g>' +
'</svg>';

var spawn = require('child_process').spawn;
var http = require('http');
var request = require('request');
var yaml = require('js-yaml');


var pathModule = require('path');
var async = require('async');

var code2name = {};

var argv = require('optimist').usage("Usage: $0 -color white").demand(["color"]).describe('sizes', "Provide comma separated sizes to generate").default({sizes: "16,22,24,32,48,64,128,256"}).argv;

var sizes = argv.sizes.toString().split(',');
function mkdir(dir) {
  try {
    fs.mkdirSync(dir);
  } catch(err) {
    if(err.code != 'EEXIST')
      throw err
  }
}

mkdir(argv.color);
mkdir(pathModule.join(argv.color, 'svg'));
mkdir(pathModule.join(argv.color, 'png'));
sizes.forEach(function(siz) {
    mkdir(pathModule.join(argv.color, 'png', siz.toString()));
});

function generateIcon(name, path, params, cb) {
  var out = template.substr(0);
  out = out.replace("{path}", path);
  out = out.replace("{shiftX}", -(1792 - params.advWidth)/2);
	Object.keys(params).forEach(function(key) {
		out = out.replace("{" + key + "}", params[key]);
	});
  console.log("Generating icon", name);

  async.eachSeries(sizes, function(siz, cb) {
    var rsvgConvert;
		rsvgConvert = spawn('rsvg-convdert', ['-f', 'png', '-w', siz]);
    var outStream = fs.createWriteStream(pathModule.join(argv.color, 'png', siz.toString(), name + '.png'), { flags: 'w',  encoding: "binary"});
    rsvgConvert.stdout.pipe(outStream);
    rsvgConvert.stdin.end(out);
		rsvgConvert.once('error', cb);
    rsvgConvert.once('exit', cb);
  }, cb);
  var outSvg = fs.createWriteStream(pathModule.join(argv.color, 'svg', name + '.svg'));
  outSvg.end(out);
}

console.log("Downloading latest icons.yml ...");
request('https://raw2.github.com/FortAwesome/Font-Awesome/master/src/icons.yml', function(error, response, iconsYaml) {
  console.log("Downloading latest fontawesome-webfont.svg ...");
  request('https://raw2.github.com/FortAwesome/Font-Awesome/master/fonts/fontawesome-webfont.svg', function(error, response, fontData) {
    fontData = fontData.toString('utf8');
    var icons = yaml.safeLoad(iconsYaml).icons;
    icons.forEach(function(icon) {
      code2name[icon.unicode] = icon.id;
    });

    lines = fontData.split('\n');

    async.eachLimit(lines, 4, function(line, cb) {
      var m = line.match(/^<glyph unicode="&#x([^"]+);"\s*(?:horiz-adv-x="(\d+)")?\s*d="([^"]+)"/);

      if(m) {
        var str = m[1];
        if(code2name[str]) {
          generateIcon(code2name[str], m[3], {advWidth: m[2]?m[2]:1536, color: argv.color }, cb);
        }
        else {
          cb();
        }
      }
      else
        cb();
    }, function(err, cb) {
      if(err) {
				console.log("Make sure 'rsvg-convert' command is available in the PATH");
        return console.log("Error occured:", err);
      }
      console.log("All generated");
    });

  });
});





