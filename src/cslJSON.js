"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.parser = (function() {
	// Private functions:
	var parseNode = function (node, nodeIndex) {
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
				children.push(parseNode(node.childNodes[index], nodeIndex));
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
						value : node.attributes.item(index).nodeValue
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
			attributesStringList = [];

		if (metadata.attributes.length > 0) {
			for (index = 0; index < metadata.attributes.length; index++) {
				attributesStringList.push(
					metadata.attributes[index].key + '="' +
					metadata.attributes[index].value + '"');
			}
			attributesString = ": " + attributesStringList.join(", ");
		}

		return metadata.name + attributesString;
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
				// TODO: the key probably shouldn't have characters needing escaping anyway,
				//       should not allow to input them in the first place
				attributesString += " " + 
					htmlEscape(metadata.attributes[index].key) + '="' + htmlEscape(metadata.attributes[index].value) + '"';
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
			//console.log("cslid = " + cslId.index);
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
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xmlData, "application/xml");

			var styleNode = xmlDoc.childNodes[0];
			assertEqual(styleNode.localName, "style", "Invalid style - no style node");

			var jsonData = parseNode(styleNode, nodeIndex);

			// make root node open
			jsonData["state"] = "open";

			return jsonData;
		},

		cslXmlFromJson : function (jsonData) {
			var cslXml = '<?xml version="1.0" encoding="utf-8"?>\n';
			cslXml += xmlNodeFromJson(jsonData[0], 0);
			return cslXml;
		},

		displayNameFromMetadata : displayNameFromMetadata,

		updateCslIds : updateCslIds,

		getFirstCslId : getFirstCslId
	};
}());
