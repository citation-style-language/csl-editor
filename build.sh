#!/bin/bash

declare gitCommit=$(git rev-parse HEAD)
echo "gitCommit = $gitCommit"

mkdir build

declare outputFile="build/CSLEDIT.visualEditor-$gitCommit.js"
echo '// CSLEDIT.visualEditor built from commit $gitCommit' > $outputFile

cat "src/citationEngine.js" >> $outputFile
cat "src/exampleData.js" >> $outputFile
cat "src/diff.js" >> $outputFile
cat "src/debug.js" >> $outputFile
cat "src/cslParser.js" >> $outputFile
cat "src/Iterator.js" >> $outputFile
cat "src/cslNode.js" >> $outputFile
cat "src/cslData.js" >> $outputFile
cat "src/schema.js" >> $outputFile

cat "src/feedback.js" >> $outputFile
cat "src/editReferences.js" >> $outputFile
cat "src/NodePathView.js" >> $outputFile
cat "src/MultiComboBox.js" >> $outputFile
cat "src/propertyPanel.js" >> $outputFile
cat "src/sortPropertyPanel.js" >> $outputFile
cat "src/infoPropertyPanel.js" >> $outputFile
cat "src/editNodeButton.js" >> $outputFile
cat "src/smartTree.js" >> $outputFile
cat "src/Titlebar.js" >> $outputFile
cat "src/ViewController.js" >> $outputFile
cat "src/controller.js" >> $outputFile
cat "src/visualEditor.js" >> $outputFile
