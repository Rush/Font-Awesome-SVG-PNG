#!/usr/bin/env node

var Promise = require("bluebird"),
  optimist = require("optimist"),
  getGlyphs = require("./lib/getGlyphs"),
  libFontAwesome = require("./index");

var argv = optimist
  .usage("Usage:\n  $0 --sprites\n  $0 --color white --no-png\n  $0 --color black --no-svg\n  $0 --sprites --color black,white --optipng\n  $0 --list")
  .describe('sizes', "Provide comma separated sizes to generate")
  .describe('color', "Provide color or colors, e.g. --color black,white")
  .describe('sprites', 'Generate sprites.svg to use SVG as icons (http://tympanus.net/codrops/2013/11/27/svg-icons-ftw/)')
  .describe('nopadding', "Do not add padding for PNG pixel perfection")
  .describe('png', "Generate PNG files")
  .describe('optipng', "Run each file through optipng (need to be installed)")
  .describe('svg', "Generate SVG files")
  .describe('icons', "Optional list of icons to generate, e.g. --icons phone,star")
  .describe('dest', "Output folder")
  .describe('list', "List available icons")
  .describe('help', "Show this help screen")
  .default({
    sizes: "16,22,24,32,48,64,128,256",
    sprites: false,
    nopadding: false,
    optipng: false,
    png: true,
    svg: true,
    dest: "./"
  }).argv;

if (argv.help) {
  console.log(optimist.help());
  return;
}

if (argv.list) {
  getGlyphs().then(function (glyphs) {
    console.log(glyphs.map(function (glyphs) {
      return glyphs.id;
    }));
  });
  return;
}

if (!argv.sprites && !argv.color) {
  console.log(optimist.help());
  console.error("Error: either --sprites or --color param must be set.");
  return;
}

if (argv.color && !argv.png && !argv.svg) {
  console.log(optimist.help());
  console.error("Error: at least one of --png or --svg must be set when --color is set.");
  return;
}

var commandChecks = [];
// @todo: add optipng into command checks
if (argv.color && argv.png) {
  commandChecks.push(new Promise(function (resolve, reject) {
// @todo: surely there's a module in npm that allows to do command checks automagically?
    var convertTest = require('child_process').spawn('rsvg-convert', ['--help']);
    convertTest.once('error', function () {
      throw Error("Error: cannot start `rsvg-convert` command. Please install it or verify that it is in your PATH.");
    });
    convertTest.once('exit', function (code) {
      if (code) return reject();
      resolve();
    });
  }));
}

Promise.all(commandChecks).then(function () {
  return libFontAwesome.generate(argv);
}).catch(function (err) {
  console.error("Cought error", err);
});
