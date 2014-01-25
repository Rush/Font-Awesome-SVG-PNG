#!/usr/bin/env node
var fs = require('graceful-fs');

var template =
'<svg width="1792" height="1792" viewBox="{shiftX} -256 1792 1792">' +
'<g transform="scale(1 -1) translate(0 -1280)">' +
'<path d="{path}" fill="white" />' +
'</g>' +
'</svg>';

var spawn = require('child_process').spawn;
var http = require('http');
var request = require('request');
var yaml = require('js-yaml');

var sizes = [16, 22, 24, 32, 48, 64, 128, 256];
var pathModule = require('path');

var async = require('async');

var code2name = {};

function mkdir(dir) {
  try {
    fs.mkdirSync(dir);
  } catch(err) {
    if(err.code != 'EEXIST')
      throw err
  }
}

mkdir('svg');
mkdir('png');
sizes.forEach(function(siz) {
    mkdir('png/' + siz);
});

function generateIcon(name, path, advWidth, cb) {
  var out = template.substr(0);
  out = out.replace("{path}", path);
  out = out.replace("{shiftX}", -(1792 - advWidth)/2);
  console.log("Generating icon", name);

  async.eachSeries(sizes, function(siz, cb) {
    var rsvgConvert = spawn('rsvg-convert', ['-f', 'png', '-w', siz]);
    var outStream = fs.createWriteStream(pathModule.join('png', siz.toString(), name + '.png'));
    rsvgConvert.stdout.pipe(outStream);
    rsvgConvert.stdin.end(out);
    rsvgConvert.once('exit', cb);
  }, cb);
  var outSvg = fs.createWriteStream('svg/' + name + '.svg');
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
          generateIcon(code2name[str], m[3], m[2]?m[2]:1536, cb);
        }
        else {
          cb();
        }
      }
      else
        cb();
    }, function(err, cb) {
      if(err) {
        return console.log("Error occured:", err);
      }
      console.log("All generated");
    });

  });
});






