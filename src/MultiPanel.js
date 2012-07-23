"use strict";

var CSLEDIT = CSLEDIT || {}; 
CSLEDIT.MultiPanel = function (id) {
	var that = this;

	this.element = $('<fieldset class="multiPanel" id="' + id + '"></fieldset>');
	this.typeLegend = $('<legend class="typeLegend">Type:</legend>');
	this.typeSelect = $('<select class="typeSelect"/>');
	this.typeLegend.append(this.typeSelect);

	this.currentContentPanel = $('<div class="contentPanel"/>');
	this.element.append(this.typeLegend);
	this.element.append(this.currentContentPanel);
	this.contentPanels = [];

	// a non-anonymous function allowing this.update to access the correct 'this'
	this.updateFunction = function () {
		that.update.apply(that);
	};

	this.typeSelect.on('change', this.updateFunction);
};

CSLEDIT.MultiPanel.prototype.onChange = function (callback) {
	this.onChangeCallback = callback;
};

CSLEDIT.MultiPanel.prototype.addPanel = function (name) {
	var that = this,
		newPanel;

	this.typeSelect.append($('<option>' + name + '</option>'));

	newPanel = $('<div/>').css({display: "none"});
	this.contentPanels.push(newPanel);
	this.currentContentPanel.append(newPanel);
};

CSLEDIT.MultiPanel.prototype.update = function () {
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

CSLEDIT.MultiPanel.prototype.select = function (index) {
	this.typeSelect.val(this.typeSelect.find('option').eq(index).html());
	this.update();
};
