"use strict";

// Allows provides a way to edit space-delimited list of stings,
// each of which must be one of the supplied values

define(['src/debug'], function (debug) {
	// Constructs a MultiComboBox
	var CSLEDIT_MultiComboBox = function (element, possibleValues, onChange, unique) {
		this._element = element;
		this._values = [];
		this._onChange = onChange;
		this._unique = unique;

		debug.assert(possibleValues.length > 0);
		this._selectHtml = '<select><option>' +	possibleValues.join('</option><option>') +
			'</option></select>';

		this._refresh(true);
	};

	// Returns the jQuery element this MultiComboBox is drawn within
	CSLEDIT_MultiComboBox.prototype.getElement = function () {
		return this._element;
	};

	// Set the tooltip for this MultiComboBox
	CSLEDIT_MultiComboBox.prototype.setTooltip = function (tooltip) {
		this._element.attr("title", tooltip);
	};

	// Get or set the value of this MultiComboBox depending on whether the
	// val argument is present
	CSLEDIT_MultiComboBox.prototype.val = function (val, suppressOnChange) {
		if (typeof val === "undefined") {
			this._readValues();
			return this._values.join(" ");
		} else {
			if (val === "") {
				this._values = [];
			} else {
				this._values = val.split(" ");
			}
			if (typeof suppressOnChange === "undefined") {
				suppressOnChange = false;
			}
			this._refresh(suppressOnChange);
		}
	};

	CSLEDIT_MultiComboBox.prototype._readValues = function () {
		var that = this;
		// repopulate _values from current combo box values
		that._values = [];
		this._element.find('select').each(function () {
			that._values.push($(this).val());
		});
	};

	CSLEDIT_MultiComboBox.prototype._refresh = function (suppressOnChange) {
		var that = this,
			table = $('<table></table>'),
			addButton;

		this._element.html('');
		
		$.each(this._values, function (i, value) {
			var row = $('<tr></tr>'),
				select = $(that._selectHtml).css({"margin-right": 0}),
				deleteButton = $('<button class="delete" data-index="' + i +
					'"> - </button>').css({"margin-left": 0});

			select.val(value);

			row.append($('<td></td>').append(select));
			row.append($('<td></td>').append(deleteButton));
			table.append(row);
		});

		addButton = $('<button class="add">+</button>');
		table.append($('<tr></tr>').append($('<td></td>').append(addButton)));

		this._element.append(table);

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

	CSLEDIT_MultiComboBox.prototype._changed = function () {
		if (typeof this._onChange !== "undefined") {
			this._readValues();
			this._onChange(this._values.join(' '));
		}
	};
	return CSLEDIT_MultiComboBox;
});
