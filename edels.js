const WIDTH = 500;
const HEIGHT = 500;

const CONVEX = 0;
const REFLEX = 1;
const ARTIFICIAL = 2;

canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var coords = [];
var loop = null;
var sortedX = [];
var numReflex = 0;
var guards = [];

var mouseX = -20;
var mouseY = -20;

var prep = true;
var showNodes = false;

/*******************************************************
 * Structure
 ******************************************************/

function newPoint(x, y, type, pair) {
  return {x:x, y:y, type:type, pair:pair};
}

/*******************************************************
 * Helper
 ******************************************************/

function roundNearestN(x, n) {
  return Math.round(x / n) * n;
}

function signum(x) {
  if (x > 0) {
    return 1;
  } else if (x < 0) {
    return -1;
  }
  return 0;
}

function isBetween(x, y, z) {
  return (x < y && y < z) ||
         (x > y && y > z);
}

function ccw(a, b, c) {
	return (c[1]-a[1]) * (b[0]-a[0]) > (b[1]-a[1]) * (c[0]-a[0]);
}

function intersect(a, b, c, d) {
  return (ccw(a, c, d) != ccw(b, c, d)) && (ccw(a, b, c) != ccw(a, b, d));
}

// Only for rectilinear detection
function colinear(a, b, c) {
  return a[0] == b[0] && b[0] == c[0] ||
         a[1] == b[1] && b[1] == c[1];
}

function polyIntersect(x, y, start, end) {
  for (var i = start; i < end; i++) {
    if (i == 1 && x == coords[0][0] && y == coords[0][1]) {
      continue;
    }
    if (intersect(coords[i-1], coords[i],
          coords[coords.length-1], [x, y])) {
      return true;
    }
  }
  return false;
}

/*******************************************************
 * I/O
 ******************************************************/

function setMouse(event) {
  mouseX = roundNearestN(event.pageX - canvas.offsetLeft, 2);
  mouseY = roundNearestN(event.pageY - canvas.offsetTop, 2);
  var last = coords.length - 1;
  if (coords.length > 0) {
    if (Math.abs(mouseX - coords[last][0]) <
        Math.abs(mouseY - coords[last][1])) {
      mouseX = coords[last][0];
    } else {
      mouseY = coords[last][1];
    }
  }
}

function onMouseMove(event) {
  if (prep) {
    setMouse(event);
    draw();
  }
}

function onMouseDown(event) {
  if (prep) {
    setMouse(event);
    if (coords.length < 2 ||
        !polyIntersect(mouseX, mouseY, 1, coords.length-1)) {
      var last = coords.length - 1;
      var newPoint = [mouseX, mouseY];
      if (coords.length >= 4 &&
          coords[0][0] == mouseX && coords[0][1] == mouseY) {
        if (colinear(coords[0], coords[1], coords[last])) {
          coords[0] = coords[last];
          coords.pop();
        }
        prep = false;
        run();
      } else {
        if (coords.length >= 2 && colinear(coords[last], coords[last-1],
            newPoint)) {
          coords[last] = newPoint;
        } else {
          coords.push(newPoint);
        }
      }
      draw();
    }
  }
}

function onMouseOut(event) {
  mouseX = -50;
  mouseY = -50;
  draw();
}

canvas.addEventListener('mousemove', onMouseMove, false);
canvas.addEventListener('mousedown', onMouseDown, false);
canvas.addEventListener('mouseout', onMouseOut, false);

/*******************************************************
 * Drawing
 ******************************************************/

function drawCircle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

function drawNodes() {
  var node = loop.first;
  do {
    if (node.data.type == CONVEX) {
      ctx.fillStyle = "red";
    } else if (node.data.type == REFLEX) {
      ctx.fillStyle = "green";
    } else {
      ctx.fillStyle = "blue";
    }
    drawCircle(node.data.x, node.data.y, 4);
    if (checkOddCut(node)) {
      ctx.beginPath();
      ctx.moveTo(node.data.x, node.data.y);
      ctx.lineTo(node.data.pair.data.x, node.data.pair.data.y);
      ctx.stroke();
    }
    node = node.next;
  } while (node != loop.first);
}

function drawGuards() {
  ctx.fillStyle = "yellow";
  for (var i = 0; i < guards.length; i++) {
    drawCircle(guards[i][0], guards[i][1], 6);
  }
}

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = "lightgray";

  // draw polygon
  if (coords.length > 0) {
    ctx.beginPath();
    ctx.moveTo(coords[0][0], coords[0][1]);
    for (var i = 1; i < coords.length; i++) {
      ctx.lineTo(coords[i][0], coords[i][1]);
    }
  }

  if (prep) {
    // draw mouse
    if (mouseX >= 0 && mouseY >= 0) {
      ctx.lineTo(mouseX, mouseY);
    }
    ctx.stroke();
    if (coords.length > 0 && mouseX == coords[0][0] && mouseY == coords[0][1]) {
      ctx.fillStyle = "green";
    } else {
      ctx.fillStyle = "red";
    }
    drawCircle(mouseX, mouseY, 4);
    if (coords.length > 2) {
      if (mouseX == coords[0][0]) {
        ctx.moveTo(coords[0][0], 0);
        ctx.lineTo(coords[0][0], HEIGHT);
        ctx.stroke();
      }
      if (mouseY == coords[0][1]) {
        ctx.moveTo(0, coords[0][1]);
        ctx.lineTo(WIDTH, coords[0][1]);
        ctx.stroke();
      }
    }
  } else {
    ctx.fillStyle = "darkgray";
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (showNodes) {
      drawNodes();
    }
    drawGuards();
  }
}


/*******************************************************
 * ALGO
 ******************************************************/

function initList() {
  loop = new LinkedList.Circular();
  var node = null;
  for (var i = 0; i < coords.length; i++) {
    node = new LinkedList.Node(newPoint(coords[i][0], coords[i][1]));
    loop.append(node);
    sortedX.push(node);
  }
  var node = loop.first;
  numReflex = 0;
  do {
    if (ccw([node.prev.data.x, node.prev.data.y],
            [node.data.x, node.data.y],
            [node.next.data.x, node.next.data.y])) {
      node.data.type = REFLEX;
      numReflex++;
    } else {
      node.data.type = CONVEX;
    }
    node = node.next;
  } while (node != loop.first);
}

function chipConvex() {
  var node = loop.first;
  do {
    if (node.data.type == CONVEX) {
      var dx1 = signum(node.prev.data.x - node.data.x);
      var dy1 = signum(node.prev.data.y - node.data.y);
      var dx2 = signum(node.next.data.x - node.data.x);
      var dy2 = signum(node.next.data.y - node.data.y);
      var newNode = new LinkedList.Node(
          newPoint(node.data.x + dx1, node.data.y + dy1, CONVEX));
      loop.insertBefore(node, newNode);
      sortedX.push(newNode);
      newNode = new LinkedList.Node(
          newPoint(node.data.x + dx2, node.data.y + dy2, CONVEX));
      loop.insertAfter(node, newNode);
      sortedX.push(newNode);
      node.data.x += dx1 + dx2;
      node.data.y += dy1 + dy2;
      node.data.type = REFLEX;
      numReflex++;
      console.log(numReflex);
      return;
    }
  } while (node != loop.first);
}

function sortData() {
  sortedX.sort(function(n1, n2) {
    if (n1.data.x == n2.data.x) {
      return n1.data.y - n2.data.y;
    }
    return n1.data.x - n2.data.x;
  });
}

function successfulInsert(node, idx) {
  var sNode = sortedX[idx];
  if (sNode == undefined || sNode.next == undefined) {
    console.log(idx + " " + sortedX.length);
  }
  var next = sNode.data.x == sNode.next.data.x;
  var nextNode = null;
  if (next) {
    nextNode = sNode.next;
  } else {
    nextNode = sNode.prev;
  }
  // TODO: does not check degenerate case
  do {
    if (isBetween(sNode.data.y, node.data.y, nextNode.data.y)) {
      var artNode = new LinkedList.Node(
          newPoint(sNode.data.x, node.data.y, ARTIFICIAL, node));
      node.data.pair = artNode;
      if (next) {
        loop.insertAfter(sNode, artNode);
      } else {
        loop.insertBefore(sNode, artNode);
      }
      return true;
    }
    sNode = nextNode;
    if (next) {
      nextNode = sNode.next;
    } else {
      nextNode = sNode.prev;
    }
  } while (nextNode.data.x == sNode.data.x);
  return false;
}

function createArtificial() {
  var node = loop.first;
  do {
    if (node.data.type == REFLEX) {
      var dx = signum(node.data.x - node.next.data.x) +
               signum(node.data.x - node.prev.data.x);
      var idx = sortedX.indexOf(node);
      while (sortedX[idx].data.x == node.data.x) {
        idx += dx;
      }
      while (!successfulInsert(node, idx)) {
        idx += 2 * dx;
      }
    }
    node = node.next;
  } while (node != loop.first);
}

function computeParity() {
  var node = loop.first;
  var counter = 0;
  do {
    if (node.data.type == ARTIFICIAL) {
      node.data.counter = counter;
    } else if (node.data.type == REFLEX) {
      counter++;
      node.data.counter = counter;
    }
    node = node.next;
  } while (node != loop.first);
}

function checkOddCut(node) {
  if (node.data.type == CONVEX) {
    return false;
  }
  var val = 0;
  if (node.data.type == REFLEX) {
    val = node.data.pair.data.counter - node.data.counter;
  } else {
    val = node.data.pair.data.counter - node.data.counter - 1;
  }
  if (val < 0) {
    val = -val - 1;
  }
  return val % 2;
}

function loopCut(node) {
  var lNode = node;
  var sorted = [];
  var canPairCross = true;
  do {
    lNode.data.seen = true;
    if (canPairCross && checkOddCut(lNode)) {
      lNode = lNode.data.pair;
      canPairCross = false;
    } else {
      if (canPairCross && lNode.data.type == REFLEX) {
        sorted.push(lNode);
      }
      canPairCross = true;
      lNode = lNode.next;
    }
  } while (lNode != node);
  sorted.sort(function(n1, n2) {
    if (n1.data.x == n2.data.x) {
      return n1.data.y - n2.data.y;
    }
    return n1.data.x - n2.data.x;
  });
  for (var i = 0; i < sorted.length; i += 2) {
    guards.push([sorted[i].data.x, sorted[i].data.y]);
  }
  if (sorted.length == 0) {
    guards.push([lNode.data.x, lNode.data.y]);
  }
}

function findGuards() {
  var node = loop.first;
  do {
    if (node.data.seen == undefined) {
      loopCut(node);
    }
    node = node.next;
  } while (node != loop.first);
}

function spliceList() {
  // TODO
}

function run() {
  initList();
  if (numReflex % 2 == 0) {
    chipConvex();
  }
  sortData();
  createArtificial();
  computeParity();
  findGuards();
}

function init() {
  coords = [];
  loop = null;
  sortedX = [];
  numReflex = 0;
  guards = [];
  
  mouseX = -20;
  mouseY = -20;
  
  prep = true;
  showNodes = false;
  draw();
}

draw();
