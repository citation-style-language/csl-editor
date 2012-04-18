"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.cslParser = (function() {
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
						childNode.data.trim() != "") {
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
			// trim whitespace from start and end
			thisNodeData.textValue = textValue.replace(/^\s+|\s+$/g,"");
		}

		return thisNodeData;
	};

	var jsTreeDataFromCslData = function (cslData) {
		var jsTreeData = jsTreeDataFromCslData_inner(cslData);

		// make root node open
		jsTreeData["state"] = "open";

		return jsTreeData;
	};

	var jsTreeDataFromCslData_inner = function (cslData) {
		var index;
		var children = [];

		for (index = 0; index < cslData.children.length; index++) {
			children.push(jsTreeDataFromCslData_inner(cslData.children[index]));
		}

		var jsTreeData = {
			data : displayNameFromMetadata(cslData),
			attr : {
				rel : cslData.name,
				cslid : cslData.cslId,
				id : "cslTreeNode" + cslData.cslId
			},
			// TODO: remove this
			metadata : {
				name : cslData.name,
				attributes: cslData.attributes,
				cslId : cslData.cslId,
				textValue : cslData.textValue
			},
			children : children
		};

		return jsTreeData;
	};

	var displayNameFromMetadata = function (metadata) {
		var index,
			attributesString = "",
			attributesStringList = [],
			displayName,
			macro;

		/* don't add metadata - too messy
		if (metadata.attributes.length > 0) {
			for (index = 0; index < metadata.attributes.length; index++) {
				if (metadata.attributes[index].enabled) {
					attributesStringList.push(
						metadata.attributes[index].key + '="' +
						metadata.attributes[index].value + '"');
				}
			}
			attributesString = ": " + attributesStringList.join(", ");
		}
		*/

		switch (metadata.name) {
			case "macro":
				displayName = "Macro: " + getAttr("name", metadata.attributes);
				break;
			case "text":
				macro = getAttr("macro", metadata.attributes);
				if (macro !== "") {
					displayName = "Text (macro): " + macro;
				} else {
					displayName = "Text";
				}
				break;
			case "citation":
				displayName = "Inline Citations";
				break;
			case "bibliography":
				displayName = "Bibliography";
				break;
			default:
				displayName = metadata.name;
		}

		return displayName;
	};

	var getAttr = function (attribute, attributes) {
		var index;

		for (index = 0; index < attributes.length; index++) {
			if (attributes[index].enabled && attributes[index].key === attribute) {
				return attributes[index].value;
			}
		}

		return "";
	};

	var htmlEscape = function (text) {
		var escaped = text;

		escaped = escaped.replace("<", "&lt;");
		escaped = escaped.replace(">", "&gt;");
		escaped = escaped.replace("&", "&amp;");
		escaped = escaped.replace('"', "&quot;");

		return escaped;
	};

	var generateIndent = function (indentAmount) {
		var index,
			result = "";
		for (index = 0; index < indentAmount; index++) {
			result += "\t";
		}
		return result;
	};

	var xmlNodeFromJson = function (jsonData, indent) {
		var attributesString = "",
			xmlString,
			index;

		if (jsonData.attributes.length > 0) {
		  	for (index = 0; index < jsonData.attributes.length; index++) {
				if (jsonData.attributes[index].enabled && jsonData.attributes[index].value !== "") {
					// TODO: the key probably shouldn't have characters needing escaping anyway,
					//       should not allow to input them in the first place
					attributesString += " " + 
						htmlEscape(jsonData.attributes[index].key) + '="' + 
						htmlEscape(jsonData.attributes[index].value) + '"';
				}
			}
		}
		xmlString = generateIndent(indent) + "<" + jsonData.name + attributesString + ">\n";

		if (typeof jsonData.children !== "undefined" && jsonData.children.length > 0) {
			for (index = 0; index < jsonData.children.length; index++) {
				xmlString += xmlNodeFromJson(jsonData.children[index], indent + 1);
			}
		} else if (typeof jsonData.textValue !== "undefined") {
			xmlString += generateIndent(indent+1) + htmlEscape(jsonData.textValue) + "\n";
		}

		xmlString += generateIndent(indent) + "</" + htmlEscape(jsonData.name) + ">\n";

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

	var getFirstCslId = function (jsonData, nodeName) {
		var index,
			result;

		if (jsonData.metadata.name === nodeName) {
			return jsonData.metadata.cslId;
		} else {
			if (typeof jsonData.children !== "undefined") {
				for (index = 0; index < jsonData.children.length; index++) {
					result = getFirstCslId(jsonData.children[index], nodeName);
					if (result > -1) {
						return result;
					}
				}
			}
		}
		// couldn't find it
		return -1;
	};

	return {
		isCslValid : function(xmlData) {
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xmlData, "application/xml");

			var styleNode = xmlDoc.childNodes[0];
			return styleNode.localName === "style";
		},

		// nodeIndex.index is the depth-first traversal position of CSL node
		// it must start at 0, and it will be returned with nodeIndex.index = number of nodes - 1
		cslDataFromCslCode : function (xmlData) {
			console.time("jsonFromCslXml");
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xmlData, "application/xml");
			assert(xmlDoc.documentElement.nodeName !== "parsererror", "xml parser error");

			var styleNode = xmlDoc.childNodes[0];
			assertEqual(styleNode.localName, "style", "Invalid style - no style node");

			var jsonData = jsonNodeFromXml(styleNode, { index: 0 } );
		
			console.timeEnd("jsonFromCslXml");
			return jsonData;
		},

		jsTreeDataFromCslData : jsTreeDataFromCslData,

		cslCodeFromCslData : function (jsonData) {
 			console.time("cslXmlFromJson");
			var cslXml = '<?xml version="1.0" encoding="utf-8"?>\n';
			cslXml += xmlNodeFromJson(jsonData[0], 0);
 			console.timeEnd("cslXmlFromJson");
			return cslXml;
		},

		displayNameFromMetadata : displayNameFromMetadata,

		updateCslIds : updateCslIds,

		getFirstCslId : getFirstCslId
	};
}());
