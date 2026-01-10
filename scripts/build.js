/**
 * Main build script that orchestrates the entire build process
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> Running: ${command} ${args.join(' ')}\n`);

    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '..')
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function build() {
  console.log('========================================');
  console.log('CSL Editor Build Process');
  console.log('========================================\n');

  try {
    // Step 1: Generate style index and individual style files
    console.log('Step 1: Generating style index...');
    await runCommand('node', ['scripts/generateStyleIndex.js']);

    // Step 2: Generate example citations (placeholder structure)
    console.log('\nStep 2: Generating example citations...');
    await runCommand('node', ['scripts/generateExampleCitations.js']);

    // Step 3: Generate CSL schema (if Java is available)
    console.log('\nStep 3: Generating CSL schema...');
    try {
      await runCommand('java', [
        '-jar',
        'external/trang/trang.jar',
        'external/csl-schema/schemas/styles/csl.rnc',
        'generated/csl-schema/csl.rng'
      ]);
    } catch (err) {
      console.warn('Warning: Could not generate schema (Java not available?). Skipping...');
    }

    // Step 4: Build the library with Vite
    console.log('\nStep 4: Building library with Vite...');
    await runCommand('vite', ['build']);

    console.log('\n========================================');
    console.log('✓ Build complete!');
    console.log('========================================\n');
  } catch (err) {
    console.error('\n✗ Build failed:', err.message);
    process.exit(1);
  }
}

build();
