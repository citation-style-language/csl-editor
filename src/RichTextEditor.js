"use strict";

// A basic rich text editor using a contenteditable div

define(
		[	'src/richTextToolbar',
			'src/xmlUtility'
		], function (
			CSLEDIT_richTextToolbar,
			CSLEDIT_xmlUtility
		) {
	var CSLEDIT_RichTextEditor = function (containerElement, onChange) {
		var that = this;

		this.editor = $('<div>')
			.attr('contenteditable', 'true')
			.addClass('editor')
			.css("cursor", "text");

		if (containerElement.css("position") !== "absolute" &&
				containerElement.css("position") !== "relative") {
			containerElement.css("position", "relative");
		}
		
		var changed = function () {
			CSLEDIT_richTextToolbar.updateButtonStates();
			if (onChange) {
				onChange(that.value());
			}
		};

		var paste = function () {
			var oldSelectionNode = window.getSelection().anchorNode,
				oldSelectionOffset = window.getSelection().anchorOffset,				
				clone = that.editor.clone();

			containerElement.css({
				overflow: "hidden",
				height: containerElement.height()
			});
			containerElement.append(clone);
			that.editor.css({
				"position": "absolute",
				"left": "-1000px",
				"width": "500px"
			});

			setTimeout(function () {
				changed();
				clone.remove();
				that.editor.css({
					"position" : "",
					"left" : 0,
					"width" : ""
				});
				containerElement.css({
					overflow: "",
					height: ""
				});
				containerElement.append(that.editor);
				setTimeout(function () {
					var range = document.createRange();
					range.selectNodeContents(that.editor[0]);
					range.collapse(false);
					var selection = window.getSelection();
					selection.removeAllRanges();
					selection.addRange(range);
				}, 1);
			}, 1);
		};

		this.editor.append(containerElement.html());
		containerElement.html("");
		containerElement.append(this.editor);
		CSLEDIT_richTextToolbar.attachTo(containerElement, this.editor, changed);

		this.editor.mouseup(changed);
		this.editor.keyup(changed);
		this.editor.bind("drop", paste);
		this.editor.bind("paste", paste);
	};

	CSLEDIT_RichTextEditor.prototype.value = function (newValue) {
		if (typeof(newValue) === "undefined") {
			var cleaned = CSLEDIT_xmlUtility.cleanInput(this.editor.html(), true);
			if (cleaned !== this.editor.html()) {
				document.execCommand("undo");
				var range = document.createRange();
				range.selectNodeContents(this.editor[0]);
				var selection = window.getSelection();
				selection.removeAllRanges();
				selection.addRange(range);
				if (cleaned === "") {
					// becuase inserting "" with insertHTML fails on firefox
					document.execCommand("delete");
				} else {
					document.execCommand("insertHTML", false, cleaned);
				}
			}
			return CSLEDIT_xmlUtility.cleanInput(cleaned);
		} else {
			this.editor.html(CSLEDIT_xmlUtility.cleanInput(newValue));
		}
	};

	return CSLEDIT_RichTextEditor;
});
