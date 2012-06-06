"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.MultiPanel = function (id) {
	var that = this;

	this.element = $('<div class="multiPanel" id="' + id + '"><\/div>');
	this.radioButtons = $('<div class="radioButtons"><\/div>');
	this.currentContentPanel = $('<div class="contentPanel"><\/div>');
	this.element.append(this.radioButtons);
	this.element.append(this.currentContentPanel);
	this.contentPanels = [];

	// a non-anonymous function allowing this.update to access the correct 'this'
	this.updateFunction = function () {
		that.update.apply(that);
	}
};

CSLEDIT.MultiPanel.prototype.onChange = function (callback) {
	this.onChangeCallback = callback;
};

CSLEDIT.MultiPanel.prototype.addPanel = function (name) {
	var that = this,
		radioId = 'multiPanel' + this.contentPanels.length,
		newPanel;

	this.radioButtons.append(
		$('<input id="' + radioId +	'" type="radio" name="multiPanel" \/>' + 
			'<label for="' + radioId + '">' + name + '<\/label>'));

	newPanel = $('<div><\/div>').css({display: "none"});
	this.contentPanels.push(newPanel);
	this.currentContentPanel.append(newPanel);

	this.element.find('input[type="radio"]').off('change', this.updateFunction);
	this.element.find('input[type="radio"]').on('change', this.updateFunction);
};

CSLEDIT.MultiPanel.prototype.update = function () {
	var that = this;

	this.element.find('input[type="radio"]').each( function (index) {
		var $this = $(this);
		if ($this.is(':checked')) {
			console.log($this + " is checked");

			// display the correct panel
			$.each(that.contentPanels, function (i, panel) {
				if (i === index) {
					panel.css({display:""});
				} else {
					panel.css({display:"none"});
				}
			});

			if (typeof that.onChangeCallback === "function") {
				that.onChangeCallback(index);
			}
		}
	});
};

CSLEDIT.MultiPanel.prototype.select = function (index) {
	this.element.find('input[type="radio"]').eq(index).click();
};
