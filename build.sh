#!/bin/bash

declare gitCommit=$(git rev-parse HEAD)
echo "gitCommit = $gitCommit"

mkdir build

declare visualEditor="build/CSLEDIT.visualEditor-$gitCommit.js"
echo '// CSLEDIT.visualEditor built from commit $gitCommit' > $visualEditor

cat "src/citationEngine.js" >> $visualEditor
cat "src/exampleData.js" >> $visualEditor
cat "src/diff.js" >> $visualEditor
cat "src/debug.js" >> $visualEditor
cat "src/cslParser.js" >> $visualEditor
cat "src/Iterator.js" >> $visualEditor
cat "src/cslNode.js" >> $visualEditor
cat "src/cslData.js" >> $visualEditor
cat "src/schema.js" >> $visualEditor

cat "src/feedback.js" >> $visualEditor
cat "src/editReferences.js" >> $visualEditor
cat "src/NodePathView.js" >> $visualEditor
cat "src/MultiComboBox.js" >> $visualEditor
cat "src/propertyPanel.js" >> $visualEditor
cat "src/sortPropertyPanel.js" >> $visualEditor
cat "src/infoPropertyPanel.js" >> $visualEditor
cat "src/editNodeButton.js" >> $visualEditor
cat "src/smartTree.js" >> $visualEditor
cat "src/Titlebar.js" >> $visualEditor
cat "src/ViewController.js" >> $visualEditor
cat "src/controller.js" >> $visualEditor
cat "src/visualEditor.js" >> $visualEditor

declare searchByExample="build/CSLEDIT.searchByExample-$gitCommit.js"
echo '// CSLEDIT.searchByExample built from commit $gitCommit' > $searchByExample

cat "src/xmlUtility.js" >> $searchByExample
cat "src/citationEngine.js" >> $searchByExample
cat "server/config.js" >> $searchByExample
cat "generated/exampleCitationsEnc.js" >> $searchByExample

cat "src/debug.js" >> $searchByExample
cat "src/diff.js" >> $searchByExample
cat "src/cslParser.js" >> $searchByExample
cat "src/cslData.js" >> $searchByExample
cat "src/searchResults.js" >> $searchByExample
cat "src/searchByExample.js" >> $searchByExample
cat "src/analytics.js" >> $searchByExample

declare searchByName="build/CSLEDIT.searchByName-$gitCommit.js"
echo '// CSLEDIT.searchByName built from commit $gitCommit' > $searchByName

cat "src/searchResults.js" >> $searchByName
cat "src/searchByName.js" >> $searchByName

declare codeEditor="build/CSLEDIT.codeEditor-$gitCommit.js"
echo '// CSLEDIT.codeEditor built from commit $gitCommit' > $codeEditor

cat "src/debug.js" >> $codeEditor
cat "src/citationEngine.js" >> $codeEditor
cat "src/exampleData.js" >> $codeEditor
cat "src/diff.js" >> $codeEditor
cat "src/cslParser.js" >> $codeEditor
cat "src/cslData.js" >> $codeEditor
cat "src/codeEditor.js" >> $codeEditor

