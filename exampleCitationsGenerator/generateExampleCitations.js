// NOTE: can't "use strict" because the different source files rely on
//       variables in global scope
//
// TODO: refactor code to use require() insead of eval() like citeproc-node does
//       or just use citeproc-node, the disadvantage then is that
//       it's not as easy to update citeproc to the latest version

var jQuery = require('jQuery');
var $ = jQuery;
var fs = require('fs');

// decrease this for testing
var STYLES_LIMIT = 500000;

// citeproc includes
eval(fs.readFileSync("../external/citeproc/loadabbrevs.js").toString());
eval(fs.readFileSync("../external/citeproc/xmldom.js").toString());
eval(fs.readFileSync("../external/citeproc/citeproc-1.0.336.js").toString());
eval(fs.readFileSync("../external/citeproc/loadlocale.js").toString());
eval(fs.readFileSync("../external/citeproc/runcites.js").toString());

var getFile = function (filePath) {
	var source = fs.readFileSync(filePath).toString().replace('"use strict";', '');
	return source;
};

eval(getFile("../src/debug.js"));
eval(getFile("../src/xmlUtility.js"));
eval(getFile("../src/exampleData.js"));
eval(getFile("../src/options.js"));
eval(getFile("../src/storage.js"));
eval(getFile("../src/exampleCitations.js"));

eval(getFile("../src/citeprocLoadSys.js"));
eval(getFile("../src/citationEngine.js"));

eval(getFile("../external/json/json2.js"));

// start
eval(getFile("config.js"));

// alter this defined in ../src/citeprocLoadSys.js to read locales from disk
Sys.prototype.retrieveLocale = function (lang) {
	var thisLocale = locale[lang];

	if (typeof(thisLocale) === "undefined") {
		// try to fetch from disk
		try {
			thisLocale = fs.readFileSync("../external/locales/locales-" + lang + ".xml").toString();
		} catch (err) {
			console.log("couldn't fetch locale: " + lang);
		}
	}
	return thisLocale;
}

// loop through the parent (unique) csl-styles generating example citations for
// each one
var masterStyleFromId = {};

var exampleCitations = {
	exampleCitationsFromMasterId: {},
};

var cslStyles = {
	masterIdFromId: {},
	styleTitleFromId: {}
};

var entries = 0;

var addCslFileToIndex = function (file) {
	var fileData, xmlParser, xmlDoc, styleId, styleTitle, linkNodes, masterId,
		citeprocResult;

	entries++;

	fileData = CSLEDIT.xmlUtility.stripComments(fs.readFileSync(file, "utf-8"));
	console.log('calculating examples for ' + file);
	xmlParser = new CSL_NODEJS();

	xmlDoc = "notSet";
	try {
		xmlDoc = xmlParser.makeXml(fileData);
	} catch (err) {
		console.log('FAILED to parse ' + file);
		console.log(err);
	}

	if (xmlDoc !== "notSet") {
		styleId = xmlParser.getStyleId(xmlDoc);
		styleTitle = xmlDoc.getElementsByTagName("title").item(0).textContent;
		cslStyles.styleTitleFromId[styleId] = styleTitle;

		// check if this is a dependent style and find it's parent ID if so
		linkNodes = $(xmlDoc).find('info link[rel="independent-parent"]');
		masterId = styleId;

		linkNodes.each(function () {
			masterId = $(this).attr("href");
		});
		
		// TODO: why is this preventing the JSON.stringify() working in jslibs?
		cslStyles.masterIdFromId[styleId] = masterId;
		
		if (styleId === masterId) {
			masterStyleFromId[masterId] = fileData;

			// just need one example citation
			CSLEDIT.exampleCitations.setCitations([{
				citationId: "CITATION-1",
				citationItems: [],
				properties: {noteIndex: 0},
				schema: "https://github.com/citation-style-language/schema/raw/master/csl-citation.json"			
			}]);

			exampleCitations.exampleCitationsFromMasterId[styleId] = [];

			$.each(CSLEDIT.exampleCitations.getReferences(), function (i, exampleReference) {
				CSLEDIT.exampleCitations.setReferenceIndexesForCitation(0, [i]);
				
				citeprocResult = CSLEDIT.citationEngine.formatCitations(
					fileData,
					CSLEDIT.exampleCitations.getCiteprocReferences(),
					CSLEDIT.exampleCitations.getCitations());

				// merge bibliography to one string
				citeprocResult.formattedBibliography =
					citeprocResult.formattedBibliography.join("<br \/>"); 

				// clean up citeproc result for display
				citeprocResult.formattedBibliography =
					citeprocResult.formattedBibliography.replace(/<second-field-align>/g, "");

				citeprocResult.formattedBibliography =
					citeprocResult.formattedBibliography.replace(/<\/second-field-align>/g, " ");

				exampleCitations.exampleCitationsFromMasterId[styleId].push(citeprocResult);

				if (citeprocResult.statusMessage !== "") {
					console.log("CITEPROC ERROR: " + citeprocResult.statusMessage);
				}
			});
		}
	}
};

var processDir = function (dirPath) {
	var dirContents = fs.readdirSync(dirPath),
		index,
		file;

	console.log("processing dir " + dirPath);
	console.log("files = " + dirContents.length);

	for (index = 0; index < dirContents.length && index < STYLES_LIMIT; index++) {
		file = dirContents[index];
		if (!fs.statSync(dirPath + '/' + file).isDirectory() && /.csl$/.test(file)) {
			addCslFileToIndex(dirPath + '/' + file);
		}
	}
};

var startTime;
startTime = (new Date()).getTime();

processDir('../' + cslServerConfig.cslStylesPath);
processDir('../' + cslServerConfig.cslStylesPath + '/dependent');

console.log("took " + (((new Date()).getTime() - startTime) / 1000) + "s");
console.log("num entries = " + entries);

// output results to CSLEDIT.* objects within a javascript file:
var outputDir;
outputDir = "../" + cslServerConfig.dataPath;
fs.mkdir(outputDir);

var outputToJSFile = function (jsonData, name) {
	var outputString = JSON.stringify(jsonData, null, "\t");

	// TODO: may not need to escape all non ASCII chars, this
	//       was done due to a quotation marks bugs
	//outputString = outputString.replace(/[\u007f-\uffff]/g, function (c) {
	//	return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
	//});

	// need to convert quotation marks
	// TODO: investigate why \u201c is converted to 3 characters
	//outputString = outputString.replace(/\\u00e2\\u0080\\u009c/g, "\\u201c");
	//outputString = outputString.replace(/\\u00e2\\u0080\\u009d/g, "\\u201d");

	var outputData;
	outputData = 
		'"use strict";\n' +
		'var CSLEDIT = CSLEDIT || {};\n\n' +
		"CSLEDIT." + name + " = " + outputString + ';';

	fs.writeFileSync(outputDir + '/' + name + '.js', outputData);
};

outputToJSFile(exampleCitations, "preGeneratedExampleCitations");
outputToJSFile(cslStyles, "cslStyles");

