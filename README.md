#Search and Edit tools for .csl (Citation Style Language) files

This web application is intended to allow users of CSL based reference managers to search for citation styles and edit them. It's still a prototype, and not user friendly enough. Yet.

Play with it here: [Citation Style Editor](http://steveridout.com/csl/)

## Deployment Instructions

### Prerequisites

1. Basic LAMP stack

2. Java runtime (doesn't have to be on server, just for pre-processing)

### Instructions

1. Checkout repo into directory that apache will read when receiving GET http://hostname/csl/ requests (e.g. on my server it's /var/www/steveridout.com/public\_html/csl).

2. Run "git submodule update --init" to fetch submodules.

3. Run configure.sh from the checked out repository directory.

4. That's it!

# Attributions 

- [Citation Style Language](http://citationstyles.org/)
- [CSL style repository](https://github.com/citation-style-language/styles)
- [citeproc-js](http://gsl-nagoya-u.net/http/pub/citeproc-doc.html) (Citation formatting engine)
- [jsTree](http://www.jstree.com/) (tree view on visualEditor page)
- [CodeMirror](http://codemirror.net/) (text editor on codeEditor page)
- [CLEditor](http://premiumsoftware.net/cleditor/) (rich text input on searchByExample page)
- [diff\_match\_patch](http://code.google.com/p/google-diff-match-patch/) (for showing highlighted differences in formatted output)
- [Rhino](http://www.mozilla.org/rhino/) js interpreter (for pre-calculating example citations on server)
- [Trang](http://www.thaiopensource.com/relaxng/trang.html) (for converting schema files from .rnc to .rng)
- [FamFamFam Silk icons](http://www.famfamfam.com/lab/icons/silk/)
- [Fugue icons](http://p.yusukekamiyamane.com/)
