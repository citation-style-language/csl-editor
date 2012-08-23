"use strict";

define(['src/richTextToolbar'], function (CSLEDIT_richTextToolbar) {
	var CSLEDIT_RichTextEditor = function (containerElement, onChange) {
		var that = this;

		this.editor = $('<div>').attr('contenteditable', 'true');

		if (containerElement.css("position") !== "absolute" &&
				containerElement.css("position") !== "relative") {
			console.log("Setting position to relative");
			containerElement.css("position", "relative");
		}
		
		var changed = function () {
			CSLEDIT_richTextToolbar.updateButtonStates();
			if (onChange) {
				onChange(that.value(containerElement));
			}
		};

		this.editor.append(containerElement.html());
		containerElement.html("");
		containerElement.append(this.editor);
		CSLEDIT_richTextToolbar.attachTo(containerElement, this.editor, changed);

		this.editor.mouseup(changed);
		this.editor.keyup(changed);
	};

	CSLEDIT_RichTextEditor.prototype.value = function () {
		return this.editor.html();
	};

	return CSLEDIT_RichTextEditor;
});
