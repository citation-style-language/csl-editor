#!/bin/bash

echo "CSL Editor Build Configuration"
echo "=============================="
echo ""

# Ensure we have node_modules installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create output directories
echo "Creating output directories..."
mkdir -p generated/styles
mkdir -p generated/citations
mkdir -p generated/csl-schema

echo ""
echo "Running build process..."
echo ""

# Run the modern build process
npm run build

echo ""
echo "=============================="
echo "Build configuration complete!"
echo "=============================="
echo ""
echo "Note: The new build system generates individual JSON files"
echo "instead of monolithic files, eliminating memory issues."
echo ""
