/**
 * Generate individual JSON files for each CSL style instead of one giant JSON file
 * This solves the memory issues and allows for lazy loading
 */

import fs from 'fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { glob } from 'glob';

const CSL_STYLES_PATH = 'external/csl-styles';
const OUTPUT_DIR = 'generated/styles';
const INDEX_FILE = 'generated/styleIndex.json';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: false,
  trimValues: true
});

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

function extractStyleInfo(xmlContent, filePath) {
  try {
    const parsed = parser.parse(xmlContent);
    const style = parsed.style;

    if (!style || !style.info) {
      console.warn(`No style info found in ${filePath}`);
      return null;
    }

    const info = style.info;
    const titleElement = info.title;
    const title = typeof titleElement === 'string'
      ? titleElement
      : titleElement?.['#text'] || 'Untitled';

    // Extract style ID from the <id> element
    const idElement = info.id;
    const styleId = typeof idElement === 'string'
      ? idElement
      : idElement?.['#text'] || '';

    // Check if this is a dependent style
    const links = Array.isArray(info.link) ? info.link : (info.link ? [info.link] : []);
    const independentParentLink = links.find(link =>
      link['@_rel'] === 'independent-parent'
    );

    const masterId = independentParentLink
      ? independentParentLink['@_href']
      : styleId;

    const isDependent = !!independentParentLink;

    return {
      id: styleId,
      title,
      masterId,
      isDependent,
      fileName: path.basename(filePath, '.csl')
    };
  } catch (err) {
    console.error(`Error parsing ${filePath}:`, err.message);
    return null;
  }
}

async function processStyleFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Remove XML comments that might cause parsing issues
    const cleanContent = content.replace(/<!--[\s\S]*?-->/g, '');

    const styleInfo = extractStyleInfo(cleanContent, filePath);
    if (!styleInfo) {
      return null;
    }

    // For independent styles, save the full CSL content
    if (!styleInfo.isDependent) {
      const styleFileName = `${styleInfo.fileName}.json`;
      const outputPath = path.join(OUTPUT_DIR, styleFileName);

      await fs.writeFile(
        outputPath,
        JSON.stringify({
          id: styleInfo.id,
          title: styleInfo.title,
          csl: cleanContent
        }, null, 2)
      );
    }

    return styleInfo;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
    return null;
  }
}

async function generateStyleIndex() {
  console.log('Starting style index generation...\n');

  // Clean and recreate output directory to remove stale files from deleted styles
  try {
    await fs.rm(OUTPUT_DIR, { recursive: true });
  } catch (err) {
    // Directory may not exist yet
  }
  await ensureDir(OUTPUT_DIR);
  await ensureDir(path.dirname(INDEX_FILE));

  // Find all CSL files
  const styleFiles = await glob(`${CSL_STYLES_PATH}/**/*.csl`);
  console.log(`Found ${styleFiles.length} style files\n`);

  // Process all styles
  const styleIndex = {
    masterIdFromId: {},
    styleTitleFromId: {},
    styleFileFromId: {},
    totalStyles: 0,
    independentStyles: 0,
    dependentStyles: 0,
    generatedAt: new Date().toISOString()
  };

  let processed = 0;
  const batchSize = 100;

  for (let i = 0; i < styleFiles.length; i += batchSize) {
    const batch = styleFiles.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(processStyleFile));

    for (const styleInfo of results) {
      if (styleInfo) {
        styleIndex.masterIdFromId[styleInfo.id] = styleInfo.masterId;
        styleIndex.styleTitleFromId[styleInfo.id] = styleInfo.title;
        styleIndex.styleFileFromId[styleInfo.id] = styleInfo.fileName;

        if (styleInfo.isDependent) {
          styleIndex.dependentStyles++;
        } else {
          styleIndex.independentStyles++;
        }

        processed++;
      }
    }

    if ((i + batchSize) % 1000 === 0 || i + batchSize >= styleFiles.length) {
      console.log(`Processed ${Math.min(i + batchSize, styleFiles.length)}/${styleFiles.length} styles...`);
    }
  }

  styleIndex.totalStyles = processed;

  // Write the index file
  await fs.writeFile(INDEX_FILE, JSON.stringify(styleIndex, null, 2));

  console.log('\n✓ Style index generation complete!');
  console.log(`  Total styles: ${styleIndex.totalStyles}`);
  console.log(`  Independent styles: ${styleIndex.independentStyles}`);
  console.log(`  Dependent styles: ${styleIndex.dependentStyles}`);
  console.log(`  Index file: ${INDEX_FILE}`);
  console.log(`  Style files: ${OUTPUT_DIR}/`);
}

// Run the generator
generateStyleIndex().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
