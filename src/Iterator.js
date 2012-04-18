"use strict";

CSLEDIT = CSLEDIT || {};

/* Iterates through a tree in depth first order
 *
 * Each node of the tree must contain a children array containing it's child nodes
 * 
 * Can retrieve the parent node of each child in the tree
 */
CSLEDIT.Iterator = function (rootNode) {
	var nextNode = rootNode,
		nextParent = null,
		currentParent = null,
		nodeStack = [{ node : rootNode, childIndex : -1 }];

	// calculates nextNode in advance
	var next = function () {
		var topNode,
			currentNode;

		currentNode = nextNode;
		currentParent = nextParent;

		if (nodeStack.length === 0) {
			nextNode = null;
			nextParent = null;
			return currentNode;
		}

		topNode = nodeStack[nodeStack.length - 1];
		topNode.childIndex++;

		if (topNode.childIndex < topNode.node.children.length) {
			nextNode = topNode.node.children[topNode.childIndex];
			nextParent = topNode.node;
			nodeStack.push({ node : nextNode, childIndex : -1 });
			return currentNode;
		}

		nodeStack.pop();
		return next();
	};

	return {
		hasNext : function () {
			return nextNode !== null;
		},
		next : next,
		parent : function () {
			return currentParent;
		}
	};
};
