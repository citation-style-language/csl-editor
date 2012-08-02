#!python

import os
import platform
import shutil
import subprocess
import sys
import re

if (len(sys.argv) < 3):
    print "----------------------------------------"
    print "Deployment script for CSL Editor website"
    print "----------------------------------------"
    print ""
    print "Please specify root directory and root URL path (without leading forward slash)"
    print ""
    print "e.g. to install to the subdomain root"
    print "     python deploy.py \"../public_html\" \"\""
    print ""
    print "     or to install to URL path /csl"
    print "     python deploy.py \"../public_html\" \"csl\""
    quit()

# these directories must be siblings of the current source directory
demoSiteRoot = "/" + sys.argv[2];
if (demoSiteRoot == "/"):
    cslEditRoot = "/CSLEDIT";
else:
    cslEditRoot = demoSiteRoot + "/CSLEDIT";

cslEditDir = sys.argv[1] + cslEditRoot;
demoSiteDir = sys.argv[1] + demoSiteRoot;

print "cslEditDir = ", cslEditDir
print "demoSiteDir = ", demoSiteDir

pages = [
    {
        "page" : "visualEditor", 
        "jsFiles" : [
            "generated/cslStyles.js",
            "src/citeprocLoadSys.js",
            "src/exampleData.js",
            "src/storage.js",
            "src/options.js",
            "src/citationEngine.js",
            "src/exampleCitations.js",
            "src/diff.js",
            "src/debug.js",
            "src/cslParser.js",
            "src/Iterator.js",
            "src/cslNode.js",
            "src/cslData.js",
            "src/schemaOptions.js",
            "src/schema.js",
            "src/NodeWatcher.js",

            "src/citationEditor.js",
            "src/uiConfig.js",
            "src/syntaxHighlight.js",
            "src/MultiPanel.js",
            "src/notificationBar.js",
            "src/NodePathView.js",
            "src/MultiComboBox.js",
            "src/genericPropertyPanel.js",
            "src/sortPropertyPanel.js",
            "src/infoPropertyPanel.js",
            "src/conditionalPropertyPanel.js",
            "src/propertyPanel.js",
            "src/editNodeButton.js",
            "src/SmartTreeHeading.js",
            "src/smartTree.js",
            "src/Titlebar.js",
            "src/ViewController.js",
            "src/controller.js",
            "src/visualEditor.js"
        ]
    },
    {
        "page" : "codeEditor",
        "jsFiles" : [
            "src/citeprocLoadSys.js",
            "src/debug.js",
            "src/storage.js",
            "src/exampleData.js",
            "src/uiConfig.js",
            "src/options.js",
            "src/exampleCitations.js",
            "src/citationEngine.js",
            "src/uiConfig.js",
            "src/diff.js",
            "src/cslParser.js",
            "src/cslNode.js",
            "src/Iterator.js",
            "src/cslData.js",
            "src/codeEditor.js"
        ]
    },
    {
        "page" : "searchByExample",
        "jsFiles" : [
            "src/citeprocLoadSys.js",
            "src/storage.js",
            "src/xmlUtility.js",
            "src/citationEngine.js",
            "server/config.js",
            "generated/cslStyles.js",
            "generated/preGeneratedExampleCitations.js",

            "src/debug.js",
            "src/exampleData.js",
            "src/options.js",
            "src/uiConfig.js",
            "src/diff.js",
            "src/cslParser.js",
            "src/cslNode.js",
            "src/Iterator.js",
            "src/cslData.js",
            "src/searchResults.js",
            "src/searchByExample.js",
        ]
    },
    {
        "page" : "searchByName",
        "jsFiles" : [
            "src/debug.js",
            "generated/cslStyles.js",
            "generated/preGeneratedExampleCitations.js",

            "src/exampleData.js",
            "src/options.js",
            "src/storage.js",
            "src/cslParser.js",
            "src/cslNode.js",
            "src/Iterator.js",
            "src/cslData.js",
            "src/searchResults.js",
            "src/searchByName.js"
        ]
    },
    {
        "page" : "unitTests",
        "jsFiles" : [
            "src/exampleData.js",
            "src/options.js",
            "src/uiConfig.js",
            "src/storage.js",
            "src/test_storage.js",
            "src/debug.js",
            "src/schema.js",
            "src/test_schema.js",	
            "src/controller.js",
            "src/test_controller.js",
            "src/cslParser.js",
            "src/test_cslParser.js",
            "src/Iterator.js",
            "src/test_Iterator.js",
            "src/cslNode.js",
            "src/test_cslNode.js",	
            "src/cslData.js",
            "src/test_cslData.js",
            "src/xmlUtility.js",
            "src/test_xmlUtility.js",
            "src/smartTree.js",
            "src/test_smartTree.js",
            "src/editNodeButton.js",
            "src/test_editNodeButton.js",
            "src/NodeWatcher.js",
            "src/test_NodeWatcher.js"
        ]
    },
    {
        "page" : "integrationTests",
        "jsFiles" : [
            "src/testUtils.js",
            "src/exampleData.js",
            "src/options.js",
            "src/uiConfig.js",
            "src/storage.js",
            "src/debug.js",
            "src/schema.js",
            "src/controller.js",
            "src/cslParser.js",
            "src/Iterator.js",
            "src/cslNode.js",
            "src/cslData.js",
            "src/xmlUtility.js",
            "src/SmartTreeHeading.js",
            "src/smartTree.js",
            "src/editNodeButton.js",
            "src/schemaOptions.js",
            "src/MultiPanel.js",
            "src/MultiComboBox.js",
            "src/genericPropertyPanel.js",
            "src/infoPropertyPanel.js",
            "src/conditionalPropertyPanel.js",
            "src/sortPropertyPanel.js",
            "src/propertyPanel.js",
            "src/ViewController.js",
            "src/NodePathView.js",
            "src/Titlebar.js",

            "src/integrationTest_viewsForAllStyles.js",
            "src/integrationTest_propertyPanels.js"
        ]
    },
    {
        "page" : "home",
        "jsFiles" : []
    },
    {
        "page" : "about",
        "jsFiles" : []
    }
]

cslEditDirectoriesToCopy = [
    'html',
    'content',
    'external',
    'generated'
]

demoSiteFilesToCopy = [
    'index.php',
    'getFromOtherWebsite.php',
    '.htaccess',
    '404page.html',
    'logError.php',
    'sendFeedback.php',
    'feedbackEmail.txt'
]

demoSiteDirectoriesToCopy = [
    'html',
    'src',
    'external',
    'settings'
]

def ignored_files(adir, filenames):
    return [filename for filename in filenames if filename == '.git']

# clean build dir
if os.path.exists(demoSiteDir):
    shutil.rmtree(demoSiteDir)

if os.path.exists(cslEditDir):
    shutil.rmtree(cslEditDir)

os.makedirs(demoSiteDir)

os.makedirs(cslEditDir)
os.makedirs(cslEditDir + '/css')

gitCommit = subprocess.Popen(['git', 'rev-parse', 'HEAD'], stdout=subprocess.PIPE).communicate()[0].replace('\n','')
print 'building from commit ', gitCommit

# find all css files
cssFiles = []
for filename in os.listdir('css'):
    if filename.endswith('.css'):
        filebase = filename.replace('.css','')
        cssFiles.append(filebase)
        shutil.copyfile('css/' + filename, cslEditDir + '/css/' + filebase + '-' + gitCommit + '.css')

findSourceFile = re.compile("^(.*)(\.\.\/\.\.\/)(.*\.(?:js|css))(.*)$")

for page in pages:
    phpFilepath = 'demoSite/' + page['page'] + '/index.php'
    phpOutputPath = demoSiteDir + '/' + page['page']
    outputPath = cslEditDir + '/src'
    
    combinedFilename = 'CSLEDIT.' + page['page'] + '-' + gitCommit + '.js'
    
    if not os.path.exists(outputPath):
        os.makedirs(outputPath)

    if not os.path.exists(phpOutputPath):
        os.makedirs(phpOutputPath)
    
    # create concatenated file
    combinedFile = open(outputPath + '/' + combinedFilename, 'w+')
    combinedFile.write('"use strict";')

    for jsFile in page['jsFiles']:
        containsUseStrict = False

        for line in open(jsFile):
            if line.find('"use strict";') != -1:
                containsUseStrict = True
            else:
                combinedFile.write(line)

        if not containsUseStrict:
           print 'ERROR: no "use strict"; in ', jsFile
           sys.exit(1)

    inFile = open(phpFilepath)
    outFile = open(phpOutputPath + '/index.php', 'w+')
    
    # strip existing references to the javascript source files and
    # in place of the last one write the concatenated file
    foundLines = []
    for line in inFile:
        lineHandled = False
        containsUseStrict = {}

        for cssFile in cssFiles:
            line = line.replace(
                    '"../../css/' + cssFile + '.css"',
                    '"' + cslEditRoot + '/css/' + cssFile + '-' + gitCommit + '.css"')

        line = line.replace('rootURL : "../.."', 'rootURL : "' + cslEditRoot + '"')
        line = line.replace(
            'initVisualEditorDemo(\\"../..\\");',
            'initVisualEditorDemo(\\"' + cslEditRoot + '\\");')
        line = line.replace('$GIT_COMMIT', gitCommit)

        # use regexp to convert
        match = findSourceFile.search(line)
        if match != None:
            sourceFile = match.group(3)

            for jsFile in page['jsFiles']:
                if sourceFile == jsFile:
                    foundLines.append(jsFile)
                    if len(foundLines) == len(page['jsFiles']):
                        outFile.write(match.group(1) + cslEditRoot + "/src/" + combinedFilename + match.group(4))
                    lineHandled = True
            
            if not lineHandled: 
                outFile.write(match.group(1) + cslEditRoot + "/" + match.group(3) + match.group(4))
                lineHandled = True

        if not lineHandled:
            outFile.write(line)

    if set(foundLines) != set(page['jsFiles']):
        print "ERROR: didn't find all source file references in ", phpFilepath
        print "missing references = ", set(page['jsFiles']) - set(foundLines)
        sys.exit(1)

    inFile.close()
    outFile.close()

# copy other resources:
for dir in cslEditDirectoriesToCopy:
    shutil.copytree(dir, cslEditDir + '/' + dir, ignore=ignored_files)

for dir in demoSiteDirectoriesToCopy:
    shutil.copytree('demoSite/' + dir, demoSiteDir + '/' + dir, ignore=ignored_files)

for file in demoSiteFilesToCopy:
    shutil.copyfile('demoSite/' + file, demoSiteDir + '/' + file)

# create error.log file with write permissions
logFile = open(demoSiteDir + '/error.log', 'w+')
logFile.write('CSL edit error log\n')
logFile.write('------------------\n\n')
logFile.close()
if (platform.system() == 'Linux'):
    subprocess.call(['chmod', 'o+w', demoSiteDir + '/error.log'])
