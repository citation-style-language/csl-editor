"use strict";

var CSLEDIT = CSLEDIT || {};

/* provides a way to edit space-delimited list of stings,
 * each of which must be one of the supplied values
 */

CSLEDIT.MultiComboBox = function (element, possibleValues, onChange) {
	this._element = element;
	this._values = [];
	this._onChange = onChange;

	assert(possibleValues.length > 0);
	this._selectHtml = '<select><option>' +	possibleValues.join('<\/option><option>') +
		'<\/option><\/select>';

	this._refresh(true);
};

CSLEDIT.MultiComboBox.prototype.getElement = function () {
	return this._element;
};

CSLEDIT.MultiComboBox.prototype.val = function (val, suppressOnChange) {
	if (typeof val === "undefined") {
		this._readValues();
		return this._values.join(" ");
	} else {
		this._values = val.split(" ");
		if (typeof suppressOnChange === "undefined") {
			suppressOnChange = false;
		}
		this._refresh(suppressOnChange);
	}
};

CSLEDIT.MultiComboBox.prototype._readValues = function () {
	var that = this;
	// repopulate _values from current combo box values
	that._values = [];
	this._element.find('select').each(function () {
		that._values.push($(this).val());
	});
};

CSLEDIT.MultiComboBox.prototype._refresh = function (suppressOnChange) {
	var that = this;

	this._element.html('');
		
	$.each(this._values, function (i, value) {
		var select = $(that._selectHtml).css({"margin-right": 0}),
			deleteButton = $('<button class="delete" data-index="' + i + '">X<\/button>').css({"margin-left": 0});

		select.val(value);

		that._element.append(select);
		that._element.append(deleteButton);
		that._element.append("<br \/>");
	});

	that._element.append('<button class="add">+ Add</button>');

	this._element.find('button.delete').on('click', function (event) {
		var index = $(event.target).attr("data-index");
		that._readValues();
		that._values.splice(index, 1);
		that._refresh();
	});

	this._element.find('button.add').on('click', function (event) {
		that._readValues();
		that._values.push('');
		that._refresh();
	});

	this._element.find('select').on('change', function (event) {
		that._changed();
	});

	if (!suppressOnChange) {
		that._changed();
	}
};

CSLEDIT.MultiComboBox.prototype._changed = function () {
	if (typeof this._onChange !== "undefined") {
		this._readValues();
		this._onChange(this._values.join(' '));
	}
};
