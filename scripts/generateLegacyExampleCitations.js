/**
 * Generate the monolithic preGeneratedExampleCitations.json file
 * Required for Search by Example functionality
 *
 * This uses citeproc-js to generate actual formatted citations for all independent styles
 * Warning: This takes 5-10 minutes and requires significant memory
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STYLE_INDEX = 'generated/styleIndex.json';
const STYLES_DIR = 'external/csl-styles';
const LOCALES_DIR = 'external/locales';
const EXAMPLE_DATA_FILE = 'src/exampleData.js';
const OUTPUT_FILE = 'generated/preGeneratedExampleCitations.json';

// Will be populated from exampleData.js
let EXAMPLE_REFERENCES = [];

/**
 * Load example references from the AMD exampleData.js module.
 * Extracts the jsonDocumentList array and assigns ITEM-N ids.
 */
async function loadExampleReferences() {
  const source = await fs.readFile(EXAMPLE_DATA_FILE, 'utf-8');

  // Extract the jsonDocumentList array from the AMD module.
  // The file has: CSLEDIT_exampleData.jsonDocumentList = [ ... ]
  const startMarker = 'CSLEDIT_exampleData.jsonDocumentList = [';
  const startIdx = source.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error('Could not find jsonDocumentList in ' + EXAMPLE_DATA_FILE);
  }

  // Find the matching closing bracket by counting nesting
  let depth = 0;
  let arrayStart = startIdx + startMarker.length - 1; // points to '['
  let arrayEnd = -1;
  for (let i = arrayStart; i < source.length; i++) {
    if (source[i] === '[') depth++;
    else if (source[i] === ']') {
      depth--;
      if (depth === 0) {
        arrayEnd = i + 1;
        break;
      }
    }
  }

  if (arrayEnd === -1) {
    throw new Error('Could not find end of jsonDocumentList array');
  }

  const arrayStr = source.substring(arrayStart, arrayEnd);
  const documents = JSON.parse(arrayStr);

  // Assign ITEM-N ids like the editor does (see exampleCitations.js getCiteprocReferences)
  EXAMPLE_REFERENCES = documents.map((doc, i) => {
    return { ...doc, id: `ITEM-${i + 1}` };
  });

  console.log(`✓ Loaded ${EXAMPLE_REFERENCES.length} example references from ${EXAMPLE_DATA_FILE}\n`);
}

// Dynamic import for citeproc-js (CommonJS module)
// Note: We use the npm 'citeproc' package for Node.js execution
// The browser version is in external/citeproc/citeproc.js
let CSL;

async function loadCiteproc() {
  try {
    const citeprocModule = await import('citeproc');
    CSL = citeprocModule.default || citeprocModule.CSL || citeprocModule;
    console.log('✓ Citeproc-js loaded successfully\n');
  } catch (err) {
    console.error('Error: citeproc package not found.');
    console.error('Please install it with: npm install --save-dev citeproc');
    console.error('Note: This is separate from external/citeproc/citeproc.js (browser version)\n');
    process.exit(1);
  }
}

/**
 * Cache for loaded locales
 */
const localeCache = {};

/**
 * Load a locale XML file
 */
async function loadLocale(lang) {
  if (localeCache[lang]) {
    return localeCache[lang];
  }

  try {
    const localePath = path.join(LOCALES_DIR, `locales-${lang}.xml`);
    const localeXml = await fs.readFile(localePath, 'utf-8');
    localeCache[lang] = localeXml;
    return localeXml;
  } catch (err) {
    // Try en-US as fallback
    if (lang !== 'en-US') {
      return loadLocale('en-US');
    }
    return null;
  }
}

/**
 * Generate citations for a single style
 */
async function generateCitationsForStyle(styleId, styleCsl) {
  const citations = [];

  try {
    // Create a citeproc engine with proper locale support
    const sys = {
      retrieveLocale: function(lang) {
        // Return cached locale synchronously if available
        if (localeCache[lang]) {
          return localeCache[lang];
        }
        // Return en-US if available
        if (localeCache['en-US']) {
          return localeCache['en-US'];
        }
        return null;
      },
      retrieveItem: (id) => {
        return EXAMPLE_REFERENCES.find(ref => ref.id === id);
      }
    };

    const citeproc = new CSL.Engine(sys, styleCsl);

    // Generate citation for each reference
    for (let i = 0; i < EXAMPLE_REFERENCES.length; i++) {
      const ref = EXAMPLE_REFERENCES[i];

      try {
        citeproc.updateItems([ref.id]);

        const citation = {
          citationID: `cite-${i}`,
          citationItems: [{ id: ref.id }],
          properties: { noteIndex: i + 1 }
        };

        const result = citeproc.processCitationCluster(citation, [], []);
        const formattedCitations = result[1].map(item => item[1]);

        const bibliography = citeproc.makeBibliography();
        const formattedBibliography = bibliography && bibliography[1]
          ? bibliography[1].join('\n')
          : '';

        citations.push({
          formattedCitations,
          formattedBibliography,
          statusMessage: ''
        });

        citeproc.restoreProcessorState();
      } catch (err) {
        // If citation generation fails for this reference, add error entry
        citations.push({
          formattedCitations: [''],
          formattedBibliography: '',
          statusMessage: `Error: ${err.message}`
        });
      }
    }

    return citations;
  } catch (err) {
    // If style parsing fails entirely, return error for all references
    console.warn(`  Warning: Failed to process ${styleId}: ${err.message}`);
    return EXAMPLE_REFERENCES.map(() => ({
      formattedCitations: [''],
      formattedBibliography: '',
      statusMessage: `Style error: ${err.message}`
    }));
  }
}

/**
 * Main generation function
 */
async function generateLegacyExampleCitations() {
  console.log('Starting legacy example citations generation...');
  console.log('This will take 5-10 minutes for ~2,839 styles.\n');

  // Load example references from exampleData.js
  await loadExampleReferences();

  // Load citeproc
  await loadCiteproc();

  // Preload all available locales (styles can specify any locale via default-locale)
  console.log('Loading all available locales...');
  const localesDir = path.join(LOCALES_DIR);
  const localeFiles = await fs.readdir(localesDir);
  const localeXmlFiles = localeFiles.filter(f => f.startsWith('locales-') && f.endsWith('.xml'));

  let loadedCount = 0;
  for (const file of localeXmlFiles) {
    const lang = file.replace('locales-', '').replace('.xml', '');
    await loadLocale(lang);
    loadedCount++;
  }

  console.log(`✓ Loaded ${loadedCount} locales\n`);

  // Load style index
  let styleIndex;
  try {
    const indexContent = await fs.readFile(STYLE_INDEX, 'utf-8');
    styleIndex = JSON.parse(indexContent);
  } catch (err) {
    console.error('Error: Style index not found. Please run "npm run build:styles" first.');
    process.exit(1);
  }

  console.log(`Processing ${styleIndex.independentStyles} independent styles...\n`);

  // Get list of independent styles
  const independentStyles = [];
  for (const [styleId, masterId] of Object.entries(styleIndex.masterIdFromId)) {
    if (styleId === masterId) {
      independentStyles.push(styleId);
    }
  }

  const exampleCitationsFromMasterId = {};
  let processed = 0;
  let failed = 0;
  const startTime = Date.now();

  // Process styles one at a time to avoid memory issues
  for (const styleId of independentStyles) {
    try {
      // Read the CSL file
      const stylePath = styleId.replace('http://www.zotero.org/styles/', '');
      const cslPath = path.join(STYLES_DIR, `${stylePath}.csl`);

      let styleCsl;
      try {
        styleCsl = await fs.readFile(cslPath, 'utf-8');
      } catch (err) {
        // Try dependent styles directory
        const dependentCslPath = path.join(STYLES_DIR, 'dependent', `${stylePath}.csl`);
        styleCsl = await fs.readFile(dependentCslPath, 'utf-8');
      }

      // Generate citations
      const citations = await generateCitationsForStyle(styleId, styleCsl);
      exampleCitationsFromMasterId[styleId] = citations;

      processed++;

      // Progress reporting
      if (processed % 100 === 0 || processed === independentStyles.length) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (processed / (Date.now() - startTime) * 1000).toFixed(1);
        const remaining = Math.round((independentStyles.length - processed) / rate);

        console.log(`Processed ${processed}/${independentStyles.length} styles (${elapsed}s elapsed, ~${remaining}s remaining)`);
      }

    } catch (err) {
      failed++;
      console.warn(`  Warning: Skipped ${styleId}: ${err.message}`);

      // Add placeholder for failed styles
      exampleCitationsFromMasterId[styleId] = EXAMPLE_REFERENCES.map(() => ({
        formattedCitations: [''],
        formattedBibliography: '',
        statusMessage: 'Style not found or could not be loaded'
      }));
    }
  }

  // Write output file
  const output = {
    exampleCitationsFromMasterId
  };

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const fileSize = (await fs.stat(OUTPUT_FILE)).size;
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(1);

  console.log('\n✓ Legacy example citations generation complete!');
  console.log(`  Processed: ${processed} styles`);
  console.log(`  Failed: ${failed} styles`);
  console.log(`  Time: ${totalTime}s`);
  console.log(`  Output: ${OUTPUT_FILE} (${fileSizeMB} MB)`);
  console.log('\nNote: This file is required for Search by Example functionality.');
}

// Run the generator
generateLegacyExampleCitations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
