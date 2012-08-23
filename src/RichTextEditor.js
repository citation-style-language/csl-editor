"use strict";

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
			console.log("Setting position to relative");
			containerElement.css("position", "relative");
		}
		
		var changed = function () {
			CSLEDIT_richTextToolbar.updateButtonStates();
			if (onChange) {
				onChange(that.value());
			}
		};

		this.editor.append(containerElement.html());
		containerElement.html("");
		containerElement.append(this.editor);
		CSLEDIT_richTextToolbar.attachTo(containerElement, this.editor, changed);

		this.editor.mouseup(changed);
		this.editor.keyup(changed);
	};

	CSLEDIT_RichTextEditor.prototype.value = function (newValue) {
		if (typeof(newValue) === "undefined") {
			return CSLEDIT_xmlUtility.cleanInput(this.editor.html());
		} else {
			this.editor.html(CSLEDIT_xmlUtility.cleanInput(newValue));
		}
	};

	return CSLEDIT_RichTextEditor;
});
