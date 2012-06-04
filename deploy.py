#!python

import os
import shutil
import subprocess
import sys

buildDir = "../csl";

pages = [
    {
        "page" : "visualEditor", 
        "jsFiles" : [
            "src/citationEngine.js",
            "src/exampleData.js",
            "src/diff.js",
            "src/debug.js",
            "src/cslParser.js",
            "src/Iterator.js",
            "src/cslNode.js",
            "src/cslData.js",
            "src/schema.js",

            "src/notificationBar.js",
            "src/editReferences.js",
            "src/NodePathView.js",
            "src/MultiComboBox.js",
            "src/propertyPanel.js",
            "src/sortPropertyPanel.js",
            "src/infoPropertyPanel.js",
            "src/editNodeButton.js",
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
            "src/debug.js",
            "src/citationEngine.js",
            "src/exampleData.js",
            "src/diff.js",
            "src/cslParser.js",
            "src/cslData.js",
            "src/codeEditor.js"
        ]
    },
    {
        "page" : "searchByExample",
        "jsFiles" : [
            "src/xmlUtility.js",
            "src/citationEngine.js",
            "server/config.js",
            "generated/exampleCitationsEnc.js",

            "src/debug.js",
            "src/diff.js",
            "src/cslParser.js",
            "src/cslData.js",
            "src/searchResults.js",
            "src/searchByExample.js",
            "src/analytics.js"
        ]
    },
    {
        "page" : "searchByName",
        "jsFiles" : [
            "src/debug.js",
            "generated/exampleCitationsEnc.js",
            "src/cslParser.js",
            "src/cslData.js",
            "src/searchResults.js",
            "src/searchByName.js"
        ]
    },
    {
        "page" : "test",
        "jsFiles" : [
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
            "src/test_editNodeButton.js"
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

directoriesToCopy = [
    'html',
    'src',
    'content',
    'server',
    'external',
    'generated'
]

filesToCopy = [
    'index.php',
    'getFromOtherWebsite.php',
    '.htaccess',
    '404page.html'
]

def ignored_files(adir, filenames):
    return [filename for filename in filenames if filename == '.git']

# clean build dir
if os.path.exists(buildDir):
    shutil.rmtree(buildDir)

os.makedirs(buildDir)
os.makedirs(buildDir + '/css')

gitCommit = subprocess.Popen(['git', 'rev-parse', 'HEAD'], stdout=subprocess.PIPE).communicate()[0].replace('\n','')
print 'building from commit ', gitCommit

# find all css files
cssFiles = []
for filename in os.listdir('css'):
    if filename.endswith('.css'):
        filebase = filename.replace('.css','')
        cssFiles.append(filebase)
        shutil.copyfile('css/' + filename, buildDir + '/css/' + filebase + '-' + gitCommit + '.css')

for page in pages:
    phpFilepath = page['page'] + '/index.php'
    outputPath = buildDir + '/' + page['page']
    
    combinedFilename = 'CSLEDIT.' + page['page'] + '-' + gitCommit + '.js'
    
    if not os.path.exists(outputPath):
        os.makedirs(outputPath)
    
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
    outFile = open(outputPath + '/index.php', 'w+')
    
    # strip existing references to the javascript source files and
    # in place of the last one write the concatenated file
    foundLines = []
    for line in inFile:
        useLine = True
        containsUseStrict = {}

        for cssFile in cssFiles:
            line = line.replace('"../css/' + cssFile + '.css"', '"../css/' + cssFile + '-' + gitCommit + '.css"')

        for jsFile in page['jsFiles']:
            beforeText = '\t<script type="text/javascript" src="'
            afterText = '"></script>'

            if line.find(beforeText + '../' + jsFile + afterText) != -1:
                useLine = False
                foundLines.append(jsFile)
                if len(foundLines) == len(page['jsFiles']):
                    outFile.write(beforeText + combinedFilename + afterText)

        if useLine:
            outFile.write(line)

    if set(foundLines) != set(page['jsFiles']):
        print "ERROR: didn't find all source file references in ", phpFilepath
        print "missing references = ", set(page['jsFiles']) - set(foundLines)
        sys.exit(1)

    inFile.close()
    outFile.close()

# copy other resources:
for dir in directoriesToCopy:
    shutil.copytree(dir, buildDir + '/' + dir, ignore=ignored_files)

for file in filesToCopy:
    shutil.copyfile(file, buildDir + '/' + file) 

