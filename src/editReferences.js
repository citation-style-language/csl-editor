"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.editReferences = (function () {
	var init = function (listElement, callback, citation, checked) {
		var index = 0;

		listElement.children().remove();
			
		// create menus
		$.each(cslEditorExampleData.jsonDocuments, function (itemName, item) {
			listElement.append('<li class=sidePadding><input type="checkbox" value="' + index + '" \/> <strong>' + item.type + 
				'<\/strong>: ' + item.title + '<\/li>');
			index++;
		});

		// select the first 3
		listElement.find('input').val(checked).on('change', function () {
			updateCitations(listElement, callback, citation);
		});

		// update with no callback
		updateCitations(listElement, function () {}, citation);
	};

	var updateCitations = function (listElement, callback, citation) {
		var citationItems = [];

		listElement.find('input').each( function (index) {
			if ($(this).is(':checked')) {
				citationItems.push({id:"ITEM-" + (index + 1)});
			}
		});
		
		cslEditorExampleData.citationsItems[citation].citationItems = citationItems;
		/*
		cslEditorExampleData.citationsItems = [{
			citationId: "CITATION-1",
			citationItems: citationItems,
			properties: {
				"noteIndex": 0
			},
			schema: "https://github.com/citation-style-language/schema/raw/master/csl-citation.json"
		}];*/

		callback();
	};

	return {
		init : init
	};
}());
