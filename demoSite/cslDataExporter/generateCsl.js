"use strict";

console.log("GENERATE");

CSLEDIT.schema = CSLEDIT.Schema();
CSLEDIT.schema.callWhenReady( function () {
	var code = $('<pre type="syntaxhighlighter" class="brush: html"><\/pre>');

	var write = function (line) {
		line = line.replace(/</g, "&lt;");
		line = line.replace(/>/g, "&gt;");

		code.append(line + "\n");
	};

	var textKeyNode = function (value) {
		return '<text prefix=" &amp;quot;" value="' + value + '&amp;quot;: " />';
	};
	var textValueNode = function (value) {
		return '<text prefix=" &amp;quot;" value="' + value + '&amp;quot;" />';
	};
	var textVariableNode = function (variable) {
		return '<text prefix="&amp;quot;" suffix="&amp;quot;" variable="' + variable + '" />';
	};
	var numberVariableNode = function (variable) {
		return '<number prefix="&amp;quot;" suffix="&amp;quot;" variable="' + variable + '" />';
	};
	var dateVariableNode = function (variable) {
		return '<date prefix="{ &amp;quot;raw&amp;quot; : &amp;quot;" suffix="&amp;quot; }" variable="' + variable + '" ' +
		   'form="text" />';
	};
	var namesNode = function (nameType) {
		return '<names variable="' + nameType + '">' +
			'<name delimiter="&amp;quot;}, {&amp;quot;family&amp;quot;: &amp;quot;" ' + 
			'prefix="[{&amp;quot;family&amp;quot;: &amp;quot;" ' +
			'suffix="&amp;quot;}]" ' +
			'name-as-sort-order="all" ' +
			'sort-separator="&amp;quot;, &amp;quot;given&amp;quot;: &amp;quot;" ><\/name>' +
			'<\/names>';
	};

	console.log("generating");

	$('body').append(code);

	write('<?xml version="1.0" encoding="utf-8"?>');
	write('<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="never">');
	write("<info><title>CSL Data Exporter<\/title><id>cslDataExporter<\/id><\/info>");
	
	write("<citation><layout /><\/citation>");
	write("<bibliography><layout>");
	write('<group delimiter="," prefix="{" suffix="}">');

	// document type
	write("<group><choose>");
	$.each(CSLEDIT.schema.choices("choose/if")[5].type.values, function (i, value) {
		var type = value.value,
			statement = "";

		if (i === 0) {
			statement = '<if type="';
		} else {
			statement = '<else-if type="';
		}

		statement += type + '">' + textKeyNode('type') + textValueNode(type) + '<\/';

		if (i === 0) {
			statement += 'if>';
		} else {
			statement += 'else-if>';
		}

		write(statement);
	});
	write("<\/choose><\/group>");

	// all variables
	$.each(CSLEDIT.schema.choices("layout/text")[3].variable.values, function (i, value) {
		if (value.value !== "year-suffix" &&
			value.value !== "citation-number") { // TODO: check about this bug with Frank
			write("<group>");
			write(textKeyNode(value.value) + textVariableNode(value.value));
			write("<\/group>");
		}
	});

	// all names
	$.each(CSLEDIT.schema.attributes("layout/names").variable.values, function (i, nameType) {
		write("<group>");
		write(textKeyNode(nameType.value) + namesNode(nameType.value));
		write("<\/group>");
	});

	// all numbers
	$.each(CSLEDIT.schema.attributes("layout/number").variable.values, function (i, variable) {
		write("<group>");
		write(textKeyNode(variable.value) + numberVariableNode(variable.value));
		write("<\/group>");
	});

	// all dates
	$.each(CSLEDIT.schema.attributes("layout/date").variable.values, function (i, variable) {
		write("<group>");
		write(textKeyNode(variable.value) + dateVariableNode(variable.value));
		write("<\/group>");
	});

	write("<\/group><\/layout><\/bibliography><\/style>");
});

