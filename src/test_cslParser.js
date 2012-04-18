module("CSLEDIT.cslParser");

CSLEDIT.test_cslJSON = {
	cslFragment : '<?xml version=\"1.0\" encoding=\"utf-8\"?><style><citation et-al-min="6" et-al-use-first="1" et-al-subsequent-min="3" et-al-subsequent-use-first="1" disambiguate-add-year-suffix="true" disambiguate-add-names="true" disambiguate-add-givenname="true" collapse="year" givenname-disambiguation-rule="primary-name"><sort><key macro="author"><\/key><key macro="issued-sort"><\/key><\/sort><layout prefix="(" suffix=")" delimiter="; "><group delimiter=", "><text macro="author-short"><\/text><text macro="issued-year"><\/text><text macro="citation-locator"><\/text><\/group><\/layout><\/citation><\/style>',
	jsTreeData : {
		"data": "style",
		"attr": {
			"rel": "style",
			"cslid": 0,
			"id": "cslTreeNode0"
		},
		"metadata": {
			"name": "style",
			"attributes": [],
			"cslId": 0
		},
		"children": [{
			"data": "Inline Citations",
			"attr": {
				"rel": "citation",
				"cslid": 1,
				"id": "cslTreeNode1"
			},
			"metadata": {
				"name": "citation",
				"attributes": [{
					"key": "et-al-min",
					"value": "6",
					"enabled": true
				}, {
					"key": "et-al-use-first",
					"value": "1",
					"enabled": true
				}, {
					"key": "et-al-subsequent-min",
					"value": "3",
					"enabled": true
				}, {
					"key": "et-al-subsequent-use-first",
					"value": "1",
					"enabled": true
				}, {
					"key": "disambiguate-add-year-suffix",
					"value": "true",
					"enabled": true
				}, {
					"key": "disambiguate-add-names",
					"value": "true",
					"enabled": true
				}, {
					"key": "disambiguate-add-givenname",
					"value": "true",
					"enabled": true
				}, {
					"key": "collapse",
					"value": "year",
					"enabled": true
				}, {
					"key": "givenname-disambiguation-rule",
					"value": "primary-name",
					"enabled": true
				}],
				"cslId": 1
			},
			"children": [{
				"data": "sort",
				"attr": {
					"rel": "sort",
					"cslid": 2,
					"id": "cslTreeNode2"
				},
				"metadata": {
					"name": "sort",
					"attributes": [],
					"cslId": 2
				},
				"children": [{
					"data": "key",
					"attr": {
						"rel": "key",
						"cslid": 3,
						"id": "cslTreeNode3"
					},
					"metadata": {
						"name": "key",
						"attributes": [{
							"key": "macro",
							"value": "author",
							"enabled": true
						}],
						"cslId": 3
					},
					"children": []
				}, {
					"data": "key",
					"attr": {
						"rel": "key",
						"cslid": 4,
						"id": "cslTreeNode4"
					},
					"metadata": {
						"name": "key",
						"attributes": [{
							"key": "macro",
							"value": "issued-sort",
							"enabled": true
						}],
						"cslId": 4
					},
					"children": []
				}]
			}, {
				"data": "layout",
				"attr": {
					"rel": "layout",
					"cslid": 5,
					"id": "cslTreeNode5"
				},
				"metadata": {
					"name": "layout",
					"attributes": [{
						"key": "prefix",
						"value": "(",
						"enabled": true
					}, {
						"key": "suffix",
						"value": ")",
						"enabled": true
					}, {
						"key": "delimiter",
						"value": "; ",
						"enabled": true
					}],
					"cslId": 5
				},
				"children": [{
					"data": "group",
					"attr": {
						"rel": "group",
						"cslid": 6,
						"id": "cslTreeNode6"
					},
					"metadata": {
						"name": "group",
						"attributes": [{
							"key": "delimiter",
							"value": ", ",
							"enabled": true
						}],
						"cslId": 6
					},
					"children": [{
						"data": "Text (macro): author-short",
						"attr": {
							"rel": "text",
							"cslid": 7,
							"id": "cslTreeNode7"
						},
						"metadata": {
							"name": "text",
							"attributes": [{
								"key": "macro",
								"value": "author-short",
								"enabled": true
							}],
							"cslId": 7
						},
						"children": []
					}, {
						"data": "Text (macro): issued-year",
						"attr": {
							"rel": "text",
							"cslid": 8,
							"id": "cslTreeNode8"
						},
						"metadata": {
							"name": "text",
							"attributes": [{
								"key": "macro",
								"value": "issued-year",
								"enabled": true
							}],
							"cslId": 8
						},
						"children": []
					}, {
						"data": "Text (macro): citation-locator",
						"attr": {
							"rel": "text",
							"cslid": 9,
							"id": "cslTreeNode9"
						},
						"metadata": {
							"name": "text",
							"attributes": [{
								"key": "macro",
								"value": "citation-locator",
								"enabled": true
							}],
							"cslId": 9
						},
						"children": []
					}]
				}]
			}]
		}],
		"state": "open"
	}
};

test("parse CSL fragment", function () {
	var cslData,
		jsTreeData,
		cslXml;

	cslData = CSLEDIT.cslParser.cslDataFromCslCode(CSLEDIT.test_cslJSON.cslFragment, {index : 0});

	equal(cslData.name, "style");
	equal(cslData.children.length, 1);
	equal(cslData.children[0].name, "citation");
	equal(cslData.children[0].attributes.length, 9);
	equal(cslData.children[0].attributes[0].key, "et-al-min");
	equal(cslData.children[0].attributes[0].value, 6);
	equal(cslData.children[0].attributes[0].enabled, true);

	// check that it converts back to CSL XML without changes
	cslXml = CSLEDIT.cslParser.cslCodeFromCslData([cslData]);

	// remove whitespace after closing tags
	cslXml = cslXml.replace(/>[\n\r\s]*/g, ">");
	equal(cslXml, CSLEDIT.test_cslJSON.cslFragment);

	// check the jsTree json_data representaion
	jsTreeData = CSLEDIT.cslParser.jsTreeDataFromCslData(cslData);
	equal(JSON.stringify(jsTreeData), JSON.stringify(CSLEDIT.test_cslJSON.jsTreeData));
});
