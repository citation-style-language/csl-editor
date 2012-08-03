//importPackage(java.io);

var jQuery = require('jQuery');
var $ = jQuery;

var fs = require('fs');
var vm = require('vm');
var includeInThisContext = function(path) {
    var code = fs.readFileSync(path);
    vm.runInThisContext(code, path);
}.bind(this);

(function () {
	$.each(["hello", "world"], function (i, string) {
		console.log(string);
	});
}());

//eval(fs.readFileSync("../server/test.js");

//eval(fs.readFileSync("../external/env.rhino.1.2.js");
//eval(fs.readFileSync("../external/jquery.min.js");

// citeproc includes
eval(fs.readFileSync("../external/citeproc/loadabbrevs.js").toString());
//eval(fs.readFileSync("../external/citeproc/xmle4x.js").toString());
eval(fs.readFileSync("../external/citeproc/xmldom.js").toString());
eval(fs.readFileSync("../external/citeproc/citeproc-1.0.336.js").toString());
eval(fs.readFileSync("../external/citeproc/loadlocale.js").toString());
eval(fs.readFileSync("../external/citeproc/runcites.js").toString());

"use strict";

var getFile = function (filePath) {
	console.log("getting file: " + filePath);
	var source = fs.readFileSync(filePath).toString().replace('"use strict";', '');
	//console.log(source);
	return source;
}

var CSLEDIT = {};
console.log("CSLEDIT = " + CSLEDIT);

eval(getFile("./test.js"));

eval(getFile("../src/debug.js"));
eval(getFile("../src/xmlUtility.js"));
eval(getFile("../src/exampleData.js"));
//console.log("top style 0 = " + CSLEDIT.exampleData.topStyles[0]);
eval(getFile("../src/options.js"));
eval(getFile("../src/storage.js"));
eval(getFile("../src/exampleCitations.js"));

eval(getFile("../src/citeprocLoadSys.js"));
eval(getFile("../src/citationEngine.js"));

eval(getFile("../external/json/json2.js"));

// start
eval(getFile("config.js"));

CSLEDIT.options.setUserOptions({
	rootURL : "c:/xampp/htdocs/csl-source"
});

console.log('here');

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
		//Print( entry + '\n');
		entries++;

		var fileData = CSLEDIT.xmlUtility.stripComments(fs.readFileSync(file, "utf-8"));
		console.log('calculating examples for ' + file);
		var xmlParser = new CSL_NODEJS();
		var xmlDoc;

		xmlDoc = "notSet";
		try {
			xmlDoc = xmlParser.makeXml(fileData);
		} catch (err) {
			console.log('FAILED to parse ' + file);
			console.log(err);
		}

		if (xmlDoc !== "notSet") {
			var styleId = xmlParser.getStyleId(xmlDoc);
			// TODO: find out why this is needed!
			//default xml namespace = "http://purl.org/net/xbiblio/csl";
			//with({});
			var styleTitle = xmlDoc.getElementsByTagName("title").item(0).textContent;
			cslStyles.styleTitleFromId[styleId] = styleTitle;
			/*
			if (styleTitleNode && styleTitleNode.length()) {
				styleTitle = styleTitleNode[0].toString();
				cslStyles.styleTitleFromId[styleId] = styleTitle;
			} else {
				//console.log('no title for ' + file.getName());
			}*/

			// check if this is a dependent style and find it's parent ID if so
			var linkNodes = $(xmlDoc).find('info link[rel="independent-parent"]');
			var masterId;
			masterId = styleId;
			console.log("styleId = " + styleId);

			console.log("link nodes = " + linkNodes.length);
			linkNodes.each(function () {
				masterId = $(this).attr("href");
				console.log("parent id = " + masterId);
			});
			
			// TODO: why is this preventing the JSON.stringify() working in jslibs?
			cslStyles.masterIdFromId[styleId] = masterId;
			
			if (styleId === masterId) {
				masterStyleFromId[masterId] = fileData;
				var citeprocResult;

				// just need one example citation
				CSLEDIT.exampleCitations.setCitations([{
					citationId: "CITATION-1",
					citationItems: [],
					properties: {noteIndex:0},
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
					citeprocResult.formattedBibliography = citeprocResult.formattedBibliography.
					replace(/<second-field-align>/g, "");

					citeprocResult.formattedBibliography = citeprocResult.formattedBibliography.
					replace(/<\/second-field-align>/g, " ");

					exampleCitations.exampleCitationsFromMasterId[styleId].push(citeprocResult);

					if (citeprocResult.statusMessage !== "") {
						console.log("CITEPROC ERROR: " + citeprocResult.statusMessage);
					}
				});
			}
		}
	};

// These styles cause errors with the example generation
var styleBlacklist = [
	"acm-siggraph.csl",
	"association-for-computing-machinery.csl"
];

var processDir = function (dirPath) {
	var dirContents = fs.readdirSync(dirPath),
		index;

	console.log("processing dir " + dirPath);
	console.log("files = " + dirContents.length);

	for (var index = 0; index < dirContents.length && index < 10; index++) {
		var file = dirContents[index];
		if (!fs.statSync(dirPath + '/' + file).isDirectory() && /.csl$/.test(file)) {
			//if (styleBlacklist.indexOf(String(file.getName())) === -1) {
			addCslFileToIndex(dirPath + '/' + file);
			//} else {
			//	console.log("skipping blacklisted style: " + file.getName());
			//}
		}
	}
};

console.log('here');

var startTime;
startTime = (new Date()).getTime();

processDir('../' + cslServerConfig.cslStylesPath);
processDir('../' + cslServerConfig.cslStylesPath + '/dependent');

console.log("took " + (((new Date()).getTime() - startTime) / 1000) + "s");

console.log("num entries = " + entries);

// output results to JSON file:
var outputDir = "../" + cslServerConfig.dataPath;
fs.mkdir(outputDir);

var outputToJSFile = function (jsonData, name) {
	var outputString = JSON.stringify(jsonData, null, "\t");

	// TODO: may not need to escape all non ASCII chars, this
	//       was done due to a quotation marks bugs
	outputString = outputString.replace(/[\u007f-\uffff]/g, function (c) {
		return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
	});

	// need to convert quotation marks
	// TODO: investigate why \u201c is converted to 3 characters
	outputString = outputString.replace(/\\u00e2\\u0080\\u009c/g, "\\u201c");
	outputString = outputString.replace(/\\u00e2\\u0080\\u009d/g, "\\u201d");

	var outputData;
	outputData = '"use strict";\n' +
		'var CSLEDIT = CSLEDIT || {};\n\n' +
		"CSLEDIT." + name + " = " + outputString + ';';

	fs.writeFileSync(outputDir + '/' + name + '.js', outputData);
};

outputToJSFile(exampleCitations, "preGeneratedExampleCitations");
outputToJSFile(cslStyles, "cslStyles");

