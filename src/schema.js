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
		urlsGot = 0,
		callback = null,
		initialised = false,
		refParents = {};

	$.get(mainSchemaURL, {}, function(data) {
		mainSchemaData = data;
		urlsGot++;
		if (urlsGot === includeSchemaURLs.length + 1) {
			init();
		}
	});

	$.each(includeSchemaURLs, function(i, url) {
		$.get(url, {}, function(data) {
			schemas.push(data);
			urlsGot++;
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
			textNode : false,
			list : false,
			choices : [],
			choiceRefs : []
		};
	};

	var init = function () {
		// parse the schema element by element
		var parser = new DOMParser(),
			xmlDoc;

		xmlDoc = parser.parseFromString(mainSchemaData, "application/xml");

		// This is the root node for the grammar
		nodeProperties["root"] = parseChildren(xmlDoc);

		$.each(schemas, function (i, schemaData) {
			xmlDoc = parser.parseFromString(schemaData, "application/xml");
		
			// Parse schema
			parseChildren(xmlDoc);
		});

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

		$.each(originalNodes, function (i, node) {
			match = defRegExp.exec(node);
			if (match !== null) {
				$.each(refParents[match[1]], function (i2, refParent) {
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
				simplifyAttributeValues(node.attributes, attributeName);
			}
			simplifyChoices(node);

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

	var simplifyAttributeValues = function (attributes, attributeName) {
		var ref,
			define;

		// note: refs may already be deleted because
		// this attribute may have referenced in a different element,
		// and it's already been simplified
		if (typeof attributes[attributeName].refs === "undefined") {
			return;
		}

		ref = attributes[attributeName].refs.pop();

		if (typeof ref === "undefined") {
			// simplified
			
			// note, that refs may already be deleted because
			// it may have been referenced somewhere else
			if (typeof attributes[attributeName].refs !== "undefined") {
				delete attributes[attributeName].refs;
			}
			return;
		}

		if (ref in defineProperties) {
			define = defineProperties[ref];
			
			arrayMerge(attributes[attributeName].values,
				define.attributeValues);
			arrayMerge(attributes[attributeName].refs,
				define.refs);

			simplifyAttributeValues(attributes, attributeName);
		} else {
			assert(false, "Couldn't find attr value define: " + ref);
		}
	};

	var attributeNamesFromRef = function (ref) {
		var define = defineProperties[ref],
			attributeNames = [];

		assert(typeof define !== 'undefined');

		$.each(define.refs, function (i, ref) {
			attributeNames = attributeNames.concat(attributeNamesFromRef(ref));
		});

		$.each(define.attributes, function (name, attribute) {
			attributeNames.push(name);
		});

		return attributeNames;
	};

	var simplifyChoices = function (node) {
		$.each (node.choiceRefs, function (i, choiceRef) {
			var define = defineProperties[choiceRef];
			$.each(define.attributes, function () {
				node.choices.push(define.attributes);
				return false;
			});
		});
		$.each(node.choices, function (i, choice) {
			var attributeName;
			for (attributeName in choice) {
				// already mostly simplified, just need to dereference the attr. values
				simplifyAttributeValues(choice, attributeName);
			}
		});
		delete node.choiceRefs;
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
		if (typeof arrayB === "undefined") {
			return;
		}

		$.each(arrayB, function(i, eleB) {
			if (!arrayContains(arrayA, eleB, equalityFunction)) {
				arrayA.push(eleB);
			}
		});
	};

	var parseChildren = function (node, applyToEachChild) {
		var index,
			parser,
			childNode,
			nodeProperties = new NodeProperties(),
			childResult;

		if (node.nodeName !== null) {
			nodesParsed++;
		}

		// add child results to the result list
		$.each(node.childNodes, function (i, childNode) {
			if (childNode.localName !== null) {
				if (childNode.nodeName in nodeParsers) {
					childResult = nodeParsers[childNode.nodeName](childNode);

					if (childResult !== null) {
						if (typeof applyToEachChild === "function") {
							applyToEachChild(childResult);
						}

						joinProperties(nodeProperties, childResult);
					}
				} else {
					// couldn't parse
				}
			}
		});

		return nodeProperties;
	};

	var attributeValueEquality = function (a, b) {
		return (a.type === b.type && a.value === b.value);
	};

	var attributesMerge = function (attributesA, attributesB) {
		var attribute;

		for (attribute in attributesB) {
			if (!(attribute in attributesA)) {
				attributesA[attribute] = attributesB[attribute];
			} else {
				arrayMerge(attributesA[attribute].values,
					attributesB[attribute].values, attributeValueEquality);
			
				arrayMerge(attributesA[attribute].refs,
					attributesB[attribute].refs);
			}
		}
	};

	var joinProperties = function (propertiesA, propertiesB) {
		var element;

		for (element in propertiesB.elements) {
			if (!(element in propertiesA.attributes)) {
				propertiesA.elements[element] = propertiesB.elements[element];
			} else {
				propertiesA.elements[element] = ""; // values of elements not important
			}
		}
		attributesMerge(propertiesA.attributes, propertiesB.attributes);

		arrayMerge(propertiesA.choiceRefs, propertiesB.choiceRefs);
		propertiesA.choices = propertiesA.choices.concat(propertiesB.choices);
		arrayMerge(propertiesA.refs, propertiesB.refs);
		arrayMerge(propertiesA.attributeValues, propertiesB.attributeValues, attributeValueEquality);

		propertiesA.textNode = propertiesA.textNode | propertiesB.textNode;
		propertiesA.list = propertiesA.list | propertiesB.list;
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
					refs : [],
					list : values.list
				};
			} else {
				thisNodeProperties.attributes[attributeName] = {
					values : values.attributeValues,
					refs : values.refs,
					list : values.list
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
			var choices = [],
				choiceRefs = [],
				thisNodeProperties,
				applyToEachChild = function (childNodeProperties) {
					// nested choices not supported
					assertEqual(childNodeProperties.choices.length, 0);

					$.each (childNodeProperties.refs, function (i, choiceRef) {
						choiceRefs.push(choiceRef);
					});

					$.each(childNodeProperties.attributes, function () {
						choices.push(childNodeProperties.attributes);
						return false;
					});

					childNodeProperties.attributes = {};
				};

			thisNodeProperties = parseChildren(node, applyToEachChild);
			thisNodeProperties.choices = choices;
			thisNodeProperties.choiceRefs = choiceRefs;

			return thisNodeProperties;
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
			var thisNodeProperties = parseChildren(node);
			thisNodeProperties.list = true;

			return thisNodeProperties;
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
		choices : function (element) {
			return nodeProperties[element].choices;
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
