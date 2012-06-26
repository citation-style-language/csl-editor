"use strict";
var CSLEDIT = CSLEDIT || {};

CSLEDIT.conditionalPropertyPanel = function (element, node) {
	var that = this;

	this.element = element;
	this.node = new CSLEDIT.CslNode(node);
	this.node.children = []; // not interested in the children

	// any / none / all selector
	this.matchSelect = $('<select></select>');
	$.each(CSLEDIT.schema.attributes('choose/if').match.values, function (i, value) {
		that.matchSelect.append('<option>' + value.value + '</option>');
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
	this.mainOptionSelect = $('<select></select>');
	$.each(this.mainOptions, function (mainOption, properties) {
		that.mainOptionSelect.append('<option>' + mainOption + '</option>');
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

CSLEDIT.conditionalPropertyPanel.prototype.removeDuplicateOptions = function () {
	var that = this,
		selectedValues = this.attributeValue().split(" "),
		processedValues = [],
		availableValues;

	// remove currently selcted values from availableValues
	availableValues = this.possibleValues(this.currentAttribute);
	$.each(selectedValues, function (i, value) {
		var index = availableValues.indexOf(value);
		if (index !== -1) {
			availableValues.splice(index, 1);
		}
	});

	// remove duplicate values
	$.each(this.valueControls, function (i, valueControl) {
		var $this = $(this),
			value = $this.val();

		// check if it's a duplicate
		if (processedValues.indexOf(value) !== -1) {
			if (availableValues.length === 0) {
				// no more available values, set processedValues and setup again
				that.node.setAttr(that.currentAttribute, processedValues.join(" "));
				CSLEDIT.controller.exec('amendNode', [that.node.cslId, that.node]);
				that.setup();
				return;
			} else {
				// give it a new value
				value = availableValues.pop();
				$this.val(value);
				selectedValues.push(value);
			}
		}
		processedValues.push(value);
	});

	// remove currently selected values from other controls options
	$.each(this.valueControls, function (i, valueControl) {
		var $this = $(this);

		// remove all except current val
		$this.find('option[value!="' + $this.val() + '"]').remove();

		// add back the other available options
		$.each(availableValues, function (i, option) {
			$this.append('<option>' + option + '</option>');
		});
	});
};

CSLEDIT.conditionalPropertyPanel.prototype.attributeUi = {
	"disambiguate" : {
		mainOption: "Citations are disambiguated"
	},
	"variable" : {
		mainOption: "The variable",
		subOption: "is present"
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
	}
};

CSLEDIT.conditionalPropertyPanel.prototype.possibleValues = function (attribute) {
	// get possible values from schema
	var possibleValues = [];
	$.each(CSLEDIT.schema.choices("choose/if"), function (i, attributes) {
		if (attributes.hasOwnProperty(attribute)) {
			$.each(attributes[attribute].values, function (i2, possibleValue) {
				if (possibleValue.type === "value") {
					possibleValues.push(possibleValue.value);
				}
			});
			return false;
		}
	});
	return possibleValues;
};

CSLEDIT.conditionalPropertyPanel.prototype.availableValues = function () {
	var availableValues = this.possibleValues(this.currentAttribute),
		selectedValues = this.attributeValue();

	// remove currently selcted values from availableValues
	$.each(this.attributeValue().split(" "), function (i, value) {
		var index = availableValues.indexOf(value);
		if (index !== -1) {
			availableValues.splice(index, 1);
		}
	});
	return availableValues;
};
CSLEDIT.conditionalPropertyPanel.prototype.setup = function () {
	var that = this,
		mainOption;

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

	// set matchSelect value
	this.matchSelect.val(this.node.getAttr('match') || 
			CSLEDIT.schema.attributes("choose/if").match.defaultValue);

	if (typeof mainOption === "undefined") {
		// should show at least one attribute value, so create one
		// NOTE: this is slightly strange behaviour for a view
		//       but should never happen - only after loading an
		//       invalid style

		this.node.setAttr("type", "article");
		this.node.setAttr("match", "any");
		CSLEDIT.controller.exec('amendNode', [this.node.cslId, this.node]);
		this.setup();
		return;
	}

	// create subOptionControl
	if (this.mainOptions[mainOption].length > 1) {
		this.subOptionControl = $('<select></select>');
		$.each(this.mainOptions[mainOption], function (i, properties) {
			that.subOptionControl.append($('<option>' + properties.subOption + '</option>'));
			if (that.node.hasAttr(properties.attribute)) {
				that.subOptionControl.val(properties.subOption);
				that.currentAttribute = properties.attribute;
			}
		});
	} else {
		this.subOptionControl = $('<span></span>');
		$.each(this.mainOptions[mainOption], function (i, properties) {
			that.subOptionControl.append(properties.subOption);
			that.currentAttribute = properties.attribute;
		});
	}

	// create valueControls
	this.valueControls = [];
	$.each(this.node.getAttr(this.currentAttribute).split(" "), function (i, value) {
		var valueControl = $('<select class="valueSelect"></select>');
		$.each(that.possibleValues(that.currentAttribute), function (i, possibleValue) {
			valueControl.append('<option>' + possibleValue + '</option>');
		});
		valueControl.val(value);
		that.valueControls.push(valueControl);
	});

	this.drawControls();

	this.removeDuplicateOptions();

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
		that.removeDuplicateOptions();
		that.node.setAttr(that.currentAttribute, that.attributeValue());
		CSLEDIT.controller.exec('amendNode', [that.node.cslId, that.node]);
	});

	this.element.find('button.addValue').on('click', function () {
		if (that.availableValues().length === 0) {
			alert("No more available values");
			return;
		}
		that.node.setAttr(that.currentAttribute, that.attributeValue() + " " +
			that.availableValues()[0]);
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
		table = $('<table class="conditional"><col class="c1" /><col class="c2" />' + 
				'<col class="c3" /><col class="c4" /><col class="c5" /></table>'),
		valueSeparator,
		matchValue = this.node.getAttr('match') ||
			CSLEDIT.schema.attributes("choose/if").match.defaultValue;
	
	this.element.children().remove();

	this.element.append($('<p></p>').
			append(this.node.name + ' ').
			append(this.matchSelect).
			append(' of the following conditions are met'));

	if (matchValue === "all") {
		valueSeparator = '<span class="weak">and</span>';
	} else {
		valueSeparator = '<span class="weak">or</span>';
	}

	$.each(this.valueControls, function (i, valueControl) {
		var row = $('<tr></tr>');

		if (i === 0) {
			row.append($('<td class="mainOption"></td>').append(that.mainOptionSelect));
		} else {
			row.append('<td></td>');
		}

		if (that.node.getAttr('disambiguate') === "true") {
			row.append($('<td></td>'));
		} else {
			row.append($('<td></td>').append(valueControl));

			if (i === that.valueControls.length - 1) {
				row.append($('<td></td>').append(that.subOptionControl));
			} else {
				row.append($('<td>' + valueSeparator + '</td>'));
			}		
			row.append('<td class="delete"><button class="deleteValue">-</button></td>');
			if (that.valueControls.length === 1) {
				row.find('button.deleteValue').css({visibility:"hidden"});
			}

			if (i === that.valueControls.length - 1) {
				row.append('<td class="add"><button class="addValue">+</button></td>');
			} else {
				row.append('<td class="add"></td>');
			}
		}
		table.append(row);
	});
	
	this.element.append(table);
};
