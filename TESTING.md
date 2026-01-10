# Testing Guide for CSL Editor v2.0

## Prerequisites

Before testing, ensure you have:

1. **Node.js 18+** installed
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

2. **Git submodules** initialized
   ```bash
   git submodule update --init --recursive
   ```

## Step 1: Install Dependencies

```bash
npm install
```

Expected output:
- Should install Vite, fast-xml-parser, glob, idb-keyval, and jQuery
- No errors or warnings about incompatible versions

## Step 2: Test Style Index Generation

```bash
npm run build:styles
```

This will:
1. Scan all CSL files in `external/csl-styles/`
2. Generate `generated/styleIndex.json` (~50KB)
3. Create individual JSON files in `generated/styles/` (~10,000 files)

Expected output:
```
Starting style index generation...

Found 10391 style files

Processed 1000/10391 styles...
Processed 2000/10391 styles...
...
Processed 10000/10391 styles...
Processed 10391/10391 styles...

✓ Style index generation complete!
  Total styles: 10391
  Independent styles: ~2500
  Dependent styles: ~7800
  Index file: generated/styleIndex.json
  Style files: generated/styles/
```

**Verify:**
```bash
# Check the index file exists
ls -lh generated/styleIndex.json

# Check some style files were created
ls generated/styles/ | head -10

# Count total style files
ls generated/styles/ | wc -l
```

## Step 3: Test Citation Generation

```bash
npm run build:citations
```

Expected output:
```
Starting example citations generation...

Processing 2500 independent styles...

Processed 1000/2500 styles...
Processed 2000/2500 styles...
Processed 2500/2500 styles...

✓ Example citations generation complete!
  Processed 2500 independent styles
  Output directory: generated/citations/

Note: Actual citation generation happens on-demand in the browser.
```

## Step 4: Test Library Build

```bash
npm run build:lib
```

This runs Vite to build the library.

Expected output:
```
vite v5.x.x building for production...
✓ xx modules transformed.
dist/csl-editor.es.js    xx.xx kB │ gzip: xx.xx kB
dist/csl-editor.umd.js   xx.xx kB │ gzip: xx.xx kB
✓ built in xxxms
```

**Verify:**
```bash
# Check dist directory was created
ls -lh dist/

# Should contain:
# - csl-editor.es.js (ES module build)
# - csl-editor.umd.js (UMD build)
# - Source maps (.map files)
```

## Step 5: Full Build Test

```bash
npm run build
```

This runs all build steps in sequence.

Expected output:
```
========================================
CSL Editor Build Process
========================================

Step 1: Generating style index...
[... output from generateStyleIndex.js ...]

Step 2: Generating example citations...
[... output from generateExampleCitations.js ...]

Step 3: Generating CSL schema...
[... Java output if available ...]

Step 4: Building library with Vite...
[... Vite output ...]

========================================
✓ Build complete!
========================================
```

## Step 6: Test in Browser

Create a simple test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>CSL Editor v2.0 Test</title>
</head>
<body>
  <h1>CSL Editor v2.0 Test</h1>
  <div id="output"></div>

  <script type="module">
    import { init, cslStyles, styleLoader } from './dist/csl-editor.es.js';

    const output = document.getElementById('output');

    try {
      // Test 1: Initialize
      output.innerHTML += '<p>Initializing...</p>';
      await init();
      output.innerHTML += '<p>✓ Initialized</p>';

      // Test 2: Get stats
      const stats = styleLoader.getStats();
      output.innerHTML += `<p>Total styles: ${stats.totalStyles}</p>`;
      output.innerHTML += `<p>Independent: ${stats.independentStyles}</p>`;
      output.innerHTML += `<p>Dependent: ${stats.dependentStyles}</p>`;

      // Test 3: Search for styles
      const apaResults = cslStyles.searchByTitle('APA');
      output.innerHTML += `<p>Found ${apaResults.length} styles matching "APA"</p>`;

      // Test 4: Load a specific style
      output.innerHTML += '<p>Loading APA style...</p>';
      const apaXml = await cslStyles.loadStyleXml('http://www.zotero.org/styles/apa');
      output.innerHTML += `<p>✓ Loaded APA style (${apaXml.length} chars)</p>`;

      // Test 5: Load another style (should be fast due to caching)
      output.innerHTML += '<p>Loading IEEE style...</p>';
      const ieeeXml = await cslStyles.loadStyleXml('http://www.zotero.org/styles/ieee');
      output.innerHTML += `<p>✓ Loaded IEEE style (${ieeeXml.length} chars)</p>`;

      output.innerHTML += '<h2 style="color: green;">All tests passed! ✓</h2>';
    } catch (err) {
      output.innerHTML += `<h2 style="color: red;">Error: ${err.message}</h2>`;
      console.error(err);
    }
  </script>
</body>
</html>
```

Serve this file with a local web server:

```bash
npm run dev
```

Or use Python:

```bash
python -m http.server 8000
```

Then open http://localhost:8000/test.html

**Expected results:**
- ✓ Initialized
- Total styles: ~10,000+
- Independent: ~2,500
- Dependent: ~7,800
- Found X styles matching "APA"
- ✓ Loaded APA style
- ✓ Loaded IEEE style
- All tests passed! ✓

## Step 7: Check Browser Cache

After running the browser test:

1. Open browser DevTools (F12)
2. Go to Application tab → IndexedDB
3. You should see `keyval-store` with cached entries:
   - `csl-style-index` (the style index)
   - `csl-style-http://www.zotero.org/styles/apa` (loaded styles)
   - `csl-style-http://www.zotero.org/styles/ieee`

4. Refresh the page - styles should load instantly from cache

## Step 8: Memory Usage Verification

Compare memory usage to the old system:

**Old system:**
```bash
# Required 12GB RAM
node --max-old-space-size=12288 exampleCitationsGenerator/generateExampleCitations.js
```

**New system:**
```bash
# Monitor memory during build
/usr/bin/time -v npm run build 2>&1 | grep "Maximum resident"
```

Expected: ~500MB or less (much better than 12GB!)

## Common Issues

### Issue: "Style index not found"

**Cause:** Styles not generated yet

**Solution:**
```bash
npm run build:styles
```

### Issue: "Module not found" errors

**Cause:** Dependencies not installed

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: CORS errors in browser

**Cause:** Opening HTML file directly (file://)

**Solution:** Use a web server:
```bash
npm run dev
# or
python -m http.server 8000
```

### Issue: Java errors during build

**Cause:** Java not installed or trang.jar missing

**Solution:** This is non-fatal. Schema generation is optional.

## Performance Benchmarks

Run these to measure performance improvements:

### Build time
```bash
time npm run build
```

Expected: < 5 minutes (vs 10+ minutes in old system)

### Style loading (in browser console)
```javascript
// First load (from network)
console.time('load-apa');
await cslStyles.loadStyleXml('http://www.zotero.org/styles/apa');
console.timeEnd('load-apa');

// Second load (from cache)
await styleLoader.clearCache();
await styleLoader.loadStyle('http://www.zotero.org/styles/apa');

console.time('load-apa-cached');
await cslStyles.loadStyleXml('http://www.zotero.org/styles/apa');
console.timeEnd('load-apa-cached');
```

Expected:
- First load: ~50-100ms
- Cached load: ~1-5ms

## Integration Testing with Demo Site

1. Build the library:
   ```bash
   npm run build
   ```

2. Copy to demo site:
   ```bash
   cp -r dist ../csl-editor-demo-site/cslEditorLib/
   cp -r generated ../csl-editor-demo-site/cslEditorLib/
   ```

3. Update demo site to use new API (see MIGRATION.md)

4. Test all pages:
   - Visual Editor
   - Code Editor
   - Search by Name
   - Search by Example

## Automated Testing (Future)

TODO: Add automated tests using:
- Vitest for unit tests
- Playwright for browser tests
- GitHub Actions for CI

## Success Criteria

✅ All build steps complete without errors
✅ Generated files exist and have reasonable sizes
✅ Browser test passes all checks
✅ IndexedDB caching works
✅ Memory usage < 1GB during build
✅ Initial page load < 2 seconds
✅ Cached style loading < 10ms

## Need Help?

If tests fail:
1. Check the error message carefully
2. Verify prerequisites (Node version, submodules)
3. Try `rm -rf node_modules && npm install`
4. Check GitHub issues
5. Create a new issue with full error output
