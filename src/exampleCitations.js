"use strict";

// Allows getting and setting
//
// - metadata for the example references
// - example inline citations (citation clusters as citeproc-js calls them)
define(
		[	'jquery',
			'src/storage',
			'src/options',
			'src/exampleData'
		],
		function (
			$,
			CSLEDIT_storage,
			CSLEDIT_options,
			CSLEDIT_exampleData
		) {
	var suppressUpdate = false;

	// Returns a new empty citation cluster
	var newCluster = function (citationIndex) {
		return {
			citationId: "CITATION-" + citationIndex,
			citationItems: [],
			properties: {noteIndex: 0},
			schema: "https://github.com/citation-style-language/schema/raw/master/csl-citation.json"
		};
	};

	// Returns a list of citation clusters as used by citeproc
	var getCitations = function () {
		var citations;
		if (CSLEDIT_storage.getItemJson('CSLEDIT_exampleCitations') === null) {

			// create empty reference lists for each citation
			citations = [];
			$.each(CSLEDIT_options.get("exampleCitations"), function (citation) {
				citations.push(newCluster(citation));
			});
			setCitations(citations);

			// populate the reference lists
			$.each(CSLEDIT_options.get("exampleCitations"), function (citation, referenceList) {
				setReferenceIndexesForCitation(citation, referenceList);
			});
		}
		return CSLEDIT_storage.getItemJson('CSLEDIT_exampleCitations');
	};

	// Set the list of citation clusters, each cluster should be in the
	// form required by the citeproc-js appendCitationCluster() function
	var setCitations = function (citations) {
		applyCitationOptions(citations, getCitationOptions());
		CSLEDIT_storage.setItem('CSLEDIT_exampleCitations', JSON.stringify(citations));
		update();
	};
	
	// Gets the index of any options for each reference in each inline citation.
	//
	// e.g.
	//     {
	//         "0":  // inline citation 0
	//             {
	//                 "0": 1,  // reference 0 has option 1
	//                 "1": 0,  // reference 1 has option 0
	//                 "5": 2   // reference 5 has option 2
	//             }
	//     }
	//
	// If a reference is not included in the return object,
	// it's assumed it is option 0, which is a normal citation
	// with no additional options.
	//
	// The options are defined in CSLEDIT_exampleData.additionalOptions
	var getCitationOptions = function () {
		if (CSLEDIT_storage.getItemJson('CSLEDIT_exampleCitationOptions') === null) {
			return {};
		}
		return CSLEDIT_storage.getItemJson('CSLEDIT_exampleCitationOptions');
	};

	// This sets the citationOptions
	//
	// citationOptions is the same format as the getCitationOptions() return value
	var setCitationOptions = function (citationOptions) {
		var citations = getCitations();
		CSLEDIT_storage.setItem('CSLEDIT_exampleCitationOptions', JSON.stringify(citationOptions));
		
		applyCitationOptions(citations, citationOptions);
		setCitations(citations);
	};

	var applyCitationOptions = function (citations, citationOptions) {
		// apply options
		$.each(citations, function (citationIndex, citation) {
			var index;
			for (index = 0; index < citation.citationItems.length; index++) {
				var citationItem = citation.citationItems[index],
					referenceIndex = parseInt(citationItem.id.replace("ITEM-", ""), 10) - 1,
					optionIndex = getOption(citationIndex, referenceIndex),
					options = CSLEDIT_exampleData.additionalOptions[optionIndex];
			
				// replace all options
				citationItem = { id : citationItem.id };
				$.each(options.options, function (key, value) {
					citationItem[key] = value;
				});
				citation.citationItems[index] = citationItem;
			}
		});
	};

	// Sets the option for the given reference in the given inline citation
	//
	// option is the index of the citation option to apply, see
	// CSLEDIT_exampleData.additionalOptions for a definition of these options
	var setOption = function (citation, reference, option) {
		var options = getCitationOptions();
		if (option >= CSLEDIT_exampleData.additionalOptions.length) {
			option = 0;
		}
		options[citation] = options[citation] || {};
		options[citation][reference] = option;
		setCitationOptions(options);
	};

	// Returns the index of the option for the given reference in the given inline citation
	//
	// See CSLEDIT_exampleData.additionalOptions for definitions of these options
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
		if (option >= CSLEDIT_exampleData.additionalOptions.length) {
			option = 0;
		}
		return option;
	};

	// Returns an object containing metadata for all the references
	// ready to pass to citeproc
	//
	// Very similar to getReferences but returns an object with keys
	// in the form "ITEM-1", "ITEM-2", etc. instead of a list, and
	// each item in the list is given a corresponding id value,
	// e.g. "ITEM-2"
	var getCiteprocReferences = function (references /* optional */) {
		var citeprocReferences = {};

		references = references || getReferences();

		$.each(references, function (i, reference) {
			var itemString = "ITEM-" + (i + 1);
			reference.id = itemString;
			citeprocReferences[itemString] = reference;
		});

		return citeprocReferences;
	};		

	// Returns a list of csl-data.json references
	var getReferences = function () {
		// TODO: At the moment, if CSLEDIT_exampleData.jsonDocumentList is updated between
		//       releases, it will only get used in the Visual Editor if the user resets all
		//       citations in the citation editor dialog, or clears their localSettings.
		//       Should be fixed.
		if (CSLEDIT_storage.getItemJson('CSLEDIT_exampleReferences') === null) {
			setReferences(CSLEDIT_options.get('exampleReferences'));
		}
		return CSLEDIT_storage.getItemJson('CSLEDIT_exampleReferences');
	};

	// Set the list of csl-data.json references, used to
	// build up the inline citation clusters
	var setReferences = function (referenceList) {
		CSLEDIT_storage.setItem('CSLEDIT_exampleReferences', JSON.stringify(referenceList));

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

	// Returns the list of reference indexes using in the given citation
	var getReferenceIndexesForCitation = function (citationIndex) {
		var indexes = [],
			citations = getCitations();

		if (citationIndex >= citations.length) {
			return [];
		}

		$.each(citations[citationIndex].citationItems, function (i, citationItem) {
			indexes.push(parseInt(citationItem.id.replace("ITEM-", ""), 10) - 1);
		});

		return indexes;
	};
	
	// Sets the list of reference indexes used in the given citation.
	//
	// e.g. This will set citation 1 (the 2nd citation) to use references 2 and 4
	//      (reference index 2 corresponds to "ITEM-3" and index 4 to "ITEM-5")
	//
	//      setReferenceIndexesForCitation(1, [2, 4]);
	var setReferenceIndexesForCitation = function (citationIndex, references) {
		var citations = getCitations();
		
		citations[citationIndex] = citations[citationIndex] || newCluster(citationIndex);
		citations[citationIndex].citationItems = [];

		$.each(references, function (i, referenceIndex) {
			citations[citationIndex].citationItems.push({
				id : "ITEM-" + (referenceIndex + 1)
			});
		});

		setCitations(citations);
	};
	
	// Append the given csl-data.json reference to the list of references,
	// and optionally append it to the given inline citation
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

	// Trigger a CSLEDIT_viewController updateFinished event,
	// which will re-generate the citations
	var update = function () {
		if (!suppressUpdate) {
			if (typeof(CSLEDIT_viewController) !== "undefined") {
				CSLEDIT_viewController.styleChanged("updateFinished");
			}
			$(document).trigger('csledit:citationsChanged');
		}
	};

	// static function
	var createCitationCluster = function (referenceIndexList) {
		var cluster = newCluster();
		
		$.each(referenceIndexList, function (i, referenceIndex) {
			cluster.citationItems.push({
				id : "ITEM-" + (referenceIndex + 1)
			});
		});

		return cluster;
	};

	// Remove any customization of the example citations and use the hard-coded
	// ones instead
	var resetToDefault = function () {
		CSLEDIT_storage.removeItem("CSLEDIT_exampleCitations");
		CSLEDIT_storage.removeItem("CSLEDIT_exampleReferences");
		CSLEDIT_storage.removeItem("CSLEDIT_exampleCitationOptions");
		update();
	};

	return {
		getCitations : getCitations,
		setCitations : setCitations,

		getOption : getOption,
		setOption : setOption,

		getReferences : getReferences,
		setReferences : setReferences,

		getCiteprocReferences : getCiteprocReferences,

		getReferenceIndexesForCitation : getReferenceIndexesForCitation,
		setReferenceIndexesForCitation : setReferenceIndexesForCitation,

		addReference : addReference,

		resetToDefault : resetToDefault,

		createCitationCluster : createCitationCluster
	};
});
