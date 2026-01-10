# Quick Start Guide

Get the modernized CSL Editor up and running in 5 minutes.

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- Git

## Step 1: Clone and Setup (2 minutes)

```bash
# Navigate to the csl-editor directory (you're already there!)
cd /path/to/csl-editor

# Initialize submodules (if not already done)
git submodule update --init --recursive

# Install dependencies
npm install
```

## Step 2: Build (3-5 minutes)

```bash
# Run the complete build process
npm run build
```

This will:
1. Generate a style index from ~10,000 CSL files
2. Create individual JSON files for each style
3. Build the library with Vite

Expected output:
```
========================================
CSL Editor Build Process
========================================

Step 1: Generating style index...
Found 10391 style files
Processed 10391/10391 styles...
✓ Style index generation complete!

Step 2: Generating example citations...
✓ Example citations generation complete!

Step 3: Generating CSL schema...
[Optional - requires Java]

Step 4: Building library with Vite...
✓ built in xxxms

========================================
✓ Build complete!
========================================
```

## Step 3: Test (1 minute)

### Quick Test in Browser

```bash
# Start development server
npm run dev
```

Open your browser to the URL shown (usually http://localhost:5173)

Then navigate to `test-example.html` or create a simple test:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Quick Test</title>
</head>
<body>
  <h1>CSL Editor Test</h1>
  <div id="output"></div>

  <script type="module">
    import { init, cslStyles } from './dist/csl-editor.es.js';

    const output = document.getElementById('output');

    // Initialize
    await init();
    output.innerHTML += '<p>✓ Initialized</p>';

    // Get stats
    const stats = cslStyles.styleLoader.getStats();
    output.innerHTML += `<p>Total styles: ${stats.totalStyles}</p>`;

    // Search
    const results = cslStyles.searchByTitle('APA');
    output.innerHTML += `<p>Found ${results.length} APA styles</p>`;

    // Load a style
    const apa = await cslStyles.loadStyleXml('http://www.zotero.org/styles/apa');
    output.innerHTML += `<p>✓ Loaded APA (${apa.length} chars)</p>`;

    output.innerHTML += '<p><strong>All working!</strong></p>';
  </script>
</body>
</html>
```

### Or use the included test file

```bash
# Serve the directory
npm run dev

# Then open: http://localhost:5173/test-example.html
# Click "Run All Tests"
```

## Step 4: Verify (30 seconds)

Check that these directories exist and contain files:

```bash
# Should have ~10,000 files
ls generated/styles/ | wc -l

# Should exist
ls -lh generated/styleIndex.json

# Should have ES and UMD builds
ls -lh dist/
```

## What You've Built

✅ **generated/styleIndex.json** - Lightweight index (~50KB) with metadata for all styles
✅ **generated/styles/** - Individual JSON files for each style (~10,000 files)
✅ **dist/csl-editor.es.js** - ES module build of the library
✅ **dist/csl-editor.umd.js** - UMD build for broader compatibility

## Using in Your Project

### ES Module (Modern)

```javascript
import { init, cslStyles } from './dist/csl-editor.es.js';

await init();
const results = cslStyles.searchByTitle('APA');
```

### UMD (Legacy Browsers)

```html
<script src="./dist/csl-editor.umd.js"></script>
<script>
  CSLEditor.init().then(() => {
    // Use CSLEditor.cslStyles here
  });
</script>
```

## Common Issues

### "Command not found: npm"
**Solution:** Install Node.js from https://nodejs.org/

### "Module not found" errors
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### "CORS error" in browser
**Solution:** Don't open HTML files directly. Use:
```bash
npm run dev
# or
python -m http.server 8000
```

### Build is slow
**Note:** First build takes 3-5 minutes (processing 10,000+ files). This is normal and WAY better than the old 12GB requirement!

## Next Steps

- Read [MIGRATION.md](./MIGRATION.md) for API details
- See [TESTING.md](./TESTING.md) for comprehensive testing
- Check [README.v2.md](./README.v2.md) for full documentation
- Review [MODERNIZATION_SUMMARY.md](./MODERNIZATION_SUMMARY.md) for architecture details

## Need Help?

1. Check [TESTING.md](./TESTING.md) for detailed troubleshooting
2. Review error messages carefully
3. Ensure Node.js 18+ is installed
4. Verify git submodules are initialized
5. File an issue on GitHub with full error output

## Success!

If you see:
- ✓ Build completed without errors
- ✓ Test page loads and shows results
- ✓ Memory usage under 1GB during build
- ✓ Styles load in browser

Then you're all set! The modernized CSL Editor is working. 🎉
