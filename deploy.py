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

            "src/feedback.js",
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
            "src/searchResults.js",
            "src/searchByName.js"
        ]
    }
]

directoriesToCopy = [
    'about',
    'home',
    'html',
    'css',
    'src',
    'content',
    'server',
    'external',
    'testPages'
]

def ignored_files(adir, filenames):
    return [filename for filename in filenames if filename == '.git']

# clean build dir
if os.path.exists(buildDir):
    shutil.rmtree(buildDir)

os.makedirs(buildDir)

gitCommit = subprocess.check_output('git rev-parse HEAD').replace('\n','')
print 'building from commit ', gitCommit

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
    foundLines = 0
    for line in inFile:
        useLine = True
        containsUseStrict = {}

        for jsFile in page['jsFiles']:

            beforeText = '\t<script type="text/javascript" src="'
            afterText = '"></script>'

            if line.find(beforeText + '../' + jsFile + afterText) != -1:
                useLine = False
                foundLines += 1
                if foundLines == len(page['jsFiles']):
                    outFile.write(beforeText + combinedFilename + afterText)
        if useLine:
            outFile.write(line)

    if foundLines != len(page['jsFiles']):
        print "ERROR: didn't find all source file references in ", phpFilepath
        print foundLines, len(page['jsFiles'])
        sys.exit(1)

    inFile.close()
    outFile.close()

# copy other resources:
for dir in directoriesToCopy:
    shutil.copytree(dir, buildDir + '/' + dir, ignore=ignored_files)

