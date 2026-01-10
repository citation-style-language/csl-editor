/**
 * Generate example citations for each independent style
 * This creates small individual JSON files instead of one giant file
 * Citations are generated on-demand during the build process
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STYLE_INDEX = 'generated/styleIndex.json';
const STYLES_DIR = 'generated/styles';
const CITATIONS_OUTPUT_DIR = 'generated/citations';

// Example references from exampleData.js - hardcoded for now
// In a full implementation, we'd import this from the actual module
const EXAMPLE_REFERENCES = [
  {
    "id": "ITEM-1",
    "type": "chapter",
    "title": "Firms and the welfare state: When, why, and how does social policy matter to employers?",
    "container-title": "Varieties of capitalism. The institutional foundations of comparative advantage",
    "publisher": "Oxford University Press",
    "publisher-place": "New York",
    "page": "184-213",
    "author": [
      { "family": "Mares", "given": "Isabela" }
    ],
    "editor": [
      { "family": "Hall", "given": "Peter A." },
      { "family": "Soskice", "given": "David" }
    ],
    "issued": { "date-parts": [["2001"]] }
  },
  {
    "id": "ITEM-2",
    "type": "article-journal",
    "title": "The varieties of capitalism and hybrid success",
    "container-title": "Comparative Political Studies",
    "page": "307-332",
    "volume": "40",
    "issue": "3",
    "author": [
      { "family": "Campbell", "given": "John L." },
      { "family": "Pedersen", "given": "Ove K." }
    ],
    "issued": { "date-parts": [["2007"]] }
  },
  {
    "id": "ITEM-3",
    "type": "book",
    "title": "Diffusion of innovations",
    "publisher": "Free Press",
    "publisher-place": "New York",
    "edition": "5",
    "author": [
      { "family": "Rogers", "given": "Everett M." }
    ],
    "issued": { "date-parts": [["2003"]] }
  }
];

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

/**
 * This is a placeholder for the actual citation generation
 * In the real implementation, we would:
 * 1. Load citeproc.js
 * 2. Initialize it with the style CSL
 * 3. Generate citations for each reference
 *
 * For now, we'll create a simple structure that can be populated
 * later or on-demand in the browser
 */
async function generateExampleCitationsForStyle(styleId, styleFileName) {
  // For now, create a placeholder structure
  // The actual generation will happen in the browser using citeproc.js
  const citationData = {
    styleId,
    generated: false,
    references: EXAMPLE_REFERENCES.map(ref => ref.id),
    note: "Citations generated on-demand in browser"
  };

  const outputPath = path.join(CITATIONS_OUTPUT_DIR, `${styleFileName}.json`);
  await fs.writeFile(outputPath, JSON.stringify(citationData, null, 2));

  return citationData;
}

async function generateAllExampleCitations() {
  console.log('Starting example citations generation...\n');

  // Ensure output directory exists
  await ensureDir(CITATIONS_OUTPUT_DIR);

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
      const fileName = styleIndex.styleFileFromId[styleId];
      independentStyles.push({ styleId, fileName });
    }
  }

  // Process in batches to avoid overwhelming the system
  const batchSize = 100;
  let processed = 0;

  for (let i = 0; i < independentStyles.length; i += batchSize) {
    const batch = independentStyles.slice(i, i + batchSize);

    await Promise.all(
      batch.map(({ styleId, fileName }) =>
        generateExampleCitationsForStyle(styleId, fileName)
      )
    );

    processed += batch.length;

    if ((i + batchSize) % 1000 === 0 || i + batchSize >= independentStyles.length) {
      console.log(`Processed ${Math.min(i + batchSize, independentStyles.length)}/${independentStyles.length} styles...`);
    }
  }

  console.log('\n✓ Example citations generation complete!');
  console.log(`  Processed ${processed} independent styles`);
  console.log(`  Output directory: ${CITATIONS_OUTPUT_DIR}/`);
  console.log('\nNote: Actual citation generation happens on-demand in the browser.');
}

// Run the generator
generateAllExampleCitations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
