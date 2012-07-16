"use strict";

var CSLEDIT = CSLEDIT || {};

// use this instead of accessing CSLEDIT.exampleData
CSLEDIT.exampleCitations = (function () {
	var suppressUpdate = false;

	var getCitations = function () {
		var citations;
		if (CSLEDIT.storage.getItemJson('CSLEDIT.exampleCitations') === null) {

			// create empty reference lists for each citation
			citations = [];
			$.each(CSLEDIT.options.get("exampleCitations"), function (citation) {
				citations.push({
					citationId: "CITATION-" + citation,
					citationItems:[],
					properties: {noteIndex:0},
					schema: "https://github.com/citation-style-language/schema/raw/master/csl-citation.json"
				});
			});
			setCitations(citations);

			// populate the reference lists
			$.each(CSLEDIT.options.get("exampleCitations"), function (citation, referenceList) {
				setReferenceIndexesForCitation(citation, referenceList);
			});
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
		if (option >= CSLEDIT.exampleData.additionalOptions.length) {
			option = 0;
		}
		options[citation] = options[citation] || {};
		options[citation][reference] = option;
		setCitationOptions(options);
	};

	var getOption = function (citation, reference) {
		var options = getCitationOptions(),
			option;
		if (!options.hasOwnProperty(citation)) {
			return 0;
		}
		if (!options[citation].hasOwnProperty(reference)) {
			return 0;
		}
		option = options[citation][reference];
		if (option >= CSLEDIT.exampleData.additionalOptions.length) {
			option = 0;
		}
		return option;
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
		   setReferences(CSLEDIT.options.get('exampleReferences'));
		}
		return CSLEDIT.storage.getItemJson('CSLEDIT.exampleReferences');
	};
	var setReferences = function (referenceList) {
		CSLEDIT.storage.setItem('CSLEDIT.exampleReferences', JSON.stringify(referenceList));

		suppressUpdate = true;
		$.each(getCitations(), function (i, citation) {
			limitReferenceIndexesForCitation(i);
		});
		suppressUpdate = false;

		update();
	};

	// remove out of range indexes
	var limitReferenceIndexesForCitation = function (citationIndex) {
		var newReferenceList = [],
			references = getReferences();

		$.each(getReferenceIndexesForCitation(citationIndex), function (i, referenceIndex) {
			if (referenceIndex < references.length) {
				newReferenceList.push(referenceIndex);
			}
		});
		setReferenceIndexesForCitation(citationIndex, newReferenceList);
	};

	var getReferenceIndexesForCitation = function (citationIndex) {
		var indexes = [],
			citations = getCitations();

		console.log("index = " + citationIndex);
		$.each(citations[citationIndex].citationItems, function (i, citationItem) {
			indexes.push(parseInt(citationItem.id.replace("ITEM-", "")) - 1);
		});

		return indexes;
	};

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
		if (!suppressUpdate && "viewController" in CSLEDIT) {
			CSLEDIT.viewController.styleChanged("formatCitations");
		}
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
