"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.editReferences = (function () {
	var init = function (listElement, callback, citation, defaultCheckedRefs) {
		var index = 0,
			checked;

		listElement.children().remove();
		
		// create menus
		$.each(CSLEDIT.exampleData.jsonDocuments, function (itemName, item) {
			var description = '<strong>' + item.type + 
				'<\/strong>: ' + item.title,
				additionalOptions = CSLEDIT.exampleData.additionalOptions[index];

			if (typeof additionalOptions !== "undefined") {
				description += '<br \/>(' + additionalOptions.description + ')';
			}

			listElement.append('<li class=sidePadding><input type="checkbox" value="' + 
				index + '" \/>' + description + '<\/li>');
			index++;
		});

		checked = CSLEDIT.storage.getItem('CSLEDIT.citation' + citation);
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
		var citationItem,
			citationItems = [],
			checked = [],
			additionalOptions;

		listElement.find('input').each( function (index) {
			if ($(this).is(':checked')) {
				citationItem = {id:"ITEM-" + (index + 1)};
				additionalOptions = CSLEDIT.exampleData.additionalOptions[index];
				if (typeof additionalOptions !== "undefined") {
					// add options to citationItem
					$.each (additionalOptions.options, function (key, value) {
						citationItem[key] = value;
					});
				}
				console.log('adding citation item: ' + JSON.stringify(citationItem));
				citationItems.push(citationItem);
				checked.push(index);
			}
		});
		
		CSLEDIT.storage.setItem('CSLEDIT.citation' + citation, JSON.stringify(checked));

		CSLEDIT.exampleData.citationsItems[citation].citationItems = citationItems;

		callback();
	};

	return {
		init : init
	};
}());
