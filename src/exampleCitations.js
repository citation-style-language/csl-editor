"use strict";

var CSLEDIT = CSLEDIT || {};

// use this instead of accessing CSLEDIT.exampleData
CSLEDIT.exampleCitations = (function () {

	var getCitations = function () {
		return CSLEDIT.storage.getItemJson('CSLEDIT.exampleCitations') || CSLEDIT.exampleData.citationsItems;
	};
	var setCitations = function (citations) {
		CSLEDIT.storage.setItem('CSLEDIT.exampleCitations', JSON.stringify(citations));

		console.log("set citations: " + JSON.stringify(citations));

		update();
	};

	var getCiteprocReferences = function () {
		var citeprocReferences = {};

		$.each(getReferences(), function (i, reference) {
			var itemString = "ITEM-" + (i + 1);
			reference.id = itemString;
			citeprocReferences[itemString] = reference;
		});

		return citeprocReferences;
	};		

	var getReferences = function () {
		return CSLEDIT.storage.getItemJson('CSLEDIT.exampleReferences') || CSLEDIT.exampleData.jsonDocumentList;
	};
	var setReferences = function (referenceList) {
		CSLEDIT.storage.setItem('CSLEDIT.exampleReferences', JSON.stringify(referenceList));

		update();
	};

	var getReferenceIndexesForCitation = function (citationIndex) {
		var indexes = [],
			citations = getCitations();

		$.each(citations[citationIndex].citationItems, function (i, citationItem) {
			indexes.push(parseInt(citationItem.id.replace("ITEM-", "")) - 1);
		});

		return indexes;
	};

	// TODO: change to include cite options: page locator, etc...
	var setReferenceIndexesForCitation = function (citationIndex, references) {
		var citations = getCitations();
		
		citations[citationIndex].citationItems = [];

		$.each(references, function (i, referenceIndex) {
			citations[citationIndex].citationItems.push({
				id : "ITEM-" + (referenceIndex + 1)
			});
		});

		setCitations(citations);
	};

	var addReference = function (referenceData) {
		var references = getReferences();
		references.push(referenceData);
		setReferences(references);
	};

	var setJsonDocumentList = function (jsonDocumentList) {
		CSLEDIT.exampleData.jsonDocumentList = jsonDocumentList;

		refresh();
	};

	var update = function () {
		CSLEDIT.viewController.styleChanged("formatCitations");
	};

	return {
		getCitations : getCitations,
		setCitations : setCitations,

		getReferences : getReferences,
		setReferences : setReferences,

		getCiteprocReferences : getCiteprocReferences,

		getReferenceIndexesForCitation : getReferenceIndexesForCitation,
		setReferenceIndexesForCitation : setReferenceIndexesForCitation,

		addReference : addReference
	};
}());
