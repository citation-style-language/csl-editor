"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.editReferences = (function () {
	var listElement,
		callback,
		citation,
		defaultCheckedRefs;

	var setupDragDrop = function (target) {
		target.bind('dragover', function (event) {
			console.log('ondragover');
			event.preventDefault();
		});
		target.bind('drop', function (event) {
			var dataTransfer = event.originalEvent.dataTransfer,
				data = dataTransfer.getData("text"),
				dataItems,
				jsonData,
				numItems;
			event.preventDefault();
			
			console.log("dropped " + data);

			// TODO: make jsonDocuments a list instead of object
			numItems = 0;
			$.each(CSLEDIT.exampleData.jsonDocuments, function () {
				numItems++;
			});
	
			dataItems = data.split("\n");
			
			$.each(dataItems, function (i, dataItem) {
				var jsonData = JSON.parse(dataItem);
				
				console.log("data item" + dataItem);

				if (typeof jsonData === null) {
					alert("Not valid csl-data.json:\n\n" + dataItem);
				} else {
					numItems++;
					jsonData["id"] = "ITEM-" + numItems;
					CSLEDIT.exampleData.jsonDocuments["ITEM-" + numItems] = jsonData;
					alert("Reference imported:\n\n" + dataItem);
				}
			});

			init(listElement, callback, citation, defaultCheckedRefs);
		});
	};

	var init = function (_listElement, _callback, _citation, _defaultCheckedRefs, dragDropTarget) {
		var index = 0,
			checked;

		listElement = _listElement;
		callback = _callback;
		citation = _citation;
		defaultCheckedRefs = _defaultCheckedRefs;

		if (typeof dragDropTarget !== "undefined") {
			setupDragDrop(dragDropTarget);
		}

		listElement.children().remove();
		
		// create menus
		$.each(CSLEDIT.exampleData.jsonDocuments, function (itemName, item) {
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
