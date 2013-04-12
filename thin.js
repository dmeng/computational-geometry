const WIDTH = 500;
const HEIGHT = 500;

canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var numRows = 5;
var numCols = 5;
var tileSize, left, up;

var grid = [[false, true, false, false, false],
            [false, true, false, false, false],
            [false, true, false, false, false],
            [false, true, true, false, false],
            [false, false, true, true, false]];

function drawGrid() {
  ctx.lineWidth = 3;
  ctx.strokeStyle = "lightgray";
  for (var row = 0; row < numRows; row++) {
    for (var col = 0; col < numCols; col++) {
      var cellLeft = left + col * tileSize;
      var cellUp = up + row * tileSize;
      if (grid[row][col]) {
        ctx.fillStyle = "darkgray";
      } else {
        ctx.fillStyle = "black";
      }
      ctx.fillRect(cellLeft, cellUp, tileSize, tileSize);
      ctx.strokeRect(cellLeft, cellUp, tileSize, tileSize);
    }
  }
}

function updateSize() {
  tileSize = Math.min(WIDTH / numCols, HEIGHT / numRows);
  left = (WIDTH - numCols * tileSize) / 2;
  up = (HEIGHT - numRows * tileSize) / 2;
}

updateSize();
drawGrid();
