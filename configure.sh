#!/bin/bash

mkdir generated

# generate example citations
cd exampleCitationsGenerator
npm install
node --max-old-space-size=12288 generateExampleCitations.js #increase to 12gb
cd ..

mkdir generated/csl-schema

# convert schema from .rnc (Relax NG Compact) to .rng (Relax NG XML)
java -jar "external/trang/trang.jar" "external/csl-schema/schemas/styles/csl.rnc" "generated/csl-schema/csl.rng"
