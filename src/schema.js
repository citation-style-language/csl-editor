// Responsible for parsing a .rng file
// The file must be in XML form, not the compact notation (.rnc)
//
// (only tested with the csl.rng and it's includes)
//
// It generates properties for each element type:
//
// - data type if applicable (e.g. text, anyURI)
// - list of attributes, and thier possible values
// - list of child elements
// 
// It assumes that an element can be uniquely identified by it's name + parent's name

"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.schema = (function (mainSchemaURL, includeSchemaURLs) {
	var mainSchemaData,
		schemas = [],
		nodesParsed = 0,
		nodeProperties = {}, // The possible child elements and attributes for each
		                     // node name
		defineProperties = {},
		currentNodeName = "",
		urlsGot = 0,
		callback = null,
		initialised = false,
		refParents = {};

	var arrayForEach = function (array, action) {
		if (typeof array === "undefined") {
			return;
		}
		var index;
		for (index = 0; index < array.length; index++) {
			action(array[index]);
		}
	};
	
	$.get(mainSchemaURL, {}, function(data) {
		mainSchemaData = data;
		urlsGot++;
		console.log("got schema " + urlsGot + " of " + includeSchemaURLs.length + 1);
		if (urlsGot === includeSchemaURLs.length + 1) {
			init();
		}
	});

	arrayForEach(includeSchemaURLs, function(url) {
		$.get(url, {}, function(data) {
			schemas.push(data);
			urlsGot++;
			console.log("got schema " + urlsGot + " of " + includeSchemaURLs.length + 1);
			if (urlsGot === includeSchemaURLs.length + 1) {
				init();
			}
		});
	});

	var NodeProperties = function () {
		return {
			elements : {},
			attributes : {},
			refs : [],
			attributeValues : [],
			textNode : false
		};
	};

	var init = function () {
		// parse the schema element by element
		var parser = new DOMParser(),
			xmlDoc;

		console.log("init");

		xmlDoc = parser.parseFromString(mainSchemaData, "application/xml");

		// This is the root node for the grammar
		nodeProperties["root"] = parseChildren(xmlDoc);

		arrayForEach(schemas, function (schemaData) {
			xmlDoc = parser.parseFromString(schemaData, "application/xml");
		
			// Parse schema
			parseChildren(xmlDoc);
		});

		console.log("nodes parsed : " + nodesParsed);

		// Simplify schema (replace all refs with the corresponding define
		simplify();

		initialised = true;
		if (callback !== null) {
			callback();
		}
	};

	var simplify = function () {
		var node, defRegExp, match, originalNodes = [], newNodeName;

		for (node in nodeProperties) {
			simplifyNode(node, nodeProperties[node]);
		}

		// replace all def: references in node names with the appropriate child nodes, expanding
		// out the as neccessary
		defRegExp = new RegExp("def:([\\w-]+)\/(.*)$");

		for (node in nodeProperties) {
			originalNodes.push(node);
		}

		arrayForEach(originalNodes, function (node) {
			match = defRegExp.exec(node);
			if (match !== null) {
				arrayForEach(refParents[match[1]], function (refParent) {
					newNodeName = refParent + "/" + match[2];
					if (newNodeName in nodeProperties) {
						joinProperties(nodeProperties[newNodeName], nodeProperties[node]);
					} else {
						nodeProperties[newNodeName] = nodeProperties[node];
					}
				});

				delete nodeProperties[node];
			}
		});
	};

	var elementName = function (elementStackString) {
		return elementStackString.replace(/^.*\//, "");
	};

	var simplifyNode = function (nodeName, node) {
		var define,
			ref,
			attributeName,
			nodeLocalName;

		ref = node.refs.pop();

		if (typeof ref === "undefined") {
			for (attributeName in node.attributes) {
				// already mostly simplified, just need to dereference the attr. values
				simplifyAttributeValues(node, attributeName);
			}

			// remove refs array
			delete node.refs;

			return;
		}
		
		if (ref in defineProperties) {
			define = defineProperties[ref];

			joinProperties(node, define);

			simplifyNode(nodeName, node);
		
			assert(elementName(nodeName).indexOf("def:") === -1, "define parent");

			if (ref in refParents) {
				if (refParents[ref].indexOf(elementName(nodeName)) === -1) {
					refParents[ref].push(elementName(nodeName));
				}
			} else {
				refParents[ref] = [ elementName(nodeName) ];
			}
		} else {
			assert(false, "Couldn't find define: " + ref);
		}
	};

	var simplifyAttributeValues = function (node, attributeName) {
		var ref,
			define;

		// note: refs may already be deleted because
		// this attribute may have referenced in a different element,
		// and it's already been simplified
		if (typeof node.attributes[attributeName].refs === "undefined") {
			return;
		}

		ref = node.attributes[attributeName].refs.pop();

		if (typeof ref === "undefined") {
			// simplified
			
			// note, that refs may already be deleted because
			// it may have been referenced somewhere else
			if (typeof node.attributes[attributeName].refs !== "undefined") {
				delete node.attributes[attributeName].refs;
			}
			return;
		}

		if (ref in defineProperties) {
			define = defineProperties[ref];
			
			arrayMerge(node.attributes[attributeName].values,
				define.attributeValues);
			arrayMerge(node.attributes[attributeName].refs,
				define.refs);

			simplifyAttributeValues(node, attributeName);
		} else {
			assert(false, "Couldn't find attr value define: " + ref);
		}
	};

	var arrayContains = function (array, element, equalityFunction) {
		if (typeof equalityFunction === "undefined") {
			equalityFunction = (function (a, b) {return a === b;});
		}

		var index;
		for (index = 0; index < array.length; index++) {
			if (equalityFunction(array[index], element)) {
				return true;
			}
		}
		return false;
	};
	
	// merge the two arrays putting result in arrayA
	var arrayMerge = function (arrayA, arrayB, equalityFunction) {
		arrayForEach(arrayB, function(eleB) {
			if (!arrayContains(arrayA, eleB, equalityFunction)) {
				arrayA.push(eleB);
			}
		});
	};

	var parseChildren = function (node) {
		var index,
			parser,
			childNode,
			nodeProperties = new NodeProperties(),
			childResult;

		if (node.nodeName !== null) {
			nodesParsed++;
		}

		// add child results to the result list
		arrayForEach(node.childNodes, function (childNode) {
			if (childNode.localName !== null) {
				if (childNode.nodeName in nodeParsers) {
					childResult = nodeParsers[childNode.nodeName](childNode);

					if (childResult !== null) {
						joinProperties(nodeProperties, childResult);
					}
				} else {
					// couldn't parse
				}
			}
		});

		return nodeProperties;
	};

	var joinProperties = function (propertiesA, propertiesB) {
		var element, attribute;

		var attributeValueEquality = function (a, b) {
			return (a.type === b.type && a.value === b.value);
		};

		for (element in propertiesB.elements) {
			if (!(element in propertiesA.attributes)) {
				propertiesA.elements[element] = propertiesB.elements[element];
			} else {
				propertiesA.elements[element] = ""; // values of elements not important
			}
		}
		for (attribute in propertiesB.attributes) {
			if (!(attribute in propertiesA.attributes)) {
				propertiesA.attributes[attribute] = propertiesB.attributes[attribute];
			} else {
				arrayMerge(propertiesA.attributes[attribute].values,
					propertiesB.attributes[attribute].values, attributeValueEquality);
				arrayMerge(propertiesA.attributes[attribute].refs,
					propertiesB.attributes[attribute].refs);
			}
		}

		arrayMerge(propertiesA.refs, propertiesB.refs);
		arrayMerge(propertiesA.attributeValues, propertiesB.attributeValues, attributeValueEquality);

		propertiesA.textNode = propertiesA.textNode | propertiesB.textNode;
	};

	var elementStack = [];
	var elementStackString = function () {
		var topTwoElements = [],
			index = elementStack.length - 1;

		while (index >= 0 && topTwoElements.length < 2) {	
			topTwoElements.splice(0, 0, elementStack[index]);
			index--;
		}

		return topTwoElements.join("/");
	};

	// a list of functions which attempt to parse a node
	// return true if parsed, false if not
	var nodeParsers = {
		element : function (node) {
			var thisNodeProperties = new NodeProperties(),
				thisElementName = node.attributes.item("name").nodeValue,
				newProperties;

			// only want elements starting with cs:
			if ((/^cs:/).test(thisElementName)) {
				thisElementName = thisElementName.replace(/^cs:/, "");

				elementStack.push(thisElementName);
				thisNodeProperties.elements[thisElementName] = "";

				newProperties = parseChildren(node);

				if (elementStackString() in nodeProperties) {
					joinProperties(nodeProperties[elementStackString()], newProperties);
				} else {
					nodeProperties[elementStackString()] = newProperties;
				}

				elementStack.pop();
				return thisNodeProperties;
			} else {
				// ignore non cs: elements/
				assert(false);
				return null;
			}
		},
		attribute : function (node) {
			var thisNodeProperties = new NodeProperties(),
				attributeName = node.attributes.item("name").nodeValue,
				values;

			values = parseChildren(node);

			if (values.textNode) {
				// Will accept any free-form text
				thisNodeProperties.attributes[attributeName] = {
					values : [],
					refs : [] 
				};
			} else {
				thisNodeProperties.attributes[attributeName] = {
					values : values.attributeValues,
					refs : values.refs
				};
			}
			return thisNodeProperties;
		},
		group : function (node) {
			return parseChildren(node);
		},
		interleave : function (node) {
			return parseChildren(node);
		},
		choice : function (node) {
			// for now, just union the possible child nodes
			return parseChildren(node);
		},
		optional : function (node) {
			return parseChildren(node);
		},
		zeroOrMore : function (node) {
			return parseChildren(node);
		},
		oneOrMore : function (node) {
			return parseChildren(node);
		},
		list : function (node) {
			return parseChildren(node);
		},
		mixed : function (node) {
			return parseChildren(node);
		},
		ref : function (node) {
			var thisNodeProperties = new NodeProperties(),
				nodeName = node.attributes.item("name").nodeValue;
			thisNodeProperties.refs.push(nodeName);
			return thisNodeProperties;
		},
		parentRef : function (node) {
			// not used in the CSL schema
			assert(false, "parentRef not supported");
			return null;
		},
		empty : function (node) {
			return null;
		},
		text : function (node) {
			var thisNodeProperties = new NodeProperties();
			thisNodeProperties.textNode = true;
			return thisNodeProperties;
		},
		value : function (node) {
			var thisNodeProperties = new NodeProperties();
			thisNodeProperties.attributeValues = [{
				type : "value",
				value : node.textContent
			}];
			return thisNodeProperties;
		},
		data : function (node) {
			var thisNodeProperties = new NodeProperties();
			thisNodeProperties.attributeValues = [{
				type : "data",
				value : node.attributes.item("type").nodeValue
			}];
			return thisNodeProperties;
		},
		notAllowed : function (node) {
			// not sure what this does
			return null;
		},
		grammar : function (node) {
			return parseChildren(node);;
		},
		param : function (node) {
			return null;
		},
		div : function (node) {
			// divs can be ignored for now, they are only used to group documentation nodes
			return parseChildren(node);
		},
		include : function (node) {
			// TODO!
			return null;
		},
		start : function (node) {
			return parseChildren(node);
		},
		define : function (node) {
			// create new define
			var defineName;
			defineName = node.attributes.item("name").nodeValue;
			
			elementStack.push("def:" + defineName);
			defineProperties[defineName] = parseChildren(node);
			elementStack.pop();
			return null;
		}
	};

	return {
		attributes : function (element) {
			return nodeProperties[element].attributes;
		},
		childElements : function (element) {
			return nodeProperties[element].elements;
		},
		elementDataType : function (element) {
			var node = nodeProperties[element];

			if (nodeProperties[element].textNode) {
				return "text";
			}

			assert(node.attributeValues.length < 2);
			if (node.attributeValues.length === 0 || node.attributeValues[0].type !== "data") {
				return null;
			} else {
				return node.attributeValues[0].value;
			}
		},
		allData : function () {
			return nodeProperties;
		},
		callWhenReady : function (newCallback) {
			if (initialised) {
				newCallback();
			} else {
				callback = newCallback;
			}
		}
	};
}(
	"http://" + window.location.host + "/csl/external/csl-schema/csl.rng",
	[
		"http://" + window.location.host + "/csl/external/csl-schema/csl-categories.rng",
		"http://" + window.location.host + "/csl/external/csl-schema/csl-terms.rng",
		"http://" + window.location.host + "/csl/external/csl-schema/csl-types.rng",
		"http://" + window.location.host + "/csl/external/csl-schema/csl-variables.rng"
	]
));
