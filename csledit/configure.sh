#!/bin/bash

# generate example citations
cd exampleCitationsGenerator
./installNodeModules.sh
node generateExampleCitations.js
cd ..

# convert schema from .rnc (Relax NG Compact) to .rng (Relax NG XML)
java -jar "external/trang/trang.jar" "external/csl-schema/csl.rnc" "external/csl-schema/csl.rng"
