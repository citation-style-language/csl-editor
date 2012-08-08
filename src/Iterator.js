"use strict";



/* Iterates through a tree in depth first order
 *
 * Each node of the tree must contain a children array containing it's child nodes
 * 
 * Can retrieve the parent node of each child in the tree
 */
var CSLEDIT_Iterator = function (rootNode) {
	assert(this instanceof CSLEDIT_Iterator);

	this.rootNode = rootNode;
	this.nodeStack = [];
	this.finished = false;
	this.nextNode = null;
};

CSLEDIT_Iterator.prototype.next = function () {
	var topNode,
		nextNode,
		currentNode;

	nextNode = this.nextNode;
	this.nextNode = null;

	// used to implement hasNext
	if (nextNode !== null) {
		return nextNode;
	}

	if (this.finished) {
		return null;
	}

	if (this.nodeStack.length === 0) {
		// start
		this.nodeStack.push({ node : this.rootNode, childIndex : -1 });
		return this.nodeStack[0].node;
	}

	topNode = this.nodeStack[this.nodeStack.length - 1];
	topNode.childIndex++;

	if (topNode.childIndex < topNode.node.children.length) {
		nextNode = topNode.node.children[topNode.childIndex];
		this.nodeStack.push({ node : nextNode, childIndex : -1 });
		return nextNode;
	} else {
		this.nodeStack.pop();
		if (this.nodeStack.length === 0) {
			this.finished = true;
		}
		return this.next();
	}
};

CSLEDIT_Iterator.prototype.hasNext = function () {
	if (this.nextNode !== null) {
		return true;
	} else {
		if (this.finished) {
			return false;
		} else {
			this.nextNode = this.next();
			return this.nextNode !== null;
		}
	}
};

CSLEDIT_Iterator.prototype.parent = function () {
	if (this.nodeStack.length > 1) {
		return this.nodeStack[this.nodeStack.length - 2].node;
	} else {
		return null;
	}
};

CSLEDIT_Iterator.prototype.stack = function () {
	var stack = [];

	$.each(this.nodeStack, function(i, node) {
		stack.push(node.node);
	});
	
	return stack;
};
