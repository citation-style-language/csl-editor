"use strict";

// This converts between the following two formats:
//
// 1. A *.csl text file.
// 2. A JSON object as used by get() and set() in src/Data

define(['src/xmlUtility', 'src/debug'], function (CSLEDIT_xmlUtility, debug) {

	// Recursively generates and returns a CSL style JSON node, converted from the given xmlNode
	//
	// nodeIndex.index is the depth-first traversal position of CSL node
	// it must start at 0, and it will be returned with nodeIndex.index = number of nodes - 1
	var jsonNodeFromXml = function (xmlNode, nodeIndex) {
		var children = [],
			index,
			jsonData,
			childNode,
			textValue,
			ELEMENT_NODE,
			TEXT_NODE,
			thisNodeIndex = nodeIndex.index;

		ELEMENT_NODE = 1;
		TEXT_NODE = 3;
		
		for (index = 0; index < xmlNode.childNodes.length; index++) {
			childNode = xmlNode.childNodes[index];

			//to be compatible with all Chrome versions and Firefox versions,
			//we have to combine both conditions: undefined, null
			if (childNode.nodeType === ELEMENT_NODE) {
				nodeIndex.index++;
				children.push(jsonNodeFromXml(xmlNode.childNodes[index], nodeIndex));
			} else {
				if (childNode.nodeType === TEXT_NODE && typeof childNode.data !== "undefined" &&
						childNode.data.trim() !== "") {
					textValue = childNode.data;
				}
			}
		}

		debug.assert(typeof textValue === "undefined" || children.length === 0, "textValue = " + textValue + " children.length = " + children.length);

		var attributesList = [];
		var thisNodeData;
		
		if (xmlNode.attributes !== null && xmlNode.attributes.length > 0) {
			for (index = 0; index < xmlNode.attributes.length; index++) {
				attributesList.push(
					{
						key : xmlNode.attributes.item(index).nodeName,
						value : xmlNode.attributes.item(index).nodeValue,
						enabled : true
					});
			}
		}

		thisNodeData = {
				name : xmlNode.nodeName,
				attributes : attributesList,
				cslId : thisNodeIndex,
				children : children
			};

		if (typeof textValue !== "undefined") {
			thisNodeData.textValue = textValue;
		}

		return thisNodeData;
	};

	var generateIndent = function (indentAmount) {
		var index,
			result = "";
		for (index = 0; index < indentAmount; index++) {
			result += "  ";
		}
		return result;
	};

	// Recursively generates and returns an XML string from the given jsonData
	var xmlNodeFromJson = function (jsonData, indent, fullClosingTags) {
		var attributesString = "",
			xmlString,
			index,
			innerString;

		if (jsonData.attributes.length > 0) {
			for (index = 0; index < jsonData.attributes.length; index++) {
				if (jsonData.attributes[index].enabled) {
					// TODO: the key probably shouldn't have characters needing escaping anyway,
					//       should not allow to input them in the first place
					attributesString += " " + 
						CSLEDIT_xmlUtility.htmlEscape(jsonData.attributes[index].key) + '="' + 
						CSLEDIT_xmlUtility.htmlEscape(jsonData.attributes[index].value) + '"';
				}
			}
		}
		xmlString = generateIndent(indent);

		if (typeof jsonData.textValue !== "undefined") {
			xmlString += "<" + jsonData.name + attributesString + ">";
			xmlString += CSLEDIT_xmlUtility.htmlEscape(jsonData.textValue) + "</" +
				CSLEDIT_xmlUtility.htmlEscape(jsonData.name) + ">\n";
		} else {
			xmlString += "<" + jsonData.name + attributesString;
			innerString = "";
			if (typeof jsonData.children !== "undefined" && jsonData.children.length > 0) {
				for (index = 0; index < jsonData.children.length; index++) {
					innerString += xmlNodeFromJson(jsonData.children[index], indent + 1, fullClosingTags);
				}
			}
			if (innerString !== "") {
				xmlString += ">\n" + innerString + generateIndent(indent) + "</" + CSLEDIT_xmlUtility.htmlEscape(jsonData.name) + ">\n";
			} else if (fullClosingTags) {
				xmlString += "></" + jsonData.name + ">\n";
			} else {
				xmlString += "/>\n";
			}
		}

		return xmlString;
	};
	
	// Returns a JSON representation of the CSL 'style' node in the given xmlData string
	var cslDataFromCslCode = function (xmlData) {
		var parser = new DOMParser(),
			xmlDoc = parser.parseFromString(xmlData, "application/xml"),
			errors;

		errors = xmlDoc.getElementsByTagName('parsererror');
		debug.assertEqual(errors.length, 0, "xml parser error");

		var styleNode = xmlDoc.childNodes[0];
		debug.assertEqual(styleNode.nodeName, "style", "Invalid style - no style node");

		var jsonData = jsonNodeFromXml(styleNode, { index: 0 });
	
		return jsonData;
	};

	// Returns a CSL style code string
	//
	// - jsonData        - the CSL 'style' node JSON representation
	// - comment         - an optional comment string to insert after the 'style' element
	// - fullClosingTags - use separate closing tags (e.g. <link></link> instead of <link/>)
	var cslCodeFromCslData = function (jsonData, comment /* optional */, fullClosingTags /* optional */) {
		var cslXml = '<?xml version="1.0" encoding="utf-8"?>\n',
			lines,
			lineIndex;
		
		cslXml += xmlNodeFromJson(jsonData, 0, fullClosingTags);

		if (typeof(comment) === "string") {
			lines = cslXml.split("\n");

			// XML comment needs to go on line no. 3, after the XML declaration and style start tag
			lines.splice(2, 0, "  <!-- " + comment + " -->");

			cslXml = lines.join("\n");
		}
		
		return cslXml;
	};

	// public:
	return {
		cslDataFromCslCode : cslDataFromCslCode,
		cslCodeFromCslData : cslCodeFromCslData
	};
});
