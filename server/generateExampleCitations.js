"use strict";

importPackage(java.io);

// citeproc includes
load("../external/citeproc/loadabbrevs.js");
load("../external/citeproc/xmle4x.js");
load("../external/citeproc/xmldom.js");
load("../external/citeproc/citeproc.js");
load("../external/citeproc/loadlocale.js");
load("../external/citeproc/loadsys.js");
load("../external/citeproc/runcites.js");
load("../src/citationEngine.js");

load("../external/json/json2.js");

// start
load("config.js");

// loop through the parent (unique) csl-styles generating example citations for
// each one
var masterStyleFromId = {};

var outputData = {
	masterIdFromId: {},

	// list of dependent styles for each master style ID
	//dependentStylesFromMasterId : {},
	exampleCitationsFromMasterId: {},
	styleTitleFromId: {}
};

var entries = 0;

var addCslFileToIndex = function (file) {
		//Print( entry + '\n');
		entries++;

		var fileData = readFile(file.getPath());
		print( 'parsing ' + file.getName() );
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
				outputData.styleTitleFromId[styleId] = styleTitle;
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
			outputData.masterIdFromId[styleId] = masterId;
			
			if (styleId === masterId) {
				masterStyleFromId[masterId] = fileData;

				var citeprocResult = CSLEDIT.citationEngine.formatCitations(
					fileData, cslServerConfig.jsonDocuments, cslServerConfig.citationsItems);

				// merge bibliography to one string
				citeprocResult.formattedBibliography =
					citeprocResult.formattedBibliography.join("<br \/>"); 

				// clean up citeproc result for display
				citeprocResult.formattedBibliography = citeprocResult.formattedBibliography.
				replace(/<second-field-align>/g, "");

				citeprocResult.formattedBibliography = citeprocResult.formattedBibliography.
				replace(/<\/second-field-align>/g, " ");

				outputData.exampleCitationsFromMasterId[styleId] = citeprocResult;
				
				//if (styleTitle.toLowerCase().indexOf("mechanical") > -1) {
				//	print("mechanical: " + citeprocResult.formattedBibliography);
				//}

				//print(".");
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

processDir('../' + cslServerConfig.cslStylesPath);
processDir('../' + cslServerConfig.cslStylesPath + '/dependent');

print("num entries = " + entries);

// output results to JSON file:
var outputDir = new File("../" + cslServerConfig.dataPath);
outputDir.mkdir();

var fileWriter = new FileWriter(outputDir.getPath() + '/exampleCitationsEnc.js');

var outputString = JSON.stringify(outputData, null, "\t");

// TODO: may not need to escape all non ASCII chars, this
// was done due to a quotation marks bugs
outputString = outputString.replace(/[\u007f-\uffff]/g, function (c) {
	return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
});

// need to convert quotation marks
// TODO: investigate why \u201c is converted to 3 characters
outputString = outputString.replace(/\\u00e2\\u0080\\u009c/g, "\\u201c");
outputString = outputString.replace(/\\u00e2\\u0080\\u009d/g, "\\u201d");

fileWriter.write('"use strict";\n');
fileWriter.write("var exampleCitations = " + outputString + ';');
fileWriter.close();
