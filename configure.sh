#!/bin/bash

mkdir generated

# generate example citations
cd exampleCitationsGenerator
npm install
node --max-old-space-size=5120 generateExampleCitations.js #increase to 5gb
cd ..

mkdir generated/csl-schema

# convert schema from .rnc (Relax NG Compact) to .rng (Relax NG XML)
java -jar "external/trang/trang.jar" "external/csl-schema/csl.rnc" "generated/csl-schema/csl.rng"
