#!/bin/bash

# write current git commit
mkdir generated
git rev-parse HEAD > generated/commit.txt

# generate example citations
cd server
java -jar "../external/rhino/js-1.7R2.jar" -opt -1 generateExampleCitations.js
cd ..

# convert schema from .rnc (Relax NG Compact) to .rng (Relax NG XML)
java -jar "external/trang/trang.jar" "external/csl-schema/csl.rnc" "external/csl-schema/csl.rng"
