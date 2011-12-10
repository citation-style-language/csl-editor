<!doctype html>
<html>
<head>
	<title>CSL IDE</title>
	<link rel="stylesheet" href="./codemirror.css">
	<script src="./external/codemirror2/lib/codemirror.js"></script>
	<script src="./external/codemirror2/mode/xml/xml.js"></script>
	<link rel="stylesheet" href="./docs.css">
	
	<script type="text/javascript" src="./external/citeproc/loadabbrevs.js"></script>
	<script type="text/javascript" src="./external/citeproc/xmldom.js"></script>
	<script type="text/javascript" src="./external/citeproc/citeproc.js"></script>
	<script type="text/javascript" src="./external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="./external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="./external/citeproc/runcites.js"></script>

	<style type="text/css">
	  .CodeMirror {
		border: 1px solid #eee;
	  }
	  .searched {background: yellow;}
	</style>
</head>
<body>
<h1>CSL IDE</h1>

<input type="file" id="files" name="files[]" />
<output id="list"></output>
<!--<button onClick="loadStyle()">Load Style</button>-->

<form name="codeForm">
	<textarea id="code" name="code">
<?php include("arp.csl"); ?>
	</textarea>
</form>

<div id="statusMessage"></div>

<h3>Formatted Citations</h3>	
<div id="formattedCitations"></div>

<h3>Formatted Bibliography</h3>
<div id="formattedBibliography"></div>


<script>
// -- global variables --
var timeout;

// -- initialisation stuff --
// Check for File API support.
if (window.File && window.FileReader && window.FileList && window.Blob)
{
	// Great success! All the File APIs are supported.
}
else
{
	alert('The File APIs are not fully supported in this browser.');
}

// un-escape \? characters which needed escaping to avoid getting parsed as PHP
do
{
	var oldValue = document.codeForm.code.value;
	document.codeForm.code.value = oldValue.replace("\\?", "?");
}while(document.codeForm.code.value != oldValue)

CodeMirror.defaults.onChange = function()
{
	clearTimeout(timeout);
	timeout = setTimeout("runCiteproc()", 500);
};

function handleFileSelect(evt)
{
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
	for (var i = 0, f; f = files[i]; i++)
	{
    	output.push('<li><strong>', f.name, '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate.toLocaleDateString(), '</li>');
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
	mode: { name: "xml", htmlMode: true},
	lineNumbers: true
});
var lastPos = null, lastQuery = null, marked = [];

function unmark()
{
	for (var i = 0; i < marked.length; ++i)
	{
		marked[i]();
	}
 	marked.length = 0;
}
	var jsonDocuments =  { "ITEM-1" : { "author" : [ { "family" : "Brown", "given" : "Emmett" } ], "container-title" : "The Journal of Applied Relativistic Physics", "editor" : [  ], "id" : "ITEM-1", "issue" : "2", "issued" : { "date-parts" : [ [ "1985" ] ] }, "page" : "88-102", "title" : "The Temporal Effects of the Flux Capacitor", "translator" : [  ], "type" : "article-journal", "volume" : "45" }, "ITEM-2" : { "DOI" : "10.1038/119558a0", "URL" : "http://www.nature.com/doifinder/10.1038/119558a0", "accessed" : { "date-parts" : [ [ "2011", "6", "7" ] ] }, "author" : [ { "family" : "Davisson", "given" : "C." }, { "family" : "Germer", "given" : "L. H." } ], "container-title" : "Nature", "editor" : [  ], "id" : "ITEM-2", "issue" : "2998", "issued" : { "date-parts" : [ [ "1927", "4", "16" ] ] }, "page" : "558-560", "title" : "The Scattering of Electrons by a Single Crystal of Nickel", "translator" : [  ], "type" : "article-journal", "volume" : "119" }, "ITEM-3" : { "DOI" : "10.1088/0143-0807/27/4/007", "URL" : "http://bavard.fourmilab.ch/etexts/einstein/specrel/specrel.pdf", "abstract" : "General description of special relativity", "author" : [ { "family" : "Einstein", "given" : "Albert" } ], "chapter-number" : "3", "container-title" : "Annalen der Physik", "editor" : [  ], "id" : "ITEM-3", "issue" : "4", "issued" : { "date-parts" : [ [ "1905" ] ] }, "page" : "1-26", "publisher" : "Dover Publications", "title" : "On the electrodynamics of moving bodies", "translator" : [  ], "type" : "article-journal", "volume" : "17" }, "ITEM-4" : { "DOI" : "10.1038/171737a0", "URL" : "http://www.ncbi.nlm.nih.gov/pubmed/13054692", "abstract" : "We wish to suggest a structure for the salt of deoxyribose nucleic acid (D.N.A.). This structure has novel features which are of considerable biological interest.", "author" : [ { "family" : "Watson", "given" : "J D" }, { "family" : "Crick", "given" : "F H" } ], "container-title" : "Nature", "editor" : [  ], "id" : "ITEM-4", "issue" : "4356", "issued" : { "date-parts" : [ [ "1953" ] ] }, "page" : "737-738", "publisher" : "Am Med Assoc", "title" : "Molecular structure of nucleic acids; a structure for deoxyribose nucleic acid.", "translator" : [  ], "type" : "article-journal", "volume" : "171" } }  ;
	
	var citationsItems = new Array();
	citationsItems[0] =  { "citationId" : "CITATION-0", "citationItems" : [ { "id" : "ITEM-1", "uris" : [ "http://www.mendeley.com/documents/?uuid=dd1a39c6-e14a-4c34-8edb-98ef1731e557" ] } ], "mendeley" : { "previouslyFormattedCitation" : "(Brown, 1985)" }, "properties" : { "noteIndex" : 0 }, "schema" : "https://github.com/citation-style-language/schema/raw/master/csl-citation.json" } ;
	citationsItems[1] =  { "citationId" : "CITATION-1", "citationItems" : [ { "id" : "ITEM-2", "uris" : [ "http://www.mendeley.com/documents/?uuid=a030fc65-aabc-4b12-a454-a917280affc1" ] }, { "id" : "ITEM-3", "uris" : [ "http://www.mendeley.com/documents/?uuid=4d771e0b-52a1-4561-9e39-260877d1db08" ] }, { "id" : "ITEM-4", "uris" : [ "http://www.mendeley.com/documents/?uuid=6bdb385b-a342-454e-a838-4dde5f697f0a" ] } ], "mendeley" : { "previouslyFormattedCitation" : "(Davisson &#38; Germer, 1927; Einstein, 1905; Watson &#38; Crick, 1953)" }, "properties" : { "noteIndex" : 0 }, "schema" : "https://github.com/citation-style-language/schema/raw/master/csl-citation.json" } ;
	var availableIds = [];
	
	var global_tags = new Object;

function runCiteproc() {
	var style = editor.getValue();
	// should validate that style is valid XML
	
	//document.getElementById("formattedCitations").innerHTML = "";
	//document.getElementById("formattedBibliography").innerHTML = "";
	
	document.getElementById("statusMessage").innerHTML = "";
	
	try
	{
		var sys = new Sys(abbreviations);
		var citeproc = new CSL.Engine(sys, style);
	}
	catch(err)
	{
		document.getElementById("statusMessage").innerHTML = "Citeproc initialisation exception: " + err;
		return;
	}
	
	var inLineCitations = "";
	
	for (var cluster=0; cluster<citationsItems.length; cluster++)
	{
		try
		{
			var citations = citeproc.appendCitationCluster(citationsItems[cluster],false);
		}
		catch(err)
		{
			document.getElementById("statusMessage").innerHTML = "Citeproc exception: " + err;
			return;
		}
		
		for (var i = 0; i < citations.length; i++)
		{
			var pos = citations[i][0];
			//MendeleyDesktop.setCitation(citations[i][0], citations[i][1], citationsItems[pos].citationId);
			
			if (inLineCitations != "")
			{
				inLineCitations += "<br>";
			}
			
			inLineCitations += citations[i][1];
		}
	}
	
	document.getElementById("formattedCitations").innerHTML = inLineCitations;
	
	var makeBibliographyArgument;
	
	var enumerateCitations = true;
	if (enumerateCitations == true)
	{
		makeBibliographyArgument = undefined;
	}
	else
	{
		makeBibliographyArgument = "citation-number";
	}
	
	try
	{
		var bibliography = citeproc.makeBibliography(makeBibliographyArgument);
	}
	catch(err)
	{
		document.getElementById("statusMessage").innerHTML = "Citeproc exception: " + err;
		return;
	}

	var hangingindent = false;
	var has_bibliography = (bibliography !== false);

	if (has_bibliography)
	{
		hangingindent = (bibliography[0].hangingindent != 0 && "undefined" !== typeof(bibliography[0].hangingindent));
		bibliography = bibliography[1];
	}
	else
	{
		bibliography = [[(citations[0][1])]];
	}

	document.getElementById("formattedBibliography").innerHTML=bibliography.join("<br>");
}

runCiteproc();
</script>


  </body>
</html>
