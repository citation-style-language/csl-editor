"use strict";

// A dialog allowing the user to customise the in-line citations

define(
		[	'src/exampleCitations',
			'src/exampleData',
			'src/debug',
			'jquery.ui'
		],
		function (
			CSLEDIT_exampleCitations,
			CSLEDIT_exampleData,
			debug,
			jquery_ui
		) {
	var dialog = $('<div/>'),
		advanced = $('<div/>', {id: "accordion"}).css({"padding-top": "10px", width: "100%"}),
		advancedContents = $('<div/>'),
		referencePanel = $('<div class="refrenceList" />'),
		newReferenceInput = $('<textarea class="addReference" /><br />').css({width: "100%", height: "100px"}),
		addReferenceButton = $('<button>Add new reference</button>'),
		resetReferencesButton = $('<button>Reset <strong>all</strong> citations to default</button>'),
		citation,
		initialised = false;

	dialog.append(referencePanel);
	dialog.append(resetReferencesButton);
	dialog.append(advanced);

	advanced.append('<h3><a href="#">Advanced</a></h3>');
	advanced.append(advancedContents);

	advancedContents.append("<h3>Add new reference</h3>");
	advancedContents.append("<p>Input csl-data.json here and click \"Add new Reference\"</p>");
	advancedContents.append(newReferenceInput);
	advancedContents.append(addReferenceButton);

	resetReferencesButton.on('click', function () {
		CSLEDIT_exampleCitations.resetToDefault();
		updateReferenceList();
	});

	addReferenceButton.on('click', function () {
		var jsonData,
			referenceList;
	   
		try {
			jsonData = JSON.parse(newReferenceInput.val());
		} catch (e) {
			alert("Error: Not valid JSON");
			return;
		}

		// will accept individual references or a list
		referenceList = [].concat(jsonData);
		$.each(referenceList, function (i, reference) {
			CSLEDIT_exampleCitations.addReference(reference, citation);
		});

		updateReferenceList();
		newReferenceInput.val("");
	});

	var updateReferenceList = function () {
		var table = $('<table/>');

		referencePanel.children().remove();

		$.each(CSLEDIT_exampleCitations.getReferences(), function (i, reference) {
			var row = $('<tr/>'),
				input,
				label1,
				label2,
				select;

			input = $('<input/>', {
					type : "checkbox",
					id : "citationEditorReference" + i
				});
			label1 = $('<label/>', {
					for : "citationEditorReference" + i
				}).append($('<strong/>').text(reference.type));
			label2 = $('<label/>', {
					for : "citationEditorReference" + i
				}).text(reference.title);
			select = $('<select/>');
			$.each(CSLEDIT_exampleData.additionalOptions, function (i, option) {
				select.append($('<option/>').text(option.description));
			});

			var description;
			description = CSLEDIT_exampleData.additionalOptions[
				CSLEDIT_exampleCitations.getOption(citation, i)].description;
			debug.log(description);
			select.val(description);

			row.append($('<td/>').append(input));
			row.append($('<td/>').append(label1));
			row.append($('<td/>').append(label2));
			row.append($('<td/>').append(select));
			table.append(row);
		});
		referencePanel.append(table);

		table.find('td').css({"padding-right": "8px"});

		debug.log("checked = " +
				JSON.stringify(CSLEDIT_exampleCitations.getReferenceIndexesForCitation(citation)));

		$.each(CSLEDIT_exampleCitations.getReferenceIndexesForCitation(citation), function (i, refIndex) {
			referencePanel.find('input[type=checkbox]').eq(refIndex).attr('checked', true);
		});
		referencePanel.find('input[type=checkbox]').on('change', function () {
			updateCitations();
		});
		referencePanel.find('select').on('change', function () {
			var reference = referencePanel.find('select').index($(this)),
				optionIndex = $(this).children('option').index(
					$(this).children('option[value="' + $(this).val() + '"]'));

			CSLEDIT_exampleCitations.setOption(citation, reference, optionIndex);
		});
	};

	var updateCitations = function () {
		var citationItem,
			citationItems = [],
			checked = [],
			additionalOptions;

		referencePanel.find('input').each(function (index) {
			if ($(this).is(':checked')) {
				checked.push(index);
			}
		});
		
		debug.log("setting " + citation + " to " + JSON.stringify(checked));

		CSLEDIT_exampleCitations.setReferenceIndexesForCitation(citation, checked);
	};

	// Presents a dialog allowing customisation of the given inline citation
	//
	// - _citation - the integer index of the citation to edit
	var editCitation = function (_citation) {
		citation = _citation;
		updateReferenceList();

		// list references
		dialog.dialog({
			title : 'Edit Citation ' + (citation + 1),
			width : 700,
			resizable: false
		});

		if (!initialised) {
			advanced.accordion({
				collapsible : true,
				active : false
			});
			initialised = true;
		}
		
		if (dialog.height() > $(window).height() - 50) {
			dialog.height($(window).height() - 50);
		}

		// Give the dialog has a fixed height so that it doesn't expand beyond the bottom
		// of the page when the "Advanced" accoridion is expanded
		dialog.dialog('option', 'height', dialog.height() + 55);

		if (dialog.offset().top < 80) {
			dialog.dialog("option", "position", [dialog.offset().left, 80]);
		}
	};

	return {
		editCitation : editCitation 
	};
});
