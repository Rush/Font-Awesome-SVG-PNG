var extend = require('extend');

var template =
  '<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">' +
  '<g transform="translate({shiftX} {shiftY})">' +
  '<g transform="scale(1 -1) translate(0 -1280)">' +
  '<path d="{path}" fill="{color}" />' +
  '</g></g>' +
  '</svg>';

var PIXEL = 128;
function optionsForSize(siz, addPadding) {
  var padding = 0;

  if(addPadding && siz) {
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
function getIconSvg(params, size) {

  var options = optionsForSize(size, params.addPadding);

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

module.exports = getIconSvg;
