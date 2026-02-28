#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const distDir = path.resolve('dist')
const outputDir = path.resolve('release')
const crxFile = path.join(outputDir, 'gold-price-extension.crx')

console.log('Creating Chrome Extension (.crx) package...')

// Create release directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Create a zip file (Chrome can load zipped extensions as .crx)
const zipFile = path.join(outputDir, 'gold-price-extension.zip')

console.log('Building extension...')
execSync('bun run build', { stdio: 'inherit' })

console.log('Creating zip package...')
execSync(`cd ${distDir} && zip -r ../${path.basename(zipFile)} .`, { stdio: 'inherit' })

// Rename zip to crx
fs.renameSync(zipFile, crxFile)

console.log(`✅ Extension package created: ${crxFile}`)
console.log(`\nTo install:`)
console.log(`1. Open chrome://extensions/`)
console.log(`2. Enable "Developer mode"`)
console.log(`3. Drag and drop ${path.basename(crxFile)} into the extensions page`)
