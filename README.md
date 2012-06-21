# Search and Edit tools for .csl (Citation Style Language) files

This web application is intended to allow users of CSL based reference managers to search for citation styles and edit them. It's still an alpha version, but the Visual Editor supports all the features of CSL (AFAIK) and it should be possible to do real work with it.

Play with it here: [Citation Style Editor](http://steveridout.com/csl/)

## Deployment Instructions

### Prerequisites

- Basic LAMP stack

- Java runtime (doesn't have to be on server, just for pre-processing)

- Mail server (for sending feedback emails)

- Python 2.6.5 or 2.7

### To Deploy Website

- Checkout repo into directory &lt;SERVER-ROOT&gt;/csl-source/ where SERVER-ROOT is typically public\_html

- Run "git submodule update --init" from checked out directory to fetch submodules

- Run configure.sh

(For developing with the original js source files, you can now point your browser to /csl-source/demoSite/)

- Create the file demoSite/feedbackEmail.txt containing a single email address that you want the feedback widget to send to

- Run "python deploy.py"

- Point your browser to /csl/ to access the site (uses concatenated js files and renamed css files)

- Point your browser to either /csl-source/demoSite/test or /csl/test/ to run unit tests

### To Embed Website in a web pane in your reference manager

- Create a web pane and point it to one of the following URLs:

	- My current 'stable' version (recommended)

		`http://steveridout.com/csl/visualEditor?embedded=true`

	- Your local checked out version of the code (good if you want to debug or fiddle with the CSL Editor source code)

		`http://localhost/csl-source/demoSite/visualEditor?embedded=true`

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

	// IMPORTANT: This must point to the location of the CSL Editor library.
    //            It can be a relative or absolute URL.
	//            It should be "../.." if you are using /csl-source/demoSite/visualEditor
	//            Or "/CSLEDIT" if you are using /csl/visualEditor
	rootURL : "/CSLEDIT",
	onChange : function () {
		// this is called after every style edit.

		// access the current style contents using:
		// var code = cslEditor.getCslCode();
	},
	// override the default initial style of APA with this:
	//initialCslCode : "<style>this style is not valid!</style>",
	exampleReferences : [
		{type:"article", title:"Article Title", author:"An Author", date:"2010"},
		{type:"book", title:"Book Title", author:"Another Author", date:"2000"}
	], // each list item follows the csl-data.json schema, but doesn't require the 'id' propery
	//    (https://github.com/citation-style-language/schema/blob/master/csl-data.json)
	exampleCitations : [[0,1], [1]] // the references which appear in each citation	
});
```

# Attributions 

- [Citation Style Language](http://citationstyles.org/)
- [CSL style repository](https://github.com/citation-style-language/styles)
- [citeproc-js](http://gsl-nagoya-u.net/http/pub/citeproc-doc.html) (Citation formatting engine)
- [CodeMirror](http://codemirror.net/) (text editor on codeEditor page)
- [diff\_match\_patch](http://code.google.com/p/google-diff-match-patch/) (for showing highlighted differences in formatted output)
- [Rhino](http://www.mozilla.org/rhino/) js interpreter (for pre-calculating example citations on server)
- [Trang](http://www.thaiopensource.com/relaxng/trang.html) (for converting schema files from .rnc to .rng)
- [FamFamFam Silk icons](http://www.famfamfam.com/lab/icons/silk/)
- [Fugue icons](http://p.yusukekamiyamane.com/)
- [jQuery](http://jquery.com/)
- [jQuery jsTree Plugin](http://www.jstree.com/) (tree view on visualEditor page)
- [jQuery CLEditor Plugin](http://premiumsoftware.net/cleditor/) (rich text input on searchByExample page)
- [jQuery UI Layout Plugin](http://layout.jquery-dev.net)
- [jQuery hoverIntent Plugin](http://cherne.net/brian/resources/jquery.hoverIntent.html)
- [jQuery scrollTo Plugin](http://demos.flesler.com/jquery/scrollTo/)

