"use strict";

var CSLEDIT = CSLEDIT || {};

// use this instead of accessing CSLEDIT.exampleData
CSLEDIT.exampleCitations = (function () {
	var getCitations = function () {
		if (CSLEDIT.storage.getItemJson('CSLEDIT.exampleCitations') === null) {
		   setCitations(CSLEDIT.exampleData.citationsItems);
		}
		return CSLEDIT.storage.getItemJson('CSLEDIT.exampleCitations');
	};
	var setCitations = function (citations) {
		applyCitationOptions(citations, getCitationOptions());
		CSLEDIT.storage.setItem('CSLEDIT.exampleCitations', JSON.stringify(citations));
		update();
	};
	
	var getCitationOptions = function () {
		if (CSLEDIT.storage.getItemJson('CSLEDIT.exampleCitationOptions') === null) {
		   return {};
		}
		return CSLEDIT.storage.getItemJson('CSLEDIT.exampleCitationOptions');
	};
	var setCitationOptions = function (citationOptions) {
		var citations = getCitations();
		CSLEDIT.storage.setItem('CSLEDIT.exampleCitationOptions', JSON.stringify(citationOptions));

		applyCitationOptions(citations, citationOptions);
		setCitations(citations);
	};

	var applyCitationOptions = function (citations, citationOptions) {
		// apply options
		$.each(citations, function (citationIndex, citation) {
			var index;
			for (index=0; index<citation.citationItems.length; index++) {
				var citationItem = citation.citationItems[index],
					referenceIndex = parseInt(citationItem.id.replace("ITEM-", "")) - 1,
					optionIndex = getOption(citationIndex, referenceIndex),
					options = CSLEDIT.exampleData.additionalOptions[optionIndex];
			
				// replace all options
				citationItem = { id : citationItem.id };
				$.each (options.options, function (key, value) {
					citationItem[key] = value;
				});
				citation.citationItems[index] = citationItem;
			};
		});
	};

	var setOption = function (citation, reference, option) {
		var options = getCitationOptions();
		options[citation] = options[citation] || {};
		options[citation][reference] = option;
		setCitationOptions(options);
	};

	var getOption = function (citation, reference) {
		var options = getCitationOptions();
		if (!options.hasOwnProperty(citation)) {
			return 0;
		}
		if (!options[citation].hasOwnProperty(reference)) {
			return 0;
		}
		return options[citation][reference];
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
		if (CSLEDIT.storage.getItemJson('CSLEDIT.exampleReferences') === null) {
		   setReferences(CSLEDIT.exampleData.jsonDocumentList);
		}
		return CSLEDIT.storage.getItemJson('CSLEDIT.exampleReferences');
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

	var addReference = function (referenceData, citationToAddTo /* optional */ ) {
		var references = getReferences(),
			citations;
		references.push(referenceData);
		setReferences(references);

		if (typeof citationToAddTo !== "undefined") {
			citations = getCitations();
			citations[citationToAddTo].citationItems.push({
				id : "ITEM-" + references.length
			});
			setCitations(citations);
		}
	};

	var setJsonDocumentList = function (jsonDocumentList) {
		CSLEDIT.exampleData.jsonDocumentList = jsonDocumentList;

		update();
	};

	var update = function () {
		CSLEDIT.viewController.styleChanged("formatCitations");
	};

	return {
		getCitations : getCitations,
		setCitations : setCitations,

		getCitationOptions : getCitationOptions,
		setCitationOptions : setCitationOptions,

		getOption : getOption,
		setOption : setOption,

		getReferences : getReferences,
		setReferences : setReferences,

		getCiteprocReferences : getCiteprocReferences,

		getReferenceIndexesForCitation : getReferenceIndexesForCitation,
		setReferenceIndexesForCitation : setReferenceIndexesForCitation,

		addReference : addReference,

		resetToDefault : function () {
			CSLEDIT.storage.removeItem("CSLEDIT.exampleCitations");
			CSLEDIT.storage.removeItem("CSLEDIT.exampleReferences");
			CSLEDIT.storage.removeItem("CSLEDIT.exampleCitationOptions");
			update();
		}
	};
}());
