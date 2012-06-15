"use strict";
var CSLEDIT = CSLEDIT || {};

CSLEDIT.conditionalPropertyPanel = function (element, node) {
	var that = this;

	this.element = element;
	this.node = new CSLEDIT.CslNode(node);
	this.node.children = []; // not interested in the children

	// any / none / all selector
	this.matchSelect = $('<select><\/select>');
	$.each(CSLEDIT.schema.attributes('choose/if').match.values, function (i, value) {
		that.matchSelect.append('<option>' + value.value + '<\/option>');
	});

	// generate mainOptions from the schema
	this.mainOptions = {};
	$.each(this.attributeUi, function (attribute, ui) {
		var mainOptionProperties = that.mainOptions[ui.mainOption] || [];
		
		mainOptionProperties.push({
			attribute: attribute,
			subOption: ui.subOption
		});
		that.mainOptions[ui.mainOption] = mainOptionProperties;
	});

	// mainOption selector (document type / variable / date / locator / ...)
	this.mainOptionSelect = $('<select><\/select>');
	$.each(this.mainOptions, function (mainOption, properties) {
		that.mainOptionSelect.append('<option>' + mainOption + '<\/option>');
	});

	this.setup();
};

CSLEDIT.conditionalPropertyPanel.prototype.attributeValue = function () {
	var values = [];
	$.each(this.valueControls, function (i, valueControl) {
		values.push(valueControl.val());
	});
	return values.join(" ");
};

CSLEDIT.conditionalPropertyPanel.prototype.attributeUi = {
	"disambiguate" : {
		mainOption: "Citations are disambiguated"
	},
	"is-numeric" : {
		mainOption: "The variable",
		subOption: "is a number"
	},
	"is-uncertain-date" : {
		mainOption: "The date",
		subOption: "is uncertain"
	},
	"locator" : {
		mainOption: "The locator subtype",
		subOption: "is present"
	},
	"position" : {
		mainOption: "The position is"
	},
	"type" : {
		mainOption: "The document type is"
	},
	"variable" : {
		mainOption: "The variable",
		subOption: "is present"
	}
};

CSLEDIT.conditionalPropertyPanel.prototype.possibleValues = function (attribute) {
	// get possible values from schema
	var possibleValues = [];
	$.each(CSLEDIT.schema.choices("choose/if"), function (i, attributes) {
		if (attributes.hasOwnProperty(attribute)) {
			$.each(attributes[attribute].values, function (i2, possibleValue) {
				assertEqual(possibleValue.type, "value");
				possibleValues.push(possibleValue.value);
			});
			return false;
		}
	});
	return possibleValues;
};

CSLEDIT.conditionalPropertyPanel.prototype.setup = function () {
	var that = this,
		mainOption;

	// set matchSelect value
	this.matchSelect.val(this.node.getAttr('match') || "any"); /* TODO: get schema defualt */;

	// set mainOptionSelect value
	$.each(this.node.attributes, function (i, attribute) {
		if (attribute.enabled) {
			var attributeProperty = that.attributeUi[attribute.key];
			if (typeof attributeProperty !== "undefined") {
				console.log("attr = " + attribute.key);
				mainOption = attributeProperty.mainOption;
				that.mainOptionSelect.val(mainOption);
			}
		}
	});

	console.log('mainOption = ' + mainOption);

	if (typeof mainOption === "undefined") {
		// should show at least one attribute value, so create one
		// NOTE: this is slightly strange behaviour for a view
		//       but should usually only happen after Add Node

		this.node.setAttr("type", "article");
		CSLEDIT.controller.exec('amendNode', [this.node.cslId, this.node]);
		this.setup();
		return;
	}

	// create subOptionControl
	if (this.mainOptions[mainOption].length > 1) {
		this.subOptionControl = $('<select><\/select>');
		$.each(this.mainOptions[mainOption], function (i, properties) {
			that.subOptionControl.append($('<option>' + properties.subOption + '<\/option>'));
			if (that.node.hasAttr(properties.attribute)) {
				that.subOptionControl.val(properties.subOption);
				that.currentAttribute = properties.attribute;
			}
		});
	} else {
		this.subOptionControl = $('<span><\/span>');
		$.each(this.mainOptions[mainOption], function (i, properties) {
			that.subOptionControl.append(properties.subOption);
			that.currentAttribute = properties.attribute;
		});
	}

	// create valueControls
	this.valueControls = [];
	$.each(this.node.getAttr(this.currentAttribute).split(" "), function (i, value) {
		var valueControl = $('<select class="valueSelect"><\/select>');
		$.each(that.possibleValues(that.currentAttribute), function (i, possibleValue) {
			valueControl.append('<option>' + possibleValue + '<\/option>');
		});
		valueControl.val(value);
		that.valueControls.push(valueControl);
	});

	this.drawControls();

	// event handlers
	this.mainOptionSelect.on('change', function () {
		console.log("change");
		that.currentAttribute = null;
		$.each(that.attributeUi, function (attribute, ui) {
			if (that.currentAttribute === null && ui.mainOption === that.mainOptionSelect.val()) {
				that.node.setAttrEnabled(attribute, true, that.possibleValues(attribute)[0]);
				that.currentAttribute = attribute;
			} else {
				that.node.setAttrEnabled(attribute, false);
			}
		});
		console.log('currentAttr = ' + that.currentAttribute);
		CSLEDIT.controller.exec('amendNode', [that.node.cslId, that.node]);
		that.setup();
	});

	if (this.subOptionControl.is('select')) {
		this.subOptionControl.on('change', function () {
			// when changing a sub-option, keep the space-separated value list the same
			var currentAttributeValue = that.attributeValue();
			$.each(that.attributeUi, function (attribute, ui) {
				if (ui.mainOption === that.mainOptionSelect.val() &&
						ui.subOption === that.subOptionControl.val()) {
					that.node.setAttr(attribute, currentAttributeValue);
					that.currentAttribute = attribute;
				} else {
					that.node.setAttrEnabled(attribute, false);
				}
			});
			CSLEDIT.controller.exec('amendNode', [that.node.cslId, that.node]);
		});
	}

	this.element.find('select.valueSelect').on('change', function () {
		console.log('setting ' + that.currentAttribute + ' to ' + that.attributeValue());
		that.node.setAttr(that.currentAttribute, that.attributeValue());
		CSLEDIT.controller.exec('amendNode', [that.node.cslId, that.node]);
	});

	this.element.find('button.addValue').on('click', function () {
		that.node.setAttr(that.currentAttribute, that.attributeValue() + " " +
			that.possibleValues(that.currentAttribute)[0]);
		CSLEDIT.controller.exec('amendNode', [that.node.cslId, that.node]);
		that.setup();
	});

	this.element.find('button.deleteValue').on('click', function (event) {
		var index = that.element.find('button.deleteValue').index(event.target),
			valueList = that.node.getAttr(that.currentAttribute).split(" ");

		console.log("index = " + index);
		console.log("value list = " + valueList.join(", "));

		valueList.splice(index, 1);
		console.log("value list after = " + valueList.join(", "));

		that.node.setAttr(that.currentAttribute, valueList.join(" "));
		CSLEDIT.controller.exec('amendNode', [that.node.cslId, that.node]);
		that.setup();
	});
	
	this.matchSelect.on('change', function () {
		that.node.setAttr('match', that.matchSelect.val());
		CSLEDIT.controller.exec('amendNode', [that.node.cslId, that.node]);
		that.setup();
	});
};

CSLEDIT.conditionalPropertyPanel.prototype.drawControls = function () {
	var that = this,
		table = $('<table class="conditional"><col class="c1" \/><col class="c2" \/>' + 
				'<col class="c3" \/><col class="c4" \/><col class="c5" \/><\/table>'),
		valueSeparator;
	
	this.element.children().remove();

	this.element.append($('<p><\/p>').
			append(this.node.name + ' ').
			append(this.matchSelect).
			append(' of the following conditions are met'));

	if (this.node.getAttr('match') === "all") {
		valueSeparator = " and ";
	} else {
		valueSeparator = " or ";
	}

	$.each(this.valueControls, function (i, valueControl) {
		var row = $('<tr><\/tr>');

		if (i === 0) {
			row.append($('<td><\/td>').append(that.mainOptionSelect));
		} else {
			row.append('<td><\/td>');
		}

		if (that.node.getAttr('disambiguate') !== "true") {
			row.append($('<td><\/td>').append(valueControl));

			if (i === that.valueControls.length - 1) {
				row.append($('<td><\/td>').append(that.subOptionControl));
			} else {
				row.append($('<td>' + valueSeparator + '<\/td>'));
			}		
			if (that.valueControls.length === 1) {
				row.append('<td><\/td>');
			} else {
				row.append('<td><button class="deleteValue">Delete<\/button><\/td>');
			}

			if (i === that.valueControls.length - 1) {
				row.append('<td><button class="addValue">Add<\/button><\/td>');
			} else {
				row.append('<td><\/td>');
			}
		}
		table.append(row);
	});
	
	this.element.append(table);
};
