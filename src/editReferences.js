"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.editReferences = (function () {
	var init = function (listElement, callback, citation, defaultCheckedRefs) {
		var index = 0,
			checked;

		listElement.children().remove();
		
		// create menus
		$.each(cslEditorExampleData.jsonDocuments, function (itemName, item) {
			listElement.append('<li class=sidePadding><input type="checkbox" value="' + 
				index + '" \/> <strong>' + item.type + 
				'<\/strong>: ' + item.title + '<\/li>');
			index++;
		});

		checked = localStorage.getItem('CSLEDIT.citation' + citation);
		if (checked === null || checked === "") {
			checked = defaultCheckedRefs;
		} else {
			checked = JSON.parse(checked);
		}

		// select the first 3
		listElement.find('input').val(checked).on('change', function () {
			updateCitations(listElement, callback, citation);
		});

		// update with no callback
		updateCitations(listElement, function () {}, citation);
	};

	var updateCitations = function (listElement, callback, citation) {
		var citationItems = [],
			checked = [];

		listElement.find('input').each( function (index) {
			if ($(this).is(':checked')) {
				citationItems.push({id:"ITEM-" + (index + 1)});
				checked.push(index);
			}
		});
		
		localStorage.setItem('CSLEDIT.citation' + citation, JSON.stringify(checked));

		cslEditorExampleData.citationsItems[citation].citationItems = citationItems;

		callback();
	};

	return {
		init : init
	};
}());
