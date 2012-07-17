"use strict";

importPackage(java.io);

load("../external/env.rhino.1.2.js");
load("http://code.jquery.com/jquery-latest.min.js");

// citeproc includes
load("../external/citeproc/loadabbrevs.js");
load("../external/citeproc/xmle4x.js");
load("../external/citeproc/xmldom.js");
load("../external/citeproc/citeproc-1.0.336.js");
load("../external/citeproc/loadlocale.js");
load("../external/citeproc/runcites.js");

load("../src/debug.js");
load("../src/exampleData.js");
load("../src/options.js");
load("../src/storage.js");
load("../src/exampleCitations.js");

load("../src/citeprocLoadSys.js");
load("../src/citationEngine.js");

load("../external/json/json2.js");

// start
load("config.js");

CSLEDIT.options.setUserOptions({
	rootURL : "c:/xampp/htdocs/csl-source"
});

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

		var fileData = readFile(file.getPath());
		print('calculating examples for ' + file.getName());
		var xmlParser = new CSL_E4X();
		var xmlDoc;

		xmlDoc = "notSet";
		try {
			xmlDoc = xmlParser.makeXml(fileData);
		} catch (err) {
			print('FAILED to parse ' + file.getName());
		}

		if (xmlDoc !== "notSet") {
			var styleId = xmlParser.getStyleId(xmlDoc);
			// TODO: find out why this is needed!
			default xml namespace = "http://purl.org/net/xbiblio/csl";
			with({});
			var styleTitleNode = xmlDoc.info.title;
			var styleTitle = "";
			if (styleTitleNode && styleTitleNode.length()) {
				styleTitle = styleTitleNode[0].toString();
				cslStyles.styleTitleFromId[styleId] = styleTitle;
			} else {
				//print('no title for ' + file.getName());
			}

			// check if this is a dependent style and find it's parent ID if so
			var linkNodes = xmlDoc.info.children();
			var node;
			var masterId;
			masterId = styleId;
			for (node in linkNodes) {
				if (linkNodes[node].localName() === "link") {
					if (linkNodes[node].attribute("rel") == "independent-parent" && linkNodes[node].attribute("href") != "") {
						masterId = linkNodes[node].attribute("href").toString();
					}
				}
			}
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
				});
			}
		}
	};

var processDir = function (dirPath) {
	var dirContents = new File(dirPath).listFiles(),
		index;

	for (var index = 0; index < dirContents.length; index++) {
		var file = dirContents[index];
		if (!file.isDirectory() && /.csl$/.test(file.getName())) {
			addCslFileToIndex(file);
		}
	}
};

var startTime;
startTime = (new Date()).getTime();

processDir('../' + cslServerConfig.cslStylesPath);
processDir('../' + cslServerConfig.cslStylesPath + '/dependent');

console.log("took " + (((new Date()).getTime() - startTime) / 1000) + "s");

print("num entries = " + entries);

// output results to JSON file:
var outputDir = new File("../" + cslServerConfig.dataPath);
outputDir.mkdir();

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

	var fileWriter = new FileWriter(outputDir.getPath() + '/' + name + '.js');
	fileWriter.write('"use strict";\n');
	fileWriter.write('var CSLEDIT = CSLEDIT || {};\n\n');
	fileWriter.write("CSLEDIT." + name + " = " + outputString + ';');
	fileWriter.close();
};

outputToJSFile(exampleCitations, "preGeneratedExampleCitations");
outputToJSFile(cslStyles, "cslStyles");

