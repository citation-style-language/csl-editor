# CSL Editor Library v2.0

A modern HTML5 library for searching and editing styles written in the [Citation Style Language](http://citationstyles.org/).

**🎉 Version 2.0 - Completely Modernized!**

## What's New in v2.0

- ✅ **No More Memory Issues**: Builds with standard RAM (no more 12GB requirement!)
- ✅ **Fast Initial Load**: On-demand style loading instead of 12MB upfront
- ✅ **Modern Build System**: Uses Vite, ES modules, and current Node.js
- ✅ **Offline Support**: IndexedDB caching for previously loaded styles
- ✅ **Individual Style Files**: 10,000+ small JSON files instead of monolithic ones
- ✅ **Simple Build Process**: Just `npm install && npm run build`

See [MIGRATION.md](./MIGRATION.md) for details on migrating from v1.x.

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/citation-style-editor/csl-editor.git
cd csl-editor

# Initialize submodules
git submodule update --init --recursive

# Install dependencies
npm install

# Build the library
npm run build
```

### Requirements

- **Node.js**: 18.0.0 or higher
- **Java**: (optional) For schema generation

## Usage

### In a Browser (ES Modules)

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { init, cslStyles } from './dist/csl-editor.es.js';

    // Initialize the library
    await init();

    // Search for styles
    const results = cslStyles.searchByTitle('APA');
    console.log(results);

    // Load a specific style
    const styleXml = await cslStyles.loadStyleXml(
      'http://www.zotero.org/styles/apa'
    );
    console.log(styleXml);
  </script>
</head>
<body>
  <h1>CSL Editor Demo</h1>
</body>
</html>
```

### In a Browser (UMD)

```html
<script src="./dist/csl-editor.umd.js"></script>
<script>
  (async () => {
    // Initialize
    await CSLEditor.init();

    // Use the API
    const styles = CSLEditor.cslStyles.searchByTitle('IEEE');
    console.log(styles);
  })();
</script>
```

### As an NPM Module

```javascript
import { init, cslStyles, styleLoader } from 'csl-editor';

// Initialize
await init();

// Search for styles
const results = cslStyles.searchByTitle('APA');

// Load a style
const apa = await cslStyles.loadStyleXml(
  'http://www.zotero.org/styles/apa'
);

// Get statistics
const stats = styleLoader.getStats();
console.log(`Total styles: ${stats.totalStyles}`);
console.log(`Independent: ${stats.independentStyles}`);
console.log(`Dependent: ${stats.dependentStyles}`);
```

## API Reference

### `cslStyles`

Main module for working with CSL styles.

#### `init(): Promise<void>`
Initialize the style system. **Must be called before using other functions.**

```javascript
await cslStyles.init();
```

#### `searchByTitle(query: string): Array<Object>`
Search for styles by title.

```javascript
const results = cslStyles.searchByTitle('APA');
// Returns: [{ id, title, masterId, isDependent }, ...]
```

#### `loadStyleXml(styleId: string): Promise<string>`
Load the CSL XML content for a style.

```javascript
const xml = await cslStyles.loadStyleXml('http://www.zotero.org/styles/apa');
```

#### `getMasterIdFromId(styleId: string): string`
Get the master (independent) style ID for any style ID.

```javascript
const masterId = cslStyles.getMasterIdFromId(styleId);
```

#### `getStyleTitle(styleId: string): string`
Get the title for a style.

```javascript
const title = cslStyles.getStyleTitle('http://www.zotero.org/styles/apa');
// Returns: "American Psychological Association 7th edition"
```

#### `getAllStyleIds(): Array<string>`
Get all available style IDs.

```javascript
const allIds = cslStyles.getAllStyleIds();
```

#### `getIndependentStyleIds(): Array<string>`
Get only independent (master) style IDs.

```javascript
const independentIds = cslStyles.getIndependentStyleIds();
```

### `styleLoader`

Low-level style loading with caching.

#### `init(): Promise<Object>`
Initialize and load the style index.

```javascript
const index = await styleLoader.init();
```

#### `loadStyle(styleId: string): Promise<Object>`
Load a style with caching.

```javascript
const style = await styleLoader.loadStyle(styleId);
// Returns: { id, title, csl }
```

#### `loadStyles(styleIds: Array<string>): Promise<Array<Object>>`
Load multiple styles in parallel.

```javascript
const styles = await styleLoader.loadStyles([id1, id2, id3]);
```

#### `clearCache(): Promise<void>`
Clear the IndexedDB cache.

```javascript
await styleLoader.clearCache();
```

#### `getStats(): Object`
Get repository statistics.

```javascript
const stats = styleLoader.getStats();
// Returns: { totalStyles, independentStyles, dependentStyles, generatedAt }
```

## Build Scripts

```bash
# Full build (recommended)
npm run build

# Individual steps
npm run build:styles      # Generate style index and individual JSON files
npm run build:citations   # Generate citation metadata
npm run build:lib         # Build the library with Vite

# Development
npm run dev              # Start dev server with hot reload
npm run preview          # Preview production build

# Maintenance
npm run update:submodules  # Update git submodules
npm run update:citeproc    # Update citeproc.js
```

## Architecture

### Directory Structure

```
csl-editor/
├── src/                   # Source code (ES modules)
│   ├── index.js          # Main entry point
│   ├── styleLoader.js    # Style loading with IndexedDB caching
│   ├── cslStyles.modern.js # Modern cslStyles API
│   └── ...               # Other modules
├── scripts/              # Build scripts
│   ├── build.js          # Main build orchestrator
│   ├── generateStyleIndex.js    # Create style index
│   └── generateExampleCitations.js
├── external/             # Git submodules
│   ├── csl-styles/       # CSL style repository
│   ├── locales/          # CSL locales
│   ├── citeproc/         # citeproc-js engine
│   └── ...
├── generated/            # Generated during build
│   ├── styleIndex.json   # Metadata for all styles
│   ├── styles/           # Individual style JSON files
│   │   ├── apa.json
│   │   ├── ieee.json
│   │   └── ... (10,000+)
│   └── citations/        # Citation metadata
└── dist/                 # Built library output
    ├── csl-editor.es.js  # ES module build
    └── csl-editor.umd.js # UMD build
```

### How It Works

1. **Build Time**:
   - Parse all CSL styles from the git submodule
   - Generate a master index with metadata for all styles
   - Create individual JSON files for each independent style
   - Build the library with Vite

2. **Runtime**:
   - Load the lightweight style index (~50KB)
   - Cache index in IndexedDB
   - Fetch individual styles on-demand
   - Cache loaded styles in IndexedDB
   - Serve from cache on subsequent loads

### Key Improvements

**Memory Usage:**
- Old: 12GB RAM to generate monolithic JSON files
- New: ~500MB RAM to generate individual files

**Initial Load:**
- Old: 12MB of JSON loaded upfront
- New: ~50KB index, styles loaded on-demand

**Build Process:**
- Old: `node --max-old-space-size=12288`
- New: Standard `npm run build`

## Development

### Prerequisites

- Node.js 18+
- Git
- Java (optional, for schema generation)

### Setup

```bash
git clone https://github.com/citation-style-editor/csl-editor.git
cd csl-editor
git submodule update --init --recursive
npm install
```

### Running Locally

```bash
npm run dev
```

This starts a development server with hot module replacement.

### Testing

The library maintains backward compatibility with the existing test suite. Legacy tests will be gradually migrated to modern formats.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to ensure everything builds
5. Submit a pull request

## Migration from v1.x

See [MIGRATION.md](./MIGRATION.md) for a detailed migration guide.

## Reference Implementation

Play with the reference implementation: [Citation Style Editor](http://editor.citationstyles.org)

## License

MIT License - see [MIT-LICENCE.txt](./MIT-LICENCE.txt)

## Attributions

- [Citation Style Language](http://citationstyles.org/)
- [CSL style repository](https://github.com/citation-style-language/styles)
- [citeproc-js](http://gsl-nagoya-u.net/http/pub/citeproc-doc.html)
- [CodeMirror](http://codemirror.net/)
- [Vite](https://vitejs.dev/)
- [idb-keyval](https://github.com/jakearchibald/idb-keyval)
- And many more - see [README.md](./README.md) for full list

## Changelog

### v2.0.0 (2026-01-10)

**Major Changes:**
- Complete rewrite using modern ES modules
- Replaced monolithic JSON files with individual style files
- Added IndexedDB caching for offline support
- Modernized build system with Vite
- Eliminated memory issues during build
- Improved initial load performance
- Updated to Node.js 18+ compatibility

**Breaking Changes:**
- RequireJS/AMD modules replaced with ES modules
- Async initialization required
- Style loading is now asynchronous
- See MIGRATION.md for full details

### v1.x

See git history for v1.x changes.
