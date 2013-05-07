// Circularly linked list (some functions copied from http://blog.jcoglan.com/2007/07/23/writing-a-linked-list-in-javascript/)

function LinkedList() {}
LinkedList.prototype = {
  length: 0,
  first: null,
  last: null
};

LinkedList.Circular = function() {};
LinkedList.Circular.prototype = new LinkedList();

LinkedList.Circular.prototype.append = function(node) {
  if (this.first === null) {
    node.prev = node;
    node.next = node;
    this.first = node;
    this.last = node;
  } else {
    node.prev = this.last;
    node.next = this.first;
    this.first.prev = node;
    this.last.next = node;
    this.last = node;
  }
  this.length++;
};

LinkedList.Circular.prototype.insertAfter = function(node, newNode) {
  newNode.prev = node;
  newNode.next = node.next;
  node.next.prev = newNode;
  node.next = newNode;
  if (newNode.prev == this.last) { this.last = newNode; }
  this.length++;
};

LinkedList.Circular.prototype.insertBefore = function(node, newNode) {
  newNode.next = node;
  newNode.prev = node.prev;
  node.prev.next = newNode;
  node.prev = newNode;
  if (newNode.next == this.first) { this.first = newNode; }
  this.length++;
};

LinkedList.Circular.prototype.remove = function(node) {
  if (this.length > 1) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    if (node == this.first) { this.first = node.next; }
    if (node == this.last) { this.last = node.prev; }
  } else {
    this.first = null;
    this.last = null;
  }
  node.prev = null;
  node.next = null;
  this.length--;
};


LinkedList.Circular.prototype.reverse = function() {
  if (this.length == 1) {
    return;
  }
  var node = this.first;
  var newNode = null;
  do {
    newNode = node.next;
    node.next = node.prev;
    node.prev = newNode;
    node = newNode;
  } while (node != this.last);
  this.first = this.last;
  this.last = this.first.prev;
};

LinkedList.Node = function(data) {
  this.prev = null; this.next = null;
  this.data = data;
};