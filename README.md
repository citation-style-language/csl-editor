# CSL Editor library

A HTML 5 library for searching and editing styles written in the [Citation Style Language](http://citationstyles.org/).

Play with the reference implementation here: [Citation Style Editor](http://steveridout.com/csl/).

# To use

See the source code for the reference implementation here: [Demo Site Repo](https://github.com/citation-style-editor/csl-editor-demo-site).

Further documentation forthcoming.

<!--
### To Embed Website in a web pane in your reference manager

** These instructions are out of date, please wait for new ones! **

- Create a web pane and point it to one of the following URLs:

	- My current 'stable' version (recommended)

		`http://steveridout.com/csl/visualEditor?embedded=true`

	- Your local checked out version of the code (good if you want to debug or fiddle with the CSL Editor source code)

		`http://localhost/csl-source/visualEditor?embedded=true`

	- Your local 'deployed' version of the site:

		`http://localhost/csl/visualEditor?embedded=true`

- Within the webpage, execute this code:


```javascript
var cslEditor = new CSLEDIT.VisualEditor("#visualEditorContainer", {
	// The name of the load style menu item
	loadCSLName : "Load Style from Ref Manager",

	// Your function to load a CSL file into the editor
	loadCSLFunc : function () {
		alert("Loading a blank CSL style");
		cslEditor.setCslCode("<style><info /><citation><layout /></citation><bibliography><layout /></bibliography></style>");
	},

	// The name of the save/export style menu item
	saveCSLName : "Save Style to Ref Manager",

	// Your function to save/export a style out of the editor
	saveCSLFunc : function (cslCode) {
		alert("Save function not implemented");
	},

	onChange : function () {
		// this is called after every style edit.

		// access the current style contents using:
		// var code = cslEditor.getCslCode();
	},
	// override the default initial style of APA with this:
	//initialCslCode : "<style>this style is not valid!</style>",

	// each example reference follows the csl-data.json schema, but doesn't require the 'id' propery
	// (see https://github.com/citation-style-language/schema/blob/master/csl-data.json)
	exampleReferences : [
		{type:"article", title:"Article Title", author:"An Author", date:"2010"},
		{type:"book", title:"Book Title", author:"Another Author", date:"2000"}
	],

	// a list of the references to appear in each citation
	exampleCitations : [[0,1], [1]],
	onLoaded : function () {
		// do stuff after the UI has finished initializing
	}
});
```
-->

# Attributions 

- [Citation Style Language](http://citationstyles.org/)
- [CSL style repository](https://github.com/citation-style-language/styles)
- [citeproc-js](http://gsl-nagoya-u.net/http/pub/citeproc-doc.html) (Citation formatting engine)
- [CodeMirror](http://codemirror.net/) (text editor on codeEditor page)
- [diff\_match\_patch](http://code.google.com/p/google-diff-match-patch/) (for showing highlighted differences in formatted output)
- [Trang](http://www.thaiopensource.com/relaxng/trang.html) (for converting schema files from .rnc to .rng)
- [FamFamFam Silk icons](http://www.famfamfam.com/lab/icons/silk/)
- [Fugue icons](http://p.yusukekamiyamane.com/)
- [jQuery](http://jquery.com/)
- [jQuery jsTree Plugin](http://www.jstree.com/) (tree view on visualEditor page)
- [jQuery CLEditor Plugin](http://premiumsoftware.net/cleditor/) (rich text input on searchByExample page)
- [jQuery UI Layout Plugin](http://layout.jquery-dev.net)
- [jQuery hoverIntent Plugin](http://cherne.net/brian/resources/jquery.hoverIntent.html)
- [jQuery scrollTo Plugin](http://demos.flesler.com/jquery/scrollTo/)
- [require.js](http://requirejs.org/)
- [node.js](http://node.js.org) (for running scripts on the server)

