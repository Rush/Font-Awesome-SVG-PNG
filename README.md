Font-Awesome-SVG-PNG
====================

This project provides a Font-Awesome build split to individual SVG and PNG files of different sizes along with Node.JS based generator to generate any other colors and sizes combinations.

## What is Font-Awesome?
Font Awesome is a full suite of 605 pictographic icons for easy scalable vector graphics on websites, created and
maintained by [Dave Gandy](http://twitter.com/davegandy). Stay up to date [@fontawesome](http://twitter.com/fontawesome).

Get started at http://fontawesome.io!

## License
- The Font Awesome font is licensed under the SIL OFL 1.1:
  - http://scripts.sil.org/OFL
- Font-Awesome-SVG-PNG is licensed under the MIT license

## How to use?
You may use already generated icons in `white` and `black` directories. You can also generate your own set:

Note: you need to have a command `rsvg-convert` available.

Install via npm: `npm install -g font-awesome-svg-png`.

Install via Bower: `bower install font-awesome-svg-png`.

The following command will generate a red set of icons at sizes of 128 and 256 pixels in directory `red`:
`font-awesome-svg-png --color red --sizes 128,256`

## PNG creation

PNG creation depends on `rsvg-convert` command being in the path.

You can skip PNG creation with `--no-png`.

### Windows support
Everything should work once you have `rsvg-convert.exe`. You may get it from https://osspack32.googlecode.com/files/rsvg-convert.exe and move to `%PATH%`.

### Mac OS X support
```
sudo port install librsvg
... or ...
brew install librsvg
```
That should give the necessary `rsvg-convert` command.

WARNING: Starting from librsvg 2.40.11 and onwards `rsvg-convert` produces empty images due to a breaking change that was introduced. At moment there's no workaround but to revert to librsvg 2.40.10 and below.

### Linux support
For Debian `rsvg-convert` in located in the `librsvg2-bin` package.
```sh
sudo apt-get install librsvg2-bin
```

##Authors
- Damian Kaczmarek <rush@rushbase.net> [@Rush](https://github.com/Rush)
- Dominykas Blyžė <hello@dominykas.com> [@dominykas](https://github.com/dominykas)
