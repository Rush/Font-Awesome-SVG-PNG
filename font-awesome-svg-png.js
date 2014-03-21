#!/usr/bin/env node
var fs = require('graceful-fs');


var template =
'<svg width="{width}" height="{height}" viewBox="{shiftX} {shiftY} {width} {height}" xmlns="http://www.w3.org/2000/svg">' +
'<g transform="scale(1 -1) translate(0 -1280)">' +
'<path d="{path}" fill="{color}" />' +
'</g>' +
'</svg>';

var spawn = require('child_process').spawn;
var http = require('http');
var request = require('request');
var yaml = require('js-yaml');
var extend = require('extend');

var pathModule = require('path');
var async = require('async');

var code2name = {};

var argv = require('optimist').usage("Usage: $0 -color white").demand(["color"]).describe('sizes', "Provide comma separated sizes to generate").default({sizes: "16,22,24,32,48,64,128,256"}).argv;

function run() {
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

  var PIXEL = 128;

  function generateIcon(name, path, params, cb) {
    var out = template.substr(0);
    out = out.replace("{path}", path);

    function getTemplate(options) {
      params = extend({}, params, {
        shiftX: -(14*PIXEL - params.advWidth)/2 - options.paddingLeft,
        shiftY: -2*PIXEL - options.paddingTop,
        width: 14*PIXEL + options.paddingLeft + options.paddingRight,
        height: 14*PIXEL + options.paddingBottom + options.paddingTop,
      });
      out = out.substr(0);
      Object.keys(params).forEach(function(key) {
        out = out.replace(new RegExp("{" + key + "}", 'g'), params[key]);
      });
      return out;
    }

    function optionsForSize(siz) {
      var padding;

      var ns = [1, 2, 4, 8, 16];
      for(var i = 0;i < ns.length;++i) {
        var n = ns[i];
        if(siz > n*14 && siz <= n*16) {
          padding = (siz - n*14)/2 * PIXEL;
        }
        else
          continue;

        if(padding - parseInt(padding) > 0) {
          padding = 0;
        }
        return {
          paddingTop: padding,
          paddingBottom: padding,
          paddingLeft: padding,
          paddingRight: padding,
        };
      };
      return {
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0
      };
    }


    console.log("Generating icon", name);

    async.eachSeries(sizes, function(siz, cb) {
      var rsvgConvert;
      rsvgConvert = spawn('rsvg-convert', ['-f', 'png', '-w', siz, '-o', pathModule.join(argv.color, 'png', siz.toString(), name+'.png')]);
      rsvgConvert.stdin.end(getTemplate(optionsForSize(siz)));
      rsvgConvert.once('error', cb);
      rsvgConvert.once('exit', cb);
    }, cb);
    var outSvg = fs.createWriteStream(pathModule.join(argv.color, 'svg', name + '.svg'));
    outSvg.end(getTemplate({
      paddingTop: 0,
      paddingLeft: 0,
      paddingBottom: 0,
      paddingRight: 0
    }));
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
}

var convertTest = spawn('rsvg-convert', ['--help']);
convertTest.once('error', function() {
  console.warn("Error: cannot start `rsvg-convert` command. Please install it or verify that it is in your PATH.");
});
convertTest.once('exit', run);
