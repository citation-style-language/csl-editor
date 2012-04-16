"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.parser = (function() {
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
		var metadata;
		
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

		metadata = {
				"name" : node.localName,
				"attributes" : attributesList,
				"cslId" : thisNodeIndex
			};

		if (typeof textValue !== "undefined") {
			// trim whitespace from start and end
			metadata["textValue"] = textValue.replace(/^\s+|\s+$/g,"");
		}

		return {
			"data" : displayNameFromMetadata(metadata),
			"attr" : { "rel" : node.localName, "cslid" : thisNodeIndex, "id" : "cslTreeNode" + thisNodeIndex },
			"metadata" : metadata,
			"children" : children
		};
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
			index,
			metadata;

		metadata = jsonData.metadata;

		if (metadata.attributes.length > 0) {
		  	for (index = 0; index < metadata.attributes.length; index++) {
				if (metadata.attributes[index].enabled && metadata.attributes[index].value !== "") {
					// TODO: the key probably shouldn't have characters needing escaping anyway,
					//       should not allow to input them in the first place
					attributesString += " " + 
						htmlEscape(metadata.attributes[index].key) + '="' + 
						htmlEscape(metadata.attributes[index].value) + '"';
				}
			}
		}
		xmlString = generateIndent(indent) + "<" + metadata.name + attributesString + ">\n";

		if (typeof jsonData.children !== "undefined" && jsonData.children.length > 0) {
			for (index = 0; index < jsonData.children.length; index++) {
				xmlString += xmlNodeFromJson(jsonData.children[index], indent + 1);
			}
		} else if (typeof metadata.textValue !== "undefined") {
			xmlString += generateIndent(indent+1) + htmlEscape(metadata.textValue) + "\n";
		}

		xmlString += generateIndent(indent) + "</" + htmlEscape(metadata.name) + ">\n";

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
			console.log("found " + nodeName + " at " + jsonData.metadata.cslId);
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
		jsonFromCslXml : function (xmlData, nodeIndex) {
			console.time("jsonFromCslXml");
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xmlData, "application/xml");

			var styleNode = xmlDoc.childNodes[0];
			assertEqual(styleNode.localName, "style", "Invalid style - no style node");

			var jsonData = jsonNodeFromXml(styleNode, nodeIndex);

			// make root node open
			jsonData["state"] = "open";
		
			console.timeEnd("jsonFromCslXml");
			return jsonData;
		},

		cslXmlFromJson : function (jsonData) {
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
