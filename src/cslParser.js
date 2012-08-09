"use strict";

define(['src/debug'], function (debug) {
	// Private functions:
	var jsonNodeFromXml = function (node, nodeIndex) {
		var children = [],
			index,
			jsonData,
			childNode,
			textValue,
			TEXT_NODE,
			thisNodeIndex = nodeIndex.index;

		TEXT_NODE = 3;
		
		for (index = 0; index < node.childNodes.length; index++) {
			childNode = node.childNodes[index];

			if (childNode.localName !== null) {
				nodeIndex.index++;
				children.push(jsonNodeFromXml(node.childNodes[index], nodeIndex));
			} else {
				if (childNode.nodeType === TEXT_NODE && typeof childNode.data !== "undefined" && 
						childNode.data.trim() !== "") {
					textValue = childNode.data;
				}
			}
		}

		assert(typeof textValue === "undefined" || children.length === 0, "textValue = " + textValue + " children.length = " + children.length);

		var attributesString = "";
		var attributesStringList = [];
		var attributesList = [];
		var thisNodeData;
		
		if (node.attributes !== null && node.attributes.length > 0) {
			for (index = 0; index < node.attributes.length; index++) {
				attributesList.push(
					{
						key : node.attributes.item(index).localName,
						value : node.attributes.item(index).nodeValue,
						enabled : true
					});
				attributesStringList.push(
					node.attributes.item(index).localName + '="' +
					node.attributes.item(index).nodeValue + '"');
			}
			attributesString = ": " + attributesStringList.join(", ");
		}

		thisNodeData = {
				name : node.localName,
				attributes : attributesList,
				cslId : thisNodeIndex,
				children : children
			};

		if (typeof textValue !== "undefined") {
			thisNodeData.textValue = textValue;
		}

		return thisNodeData;
	};

	var htmlEscape = function (text) {
		var escaped = text;

		escaped = escaped.replace(/&/g, "&amp;");
		escaped = escaped.replace(/</g, "&lt;");
		escaped = escaped.replace(/>/g, "&gt;");
		escaped = escaped.replace(/"/g, "&quot;");

		return escaped;
	};

	var generateIndent = function (indentAmount) {
		var index,
			result = "";
		for (index = 0; index < indentAmount; index++) {
			result += "  ";
		}
		return result;
	};

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
						htmlEscape(jsonData.attributes[index].key) + '="' + 
						htmlEscape(jsonData.attributes[index].value) + '"';
				}
			}
		}
		xmlString = generateIndent(indent);

		if (typeof jsonData.textValue !== "undefined") {
			xmlString += "<" + jsonData.name + attributesString + ">";
			xmlString += htmlEscape(jsonData.textValue) + "</" + htmlEscape(jsonData.name) + ">\n";
		} else {
			xmlString += "<" + jsonData.name + attributesString;
			innerString = "";
			if (typeof jsonData.children !== "undefined" && jsonData.children.length > 0) {
				for (index = 0; index < jsonData.children.length; index++) {
					innerString += xmlNodeFromJson(jsonData.children[index], indent + 1, fullClosingTags);
				}
			}
			if (innerString !== "") {
				xmlString += ">\n" + innerString + generateIndent(indent) + "</" + htmlEscape(jsonData.name) + ">\n";
			} else if (fullClosingTags) {
				xmlString += "></" + jsonData.name + ">\n";
			} else {
				xmlString += "/>\n";
			}
		}

		return xmlString;
	};
	
	var updateCslIds = function (jsonData, cslId) {
		var childIndex;

		jsonData.metadata["cslId"] = cslId.index;
		cslId.index++;
		if (jsonData.children) {
			for (childIndex = 0; childIndex < jsonData.children.length; childIndex++)
			{
				updateCslIds(jsonData.children[childIndex], cslId);
			}
		}
	};

	// public:
	return {
		isCslValid : function (xmlData) {
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xmlData, "application/xml");

			var styleNode = xmlDoc.childNodes[0];
			return styleNode.localName === "style";
		},

		// nodeIndex.index is the depth-first traversal position of CSL node
		// it must start at 0, and it will be returned with nodeIndex.index = number of nodes - 1
		cslDataFromCslCode : function (xmlData) {
			var parser = new DOMParser(),
				xmlDoc = parser.parseFromString(xmlData, "application/xml"),
				errors;
			errors = xmlDoc.getElementsByTagName('parsererror');
			assertEqual(errors.length, 0, "xml parser error");

			var styleNode = xmlDoc.childNodes[0];
			assertEqual(styleNode.localName, "style", "Invalid style - no style node");

			var jsonData = jsonNodeFromXml(styleNode, { index: 0 });
		
			return jsonData;
		},

		cslCodeFromCslData : function (jsonData, comment /* optional */, fullClosingTags /* optional */) {
			var cslXml = '<?xml version="1.0" encoding="utf-8"?>\n',
				lines,
				lineIndex;
			
			cslXml += xmlNodeFromJson(jsonData, 0, fullClosingTags);

			if (typeof(comment) === "string") {
				lines = cslXml.split("\n");

				// comment needs to go on line no. 3, after the style node
				lines.splice(2, 0, "<!-- " + comment + " -->");

				cslXml = lines.join("\n");
			}
			
			return cslXml;
		},

		updateCslIds : updateCslIds
	};
}());
