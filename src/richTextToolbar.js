"use strict";

define(
		[	'src/urlUtils',
			'src/debug'
		],
		function (
			CSLEDIT_urlUtils,
			debug
		) {

	var toolbarElement;	
	var blurTimer;
	var clicking = false;
	var buttons = [];
	var currentCallback = null;

	$(document).ready(function () {
		toolbarElement = $('<div class="toolbar richText">');

		var addButton = function (style, title, innerHTML) {
			var button = $('<a>')
				.attr('href', '#')
				.attr('data-style', style)
				.attr('title', title)
				.append(innerHTML);

			buttons.push(button)
			toolbarElement.append(button);
		};

		addButton("bold", "Bold", "<b>B</b>");
		addButton("italic", "Italic", "<i>i</i>");
		addButton("underline", "Underline", "<u>U</u>");
		addButton("superscript", "Superscript", "<sup>sup</sup>");
		addButton("subscript", "Subscript", "<sub>sub</sub>");

		toolbarElement.find('a').mousedown(function () {
			clicking = true;
		});
		toolbarElement.find('a').mouseup(function () {
			clicking = false;
		});

		toolbarElement.find('a').click(function (event) {
			var $this = $(this),
				exec;

			debug.assert("execCommand" in document, "execCommand not available");
			document.execCommand($this.attr('data-style'), false, null);
		
			updateButtonStates();

			if (currentCallback !== null) {
				currentCallback();
			}

			event.preventDefault();
		});

		toolbarElement.css({
			"display" : "inline-block",
			"overflow" : "hidden",
			"position" : "absolute"
		});
	});

	var updateButtonStates = function () {
		debug.assert("queryCommandState" in document, "queryCommandState not available");
		$.each(buttons, function (i, button) {
			if (document.queryCommandState(button.attr('data-style')) === true) {
				button.addClass("selected");
			} else {
				button.removeClass("selected");
			}
		});
	};

	var hideToolbar = function () {
		toolbarElement.css("visibility", "hidden");
		currentCallback = null;
	};

	// Attach to an element
	var attachTo = function (container, editor, callback) {
		editor.focus(function () {
			toolbarElement.css({
				"display" : "inline-block",
				"top" : -35
			});

			currentCallback = callback;
			container.prepend(toolbarElement);
			toolbarElement.css("visibility", "visible");
		});

		editor.blur(function () {
			if (!clicking) {
				hideToolbar();
			}
		});
	};

	return {
		attachTo : attachTo,
		updateButtonStates : updateButtonStates
	};
});
