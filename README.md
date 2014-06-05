Font-Awesome-SVG-PNG
====================

This project provides a Font-Awesome build split to individual SVG and PNG files of different sizes along with Node.JS based generator to generate any other colors and sizes combinations.

##What is Font-Awesome?
Font Awesome is a full suite of 439 pictographic icons for easy scalable vector graphics on websites, created and
maintained by [Dave Gandy](http://twitter.com/davegandy). Stay up to date [@fontawesome](http://twitter.com/fontawesome).

Get started at http://fontawesome.io!

##License
- The Font Awesome font is licensed under the SIL OFL 1.1:
  - http://scripts.sil.org/OFL
- Font-Awesome-SVG-PNG is licensed under the MIT license

## How to use?
You may use already generated icons in `white` and `black` directories. You can also generate your own set:

Note: you need to have a command `rsvg-convert` available.

Install by `npm install -g font-awesome-svg-png`:

The following command will generate a red set of icons at sizes of 128 and 256 pixels in directory `red`:
`font-awesome-svg-png --color red --sizes 128,256`

## Windows support
Everything should work once you have `rsvg-convert.exe`. You may get it from https://osspack32.googlecode.com/files/rsvg-convert.exe and move to `%PATH%`.

## MacOSX support
```
sudo port install librsvg
```
That should give the necessary `rsvg-convert` command.

##Authors
  Damian Kaczmarek <damian@codecharm.co.uk>
