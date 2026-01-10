# Migration Guide: CSL Editor v1.x to v2.0

## Overview

Version 2.0 of the CSL Editor represents a complete modernization of the codebase. This guide will help you understand the changes and migrate your code.

## Major Changes

### 1. **No More Giant JSON Files** ✅

**Before (v1.x):**
- Single 9.5MB `preGeneratedExampleCitations.json` file
- Single 2.3MB `cslStyles.json` file
- Required 12GB of RAM to generate
- Slow initial page load

**After (v2.0):**
- Individual JSON files per style (~10,000 small files)
- Styles loaded on-demand
- IndexedDB caching for offline support
- No memory issues during build
- Much faster initial load

### 2. **Modern Build System** ✅

**Before (v1.x):**
- RequireJS/AMD modules
- Ancient Node.js versions required
- Manual build scripts

**After (v2.0):**
- ES modules
- Vite bundler (fast, modern)
- Works with Node.js 18+
- Simple npm scripts

### 3. **Simplified Build Process** ✅

**Before (v1.x):**
```bash
cd exampleCitationsGenerator
npm install
node --max-old-space-size=12288 generateExampleCitations.js
```

**After (v2.0):**
```bash
npm install
npm run build
```

## Breaking Changes

### Module System

**Before (v1.x):**
```javascript
// AMD/RequireJS
define(['src/cslStyles'], function(CSLEDIT_cslStyles) {
  // ...
});
```

**After (v2.0):**
```javascript
// ES modules
import { cslStyles } from 'csl-editor';

// Initialize (required)
await cslStyles.init();

// Use the API
const styleTitle = cslStyles.getStyleTitle(styleId);
```

### Async Initialization

The new version requires asynchronous initialization:

```javascript
import { init, cslStyles } from 'csl-editor';

// Initialize before use
await init();

// Now you can use the library
const styles = cslStyles.searchByTitle('APA');
```

### Style Loading

**Before (v1.x):**
```javascript
// All styles loaded synchronously at startup
var allStyles = CSLEDIT_cslStyles.styles;
```

**After (v2.0):**
```javascript
// Styles loaded on-demand
const styleData = await cslStyles.loadStyleXml(styleId);
```

## API Changes

### cslStyles Module

Most functions remain similar, but now require async/await:

| v1.x | v2.0 |
|------|------|
| `CSLEDIT_cslStyles.getMasterIdFromId(id)` | `cslStyles.getMasterIdFromId(id)` (sync) |
| `CSLEDIT_cslStyles.getStyleTitle(id)` | `cslStyles.getStyleTitle(id)` (sync) |
| N/A (loaded from JSON) | `await cslStyles.loadStyleXml(id)` (async) |
| N/A | `cslStyles.searchByTitle(query)` (sync) |

### New Features

**IndexedDB Caching:**
```javascript
import { styleLoader } from 'csl-editor';

// Initialize
await styleLoader.init();

// Load with caching
const style = await styleLoader.loadStyle(styleId);

// Clear cache if needed
await styleLoader.clearCache();

// Get statistics
const stats = styleLoader.getStats();
```

**Batch Loading:**
```javascript
// Load multiple styles in parallel
const styles = await styleLoader.loadStyles([id1, id2, id3]);
```

## Build Configuration

### NPM Scripts

```json
{
  "scripts": {
    "build": "npm run build:styles && npm run build:citations && npm run build:lib",
    "build:styles": "node scripts/generateStyleIndex.js",
    "build:citations": "node scripts/generateExampleCitations.js",
    "build:lib": "vite build",
    "dev": "vite",
    "update:submodules": "git submodule update --recursive --remote",
    "update:citeproc": "curl -o ./external/citeproc/citeproc.js https://raw.githubusercontent.com/Juris-M/citeproc-js/master/citeproc.js"
  }
}
```

### Generated Files

**v1.x:**
```
generated/
├── cslStyles.json (2.3MB)
└── preGeneratedExampleCitations.json (9.5MB)
```

**v2.0:**
```
generated/
├── styleIndex.json (metadata for all styles)
├── styles/
│   ├── apa.json
│   ├── ieee.json
│   ├── ... (10,000+ files)
└── citations/
    ├── apa.json
    ├── ieee.json
    └── ... (citation metadata)
```

## Migration Steps

### For Library Developers

1. **Update Dependencies:**
   ```bash
   npm install
   ```

2. **Run New Build:**
   ```bash
   npm run build
   ```

3. **Update Module Imports:**
   - Replace RequireJS `define()` with ES `import`
   - Add `await init()` at application startup
   - Update style loading to use async `loadStyleXml()`

4. **Test:**
   ```bash
   npm run dev
   ```

### For Demo Site

1. **Update Library Reference:**
   ```html
   <!-- Before -->
   <script src="cslEditorLib/external/requirejs/require.js"></script>

   <!-- After -->
   <script type="module">
     import { init, cslStyles } from './cslEditorLib/dist/csl-editor.es.js';
     await init();
     // Your code here
   </script>
   ```

2. **Update Generated Files:**
   - Delete old `generated/*.json` files
   - Run `npm run build` in the library
   - Copy new `generated/` directory structure

## Performance Improvements

### Memory Usage

- **Before:** 12GB RAM required to build
- **After:** ~500MB RAM for build

### Initial Load Time

- **Before:** Load 12MB of JSON upfront
- **After:** Load ~50KB index, fetch styles on-demand

### Caching

- **Before:** No caching
- **After:** Persistent IndexedDB cache, works offline after first load

## Backward Compatibility

The old files (`exampleCitationsGenerator/`) are preserved but deprecated. The new system:

1. Uses the same CSL styles from the submodule
2. Maintains the same API surface (with additions)
3. Generates compatible output formats

## Need Help?

- Check the [README](./README.md) for basic usage
- See [examples](./examples/) for code samples
- Report issues on GitHub

## What's Next?

Future improvements (Phase 3-5):
- Simplify submodule management
- Add GitHub Actions CI/CD
- Further performance optimizations
- Better handling of complex/nested styles
