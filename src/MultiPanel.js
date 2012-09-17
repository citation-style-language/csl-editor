"use strict";

// This creates a fieldset which can be switched between different pages of
// content using the typeSelect control.

define(function () {
	// Creates a MultiPanel
	var CSLEDIT_MultiPanel = function (id) {
		var that = this;

		this.element = $('<fieldset class="multiPanel" id="' + id + '"></fieldset>');
		this.typeLegend = $('<legend class="typeLegend">Type:</legend>');
		this.typeSelect = $('<select class="typeSelect"/>');
		this.typeLegend.append(this.typeSelect);

		this.currentContentPanel = $('<div class="contentPanel"/>');
		this.element.append(this.typeLegend);
		this.element.append(this.currentContentPanel);
		this.contentPanels = [];

		this.typeSelect.on('change', function () {
			that.update.apply(that);
		});
	};

	// Sets the callback which is called every time the user switches
	// to a different panel
	CSLEDIT_MultiPanel.prototype.onChange = function (callback) {
		this.onChangeCallback = callback;
	};

	// Add a new panel with the given name
	CSLEDIT_MultiPanel.prototype.addPanel = function (name) {
		var that = this,
			newPanel;

		this.typeSelect.append($('<option>' + name + '</option>'));

		newPanel = $('<div/>').css({display: "none"});
		this.contentPanels.push(newPanel);
		this.currentContentPanel.append(newPanel);
	};

	// Display the appropriate panel given the current state of
	// the this.typeSelect dropdown
	CSLEDIT_MultiPanel.prototype.update = function () {
		var that = this,
			selectedIndex = this.typeSelect.find('option').index(
				this.typeSelect.find('option:selected'));

		// display the correct panel
		$.each(that.contentPanels, function (i, panel) {
			if (i === selectedIndex) {
				panel.css({display: ""});
			} else {
				panel.css({display: "none"});
			}
		});

		if (typeof that.onChangeCallback === "function") {
			that.onChangeCallback(selectedIndex);
		}
	};

	// Select the panel with the given index
	CSLEDIT_MultiPanel.prototype.select = function (index) {
		this.typeSelect.val(this.typeSelect.find('option').eq(index).html());
		this.update();
	};

	return CSLEDIT_MultiPanel;
});
