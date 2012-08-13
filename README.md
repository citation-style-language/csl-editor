# Search and Edit tools for .csl (Citation Style Language) files

This web application is intended to allow users of CSL based reference managers to search for citation styles and edit them. It's still an alpha version, but the Visual Editor supports all the features of independent CSL styles (AFAIK) and it should be possible to do real work with it.

Play with it here: [Citation Style Editor](http://steveridout.com/csl/)

## Deployment Instructions

### Prerequisites

- LAMP stack

- Java runtime (doesn't have to be on server, just for pre-processing)

- Node.js 0.8.4 or later

- Mail server (for sending feedback emails)

- Python 2.6.5 or 2.7

### To Setup Development Version

- Run `git clone https://github.com/citation-style-editor/csl-editor.git csl-source` to checkout repo into the directory `csl-source` within your `public\_html` (or equivalent) directory

- Run `git submodule update --init` from checked out directory to fetch submodules

- Run configure.sh

- Point your browser to `$BASE_URL/csl-source/unitTests/` to run the unit tests

- Point your browser to `$BASE_URL/csl-source/` to view the site

### To Deploy

- Follow above steps for Development version (but if you want to deploy directly to `public_html` you'll have to checkout to a `csl-source/` somewhere else, since the deploy directory will be erased by the deploy script)

- Within `csl-source/` create the file feedbackEmail.txt within containing a single email address that you want the feedback widget to send to

- Run `./deploy.sh $DEPLOY_PATH`, where `$DEPLOY_PATH` is the path you wish to deploy to. **All current contents of `$DEPLOY_PATH` will be removed!**

- Point your browser to `$BASE_URL/unitTests/` to run the unit tests

- Point your browser to `$BASE_URL/` to view the deployed site

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

