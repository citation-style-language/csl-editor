"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.EditReferences = function (listElement, callback, citation, defaultCheckedRefs, dragDropTarget) {
	var setupDragDrop = function (target) {
		target.bind('dragover', function (event) {
			console.log('ondragover');
			event.preventDefault();
		});
		target.bind('drop', function (event) {
			var dataTransfer = event.originalEvent.dataTransfer,
				data = dataTransfer.getData("text/plain"),
				dataItems,
				jsonData;

			event.preventDefault();
			console.log("dropped " + data);
			dataItems = data.split("\n");
			
			$.each(dataItems, function (i, dataItem) {
				var jsonData = JSON.parse(dataItem);
				
				console.log("data item" + dataItem);

				if (typeof jsonData === null) {
					alert("Not valid csl-data.json:\n\n" + dataItem);
				} else {
					CSLEDIT.exampleCitations.addReference(jsonData);
					alert("Reference imported:\n\n" + dataItem);
				}
			});

			init();
		});
	};

	var init = function () {
		var index = 0,
			checked;

		listElement.children().remove();
		
		// create menus
		$.each(CSLEDIT.exampleCitations.getReferences(), function (i, item) {
			var description = '<strong>' + item.type + 
				'<\/strong>: ' + item.title,
				additionalOptions = CSLEDIT.exampleData.additionalOptions[index];

			if (typeof additionalOptions !== "undefined") {
				description += '<br \/>(' + additionalOptions.description + ')';
			}

			listElement.append('<li class=sidePadding><input type="checkbox" ' + 
				'id="ref' + citation + '-' + index + '" value="' + 
				index + '" \/> <label for="ref' + citation + '-' + index + '">' + description + '<\/label><\/li>');
			index++;
		});

		checked = CSLEDIT.exampleCitations.getReferenceIndexesForCitation(citation);
		console.log("checked = " + JSON.stringify(checked));

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
				citationItems.push(citationItem);
				checked.push(index);
			}
		});
		
		console.log("setting " + citation + " to " + JSON.stringify(checked));

		CSLEDIT.exampleCitations.setReferenceIndexesForCitation(citation, checked);
		//CSLEDIT.storage.setItem('CSLEDIT.citation' + citation, JSON.stringify(checked));
		//CSLEDIT.exampleData.citationsItems[citation].citationItems = citationItems;
		callback();
	};

	init();
	
	if (typeof dragDropTarget !== "undefined") {
		setupDragDrop(dragDropTarget);
	}

	return {
		init : init
	};
};
