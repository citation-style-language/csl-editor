#Search and Edit tools for .csl (Citation Style Language) files

This web application is intended to allow users of CSL based reference managers to search for citation styles and edit them. It's still a prototype, and not user friendly enough. Yet.

Play with it here: [Citation Style Editor](http://steveridout.com/csl/)

## Deployment Instructions

### Prerequisites

1. Basic LAMP stack

2. Java runtime (doesn't have to be on server, just for pre-processing)

3. Mail server (for sending feedback emails)

4. Python 2.6.5 or 2.7

### Instructions

1. Checkout repo into directory <SERVER-ROOT>/csl-source/ where SERVER-ROOT is typically public\_html.

2. Run "git submodule update --init" to fetch submodules.

3. Run configure.sh from the checked out repository directory.

4. Run "python deploy.py"

5. Point your browser to /csl/ to access the site

6. Point your browser to /csl/test/ to run unit tests

(Testing on /csl-source/ should also work, and may be simpler for development since the .js files are not concatenated.)

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
