#!/bin/bash

git submodule update --recursive --remote
wget -q https://raw.githubusercontent.com/Juris-M/citeproc-js/master/citeproc.js -O ./external/citeproc/citeproc.js
