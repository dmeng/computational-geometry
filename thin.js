const WIDTH = 500;
const HEIGHT = 500;
const DX = [-1,0,1,0];
const DY = [0,-1,0,1];

canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var numRows = 0;
var numCols = 0;
var tileSize, left, up;

//var grid = [[false, false, true, true, true],
//            [true, true, true, false, true],
//            [false, false, false, false, true],
//            [false, false, false, true, true],
//            [true, true, true, true, false]];
var grid = [];
var available = {};
var pStart = undefined;
var pEnd = undefined;

var path = [];   // an array of [row,col] tuples
var guards = []; // an array of [row,col,cornRow,cornCol] tuples

/*******************************************************
 * Helpers
 ******************************************************/

function getNeighbors(row, col) {
  if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) {
    return [];
  }
  var neighbors = [];
  for (var i = 0; i < DX.length; i++) {
    var r = row + DX[i];
    var c = col + DY[i];
    if (r >= 0 && r < grid.length &&
        c >= 0 && c < grid[0].length &&
        grid[r][c]) {
      neighbors.push([r, c]);
    }
  }
  return neighbors;
}

// calculates the degree of a vertex in the grid
// if allowEmpty == true, then don't worry if cell is empty
function degree(row, col, allowEmpty) {
  // don't want to find the degree of a non-vertex
  if (!allowEmpty && !grid[row][col]) {
    return -1;
  }
  return getNeighbors(row, col).length;
}

// manhattan distance
function dist(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
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
 * I/O
 ******************************************************/

// Checks if a cell can be added to the available set
function isValidNew(row, col) {
  if (row < 0 || row >= grid.length ||
      col < 0 || col >= grid[0].length ||
      grid[row][col]) {
    return false;
  }
  var deg = degree(row, col, true);
  return deg == 1;
}

// checks to see if cell is currently available
function isAvailable(row, col) {
  // nothing's on the grid yet
  if (pStart == undefined) { // && pEnd == undefined)
    return true;
  }
  return (row + "," + col) in available;
}

// checks to see if cell is currently an endpoint
function isEndpoint(row, col) {
  return pStart != undefined && pStart[0] == row && pStart[1] == col ||
         pEnd != undefined && pEnd[0] == row && pEnd[1] == col;
}

// set new available points
function resetAvailable() {
  available = {};
  guards = [];
  for (var i = 0; i < DX.length; i++) {
    var r1 = pStart[0] + DX[i];
    var c1 = pStart[1] + DY[i];
    var r2 = pEnd[0] + DX[i];
    var c2 = pEnd[1] + DY[i];
    if (isValidNew(r1,c1)) {
      available[r1 + "," + c1] = true;
    }
    if (isValidNew(r2,c2)) {
      available[r2 + "," + c2] = true;
    }
  }
}

// adds an available cell
function addAvailable(row, col) {
  // set new endpoints
  if (pStart == undefined) {
    pStart = [row, col];
    pEnd = [row, col];
  } else if (dist(row, col, pStart[0], pStart[1]) == 1) {
    pStart[0] = row;
    pStart[1] = col;
  } else {
    pEnd[0] = row;
    pEnd[1] = col;
  }
  grid[row][col] = true;
  resetAvailable();
}

function removeEndpoint(row, col) {
  grid[row][col] = false;
  var neighbors = getNeighbors(row, col);
  if (neighbors.length == 0) {
    // no more cells are highlighted
    pStart = undefined;
    pEnd = undefined;
  } else { // neighbors.length == 1
    // update endpoints
    var newEndpoint = neighbors[0];
    if (pStart[0] == row && pStart[1] == col) {
      pStart = newEndpoint;
    } else {
      pEnd = newEndpoint;
    }
    resetAvailable();
    console.log(pStart + "," + pEnd);
  }
}

/*******************************************************
 * Events
 ******************************************************/

function onMouseMove(event) {
  var row = parseInt((event.pageY - canvas.offsetTop) / tileSize);
  var col = parseInt((event.pageX - canvas.offsetLeft) / tileSize);
  if (isAvailable(row, col)) {
    drawGrid(row, col, "green");
  } else if (isEndpoint(row, col)) {
    drawGrid(row, col, "red");
  } else {
    drawGrid();
  }
}

function onMouseDown(event) {
  var row = parseInt((event.pageY - canvas.offsetTop) / tileSize);
  var col = parseInt((event.pageX - canvas.offsetLeft) / tileSize);
  if (isAvailable(row, col)) {
    addAvailable(row, col);
    drawGrid();
  } else if (isEndpoint(row, col)) {
    removeEndpoint(row, col);
    drawGrid();
  }
}

function onMouseOut(event) {
  drawGrid();
}

canvas.addEventListener('mousemove', onMouseMove, false);
canvas.addEventListener('mousedown', onMouseDown, false);
canvas.addEventListener('mouseout', onMouseOut, false);

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

function run() {
  calcPath();
  findPathGuards();
  drawGrid();
}

/*******************************************************
 * Drawing
 ******************************************************/

function drawGrid(hoverRow, hoverCol, hoverColor) {
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
  // draw hover
  if (hoverRow != undefined && hoverCol != undefined && hoverColor != undefined) {
    ctx.fillStyle = hoverColor;
    ctx.fillRect(left + hoverCol * tileSize, up + hoverRow * tileSize,
        tileSize, tileSize);
    ctx.strokeRect(left + hoverCol * tileSize, up + hoverRow * tileSize,
        tileSize, tileSize);
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
 * INIT
 ******************************************************/

function init(rows, cols) {
  if (rows != undefined && cols != undefined) {
    numRows = rows;
    numCols = cols;
  }
  tileSize = Math.min(WIDTH / numCols, HEIGHT / numRows);
  left = (WIDTH - numCols * tileSize) / 2;
  up = (HEIGHT - numRows * tileSize) / 2;
  grid = [];
  for (var i = 0; i < numRows; i++) {
    grid.push([]);
    for (var j = 0; j < numCols; j++) {
      grid[i].push(false);
    }
  }
  available = {};
  guards = [];
  pStart = undefined;
  pEnd = undefined;
  drawGrid();
}
init(5, 5);
