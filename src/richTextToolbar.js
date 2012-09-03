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

	var mouseX = 0;
	var mouseY = 0;

	var mouseupCallback = null;

	$(document).ready(function () {
		toolbarElement = $('<div class="toolbar richText has-arrow">');
		toolbarElement.append('<span class="pointer">');

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
		addButton("italic", "Italic", "<i>I</i>");
		addButton("underline", "Underline", "<u>U</u>");
		addButton("superscript", "Superscript", "x<sup>s</sup>");
		addButton("subscript", "Subscript", "x<sub>s</sub>");
		addButton("clear", "Clear", "&nbsp;clear&nbsp;");

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
			"overflow" : "visible",
			"position" : "absolute"
		});
		
		$(document).mousemove(function (e) {
			mouseX = e.pageX;
			mouseY = e.pageY;
		});

		$(document).mouseup(function () {
			if (mouseupCallback !== null) {
				mouseupCallback();
				mouseupCallback = null;
			}
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

	var showToolbar = function (container, callback, forceMouseX) {
		var cX = container.offset().left;
		var cWidth = container.width();
		var cY = container.offset().top;
		var cHeight = container.height();
		var toolbarWidth = toolbarElement.width();

		if (toolbarWidth === 0) {
			toolbarWidth = 127;
		}

		// default position
		var x = (cWidth - toolbarWidth) / 2;
		var y = cHeight;

		if (forceMouseX === true ||
				(mouseX >= cX && mouseX <= cX + cWidth &&
				mouseY >= cY && mouseY <= cY + cHeight)) {
			x = mouseX - toolbarWidth / 2 - cX;
		}

		x = Math.min(cWidth - toolbarWidth - 2, x);
		x = Math.max(0, x);

		toolbarElement.css({
			"display" : "inline-block",
			"top" : y
		});

		if (x !== null) {
			toolbarElement.css("left", x);
		}

		currentCallback = callback;
		container.prepend(toolbarElement);
		toolbarElement.css("visibility", "visible");

	};

	var checkSelection = function (container, callback, forceMouseX) {
		var selection = window.getSelection();

		updateButtonStates();
		if (selection.anchorNode !== selection.focusNode ||
				selection.anchorOffset !== selection.focusOffset) {
			showToolbar(container, callback, forceMouseX);
		} else {
			if (toolbarElement.find("a.selected").length > 0) {
				showToolbar(container, callback, forceMouseX);
			} else {
				hideToolbar();
			}
		}
	};

	// Attach to an element
	var attachTo = function (container, editor, callback) {
		editor.mousedown(function () {
			mouseupCallback = function () {
				checkSelection(container, callback, true);
			};
		editor.focus(function () {
			toolbarElement.css({
				"display" : "inline-block",
				"bottom" : -25
			});

			currentCallback = callback;
			container.prepend(toolbarElement);
			toolbarElement.css("visibility", "visible");
		});
		editor.keyup(function () {
			checkSelection(container, callback);
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
