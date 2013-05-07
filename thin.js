const WIDTH = 500;
const HEIGHT = 500;

canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var numRows = 5;
var numCols = 5;
var tileSize, left, up;

var grid = [[false, false, true, true, true],
            [true, true, true, false, true],
            [false, false, false, false, true],
            [false, false, false, true, true],
            [true, true, true, true, false]];

var path = [];   // an array of [row,col] tuples
var guards = []; // an array of [row,col,corner] tuples

/*******************************************************
 * Helpers
 ******************************************************/

// calculates the degree of a vertex in the grid
function degree(row, col) {
  // don't want to find the degree of a non-vertex
  if (!grid[row][col]) {
    return -1;
  }
  var deg = -1;
  for (var r = Math.max(0, row - 1); r < Math.min(numRows, row + 2); r++) {
    for (var c = Math.max(0, col - 1); c < Math.min(numCols, col + 2); c++) {
      if (grid[r][c]) {
        deg++;
      }
    }
  }
  return deg;
}

// find a degree one vertex
function findEndpoint() {
  var prow = 0;
  var pcol = 0;
  for (var row = 0; row < numRows; row++) {
    for (var col = 0; col < numCols; col++) {
      if (degree(row, col) in [1,0]) {
        return [row,col];
      }
    }
  }
}

/*******************************************************
 * Path Algo
 ******************************************************/

// computes the path and store into path as a 1D list
// assumes traversal along path
function calcPath() {
  function calcPathRecurse(row, col) {
    // check constraints
    if (row >= 0 && row < numRows && col >= 0 && col < numCols &&
        grid[row][col]) {
      path.push([row,col]);
      grid[row][col] = false; // marks as seen
      calcPathRecurse(row-1, col); // up
      calcPathRecurse(row, col+1); // right
      calcPathRecurse(row+1, col); // down
      calcPathRecurse(row, col-1); // left
      grid[row][col] = true; // unmark
    }
  }
  path = [];
  start = findEndpoint();
  calcPathRecurse(start[0], start[1]);
}

// NOTE: this function isn't used...
// Finds the index of the next vertex in path with specified degree(s)
// limit is optional; if set, it won't go beyond that number of steps
// returns path.length if not found
function findNextDeg(start, degs, limit) {
  if (arguments.length < 3) {
    limit = path.length;
  }
  var i = start;
  for (; limit > 0 && i < path.length; i++) {
    var row = path[i][0];
    var col = path[i][1];
    if (degree(row, col) in degs) {
      return i;
    }
    limit--;
  }
  return i;
}

// true if element i in path is a corner
function isCorner(i) {
  return i > 0 && i < path.length - 1 &&
         path[i+1][0] - path[i-1][0] != 0 &&
         path[i+1][1] - path[i-1][1] != 0;
}

// finds the next corner in path
function findNextCorner(start) {
  var i = start;
  for (; !isCorner(i) && i < path.length; i++) {}
  return i;
}

// finds the next bridge in path, or stops after limit steps
function findNextBridge(start, limit) {
  var i = start;
  for (; limit > 0 && isCorner(i) && i < path.length; i++) {
    limit--;
  }
  return i;
}

// finds the corner of the pixel that the guard will be in
function getVertex(start) {
  if (start == 0 || start == path.length - 1) {
    return [0,0];
  }

  //var row = path[start][0];
  //var col = path[start][1];
  var prevRow = path[start-1][0];
  var prevCol = path[start-1][1];
  var nextRow = path[start+1][0];
  var nextCol = path[start+1][1];

  return [nextRow - prevRow, nextCol - prevCol];
}

// overarching algorithm
function findPathGuards() {
  var i = 0;
  guards = [];
  while (i < path.length) {
    var startSegment = i+1; // add one to skip over endpoint (edge case)
    var startCorners = findNextCorner(startSegment);
    var endCorners = findNextBridge(startCorners, 3);
    i = findNextCorner(endCorners);
    console.log(startSegment + " " + startCorners + " " + endCorners + " " + i);
    // edge case: no corners left
    if (startCorners == path.length) {
      startCorners--;
    }
    var vertex = getVertex(startCorners);
    guards.push([path[startCorners][0], path[startCorners][1],
        vertex[0], vertex[1]]);
  }
}

/*******************************************************
 * Drawing
 ******************************************************/

function drawGrid() {
  ctx.lineWidth = 3;
  ctx.strokeStyle = "lightgray";
  // draws the grid
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
  // draws the guards
  for (var i = 0; i < guards.length; i++) {
    console.log("guard: " + guards[i][0] + " " + guards[i][1]);
    var cellLeft = left + guards[i][1] * tileSize;
    var cellUp = up + guards[i][0] * tileSize;
    ctx.fillStyle = "green";
    ctx.fillRect(cellLeft, cellUp, tileSize, tileSize);
    ctx.strokeRect(cellLeft, cellUp, tileSize, tileSize);
    ctx.fillStyle = "red";
    ctx.beginPath();
    console.log("vertex: " + guards[i][3] + "," + guards[i][2]);
    ctx.arc(cellLeft + tileSize * (1 + guards[i][3]) / 2,
            cellUp + tileSize * (1 + guards[i][2]) / 2,
            tileSize / 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
}

/*******************************************************
 * I/O
 ******************************************************/

function updateSize() {
  tileSize = Math.min(WIDTH / numCols, HEIGHT / numRows);
  left = (WIDTH - numCols * tileSize) / 2;
  up = (HEIGHT - numRows * tileSize) / 2;
}

/*******************************************************
 * INIT
 ******************************************************/

updateSize();
calcPath();
findPathGuards();
drawGrid();
