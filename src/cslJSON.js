"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.parser = (function() {
	// Private functions:
	var parseNode = function (node) {
		var children = [],
			index,
			jsonData,
			childNode,
			textValue,
			TEXT_NODE;

		TEXT_NODE = 3;
		
		for (index = 0; index < node.childNodes.length; index++) {
			childNode = node.childNodes[index];

			if (childNode.localName !== null) {
				children.push(parseNode(node.childNodes[index]));
			} else {
				if (childNode.nodeType === TEXT_NODE && childNode.data.trim() != "") {
					textValue = childNode.data;
				}
			}
		}

		assert(typeof textValue === "undefined" || children.length === 0, "textValue = " + textValue + " children.length = " + children.length);

		var attributesString = "";
		var attributesStringList = [];
		var attributesList = [];

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

		return {
			"data" : (node.localName + attributesString),
			"attr" : { "rel" : node.localName },
			"metadata" : {
				"name" : node.localName,
				"attributes" : attributesList,
				"textValue" : textValue
			},
			"children" : children
		};
	};

	var xmlNodeFromJson = function (jsonData) {
		var attributesString = "",
			xmlString,
			index,
			metadata;

		metadata = jsonData.metadata;

		if (metadata.attributes.length > 0) {
		  	for (index = 0; index < metadata.attributes.length; index++) {
				attributesString += " " + 
					metadata.attributes[index].key + '="' + metadata.attributes[index].value + '"';
			}
		}
		xmlString = 
			"<" + metadata.name + attributesString + ">\n";

		if (typeof jsonData.children !== "undefined" && jsonData.children.length > 0) {
			for (index = 0; index < jsonData.children.length; index++) {
				xmlString += xmlNodeFromJson(jsonData.children[index]);
			}
		} else {
			xmlString += metadata.textValue;
		}

		xmlString += "</" + metadata.name + ">\n";

		return xmlString;
	};

	return {
		jsonFromCslXml : function (xmlData) {
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xmlData, "application/xml");

			var styleNode = xmlDoc.childNodes[0];
			assertEqual(styleNode.localName, "style");

			var jsonData = parseNode(styleNode);

			// make root node open
			jsonData["state"] = "open";

			return jsonData;
		},

		cslXmlFromJson : function (jsonData) {
			var cslXml = '<?xml version="1.0" encoding="utf-8"?>\n';
			cslXml += xmlNodeFromJson(jsonData[0]);
			return cslXml;
		}
	};
}());
