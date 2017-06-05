var PIXEL = 128;
function optionsForSize(pixelWidth, pixelHeight, width, height, addPadding) {
  var horizontalPadding = 0;
  var verticalPadding = 0;

  if(addPadding && width && height) {
    var vPad = parseInt(height / pixelHeight)*pixelHeight;
    var scaledHeight = (height / vPad)*pixelHeight;
    
    verticalPadding = scaledHeight - pixelHeight;
    if(verticalPadding > 2) { // allow for vertical alignment for small values
      verticalPadding = 0;
    }
  }
  
  let paddingTop = (parseInt(verticalPadding / 2)) * PIXEL;
  let paddingBottom = verticalPadding*PIXEL - paddingTop;
      
  let paddingLeft = 0;
  let paddingRight = 0;
      
  // try to keep aspect ratio for originally square icons
  if(pixelWidth === pixelHeight) {
    paddingLeft = paddingTop;
    paddingRight = paddingBottom;
  }
  
  return {
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight
  };
}
function getIconSvg(params, size) {
  let {path, color, advWidth} = params;
  const PIXEL_WIDTH = advWidth > 2048 ? 18 : (advWidth > 1792 ? 16 : 14);
  const PIXEL_HEIGHT = 14;
  
  const BASE_WIDTH = PIXEL_WIDTH * PIXEL;
  const BASE_HEIGHT = PIXEL_HEIGHT * PIXEL;
  
  var options = optionsForSize(PIXEL_WIDTH, PIXEL_HEIGHT, 
    parseInt((BASE_WIDTH / BASE_HEIGHT) * size), size,
    params.addPadding);

  let {paddingLeft, paddingTop, paddingRight, paddingBottom} = options;  
  let shiftX = -(-(BASE_WIDTH - advWidth)/2 - paddingLeft);
  let shiftY = -(-2*PIXEL - paddingTop);  
  let width = BASE_WIDTH + paddingLeft + paddingRight;
  let height = BASE_HEIGHT + paddingBottom + paddingTop;
    
  // shiftX = Math.max(shiftX, 0);
  
  const result =
`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${shiftX} ${shiftY})">
  <g transform="scale(1 -1) translate(0 -1280)">
  <path d="${path}" fill="${color}" />
  </g></g>
</svg>`;
  
  return result;
}

module.exports = getIconSvg;
