#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const archiver = require('archiver')

const distDir = path.resolve('dist')
const outputDir = path.resolve('release')
const zipFile = path.join(outputDir, 'gold-price-extension.zip')

console.log('Creating Chrome Extension package...')

// Create release directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

console.log('Building extension...')
execSync('bun run build', { stdio: 'inherit' })

console.log('Creating zip package...')

// Create a file to stream archive data to
const output = fs.createWriteStream(zipFile)
const archive = archiver('zip', { zlib: { level: 9 } })

// Pipe archive data to the file
archive.pipe(output)

// Add entire dist directory
archive.directory(distDir, false)

// Finalize the archive
archive.finalize()

output.on('close', () => {
  console.log(`✅ Extension package created: ${zipFile}`)
  console.log(`   Size: ${archive.pointer()} bytes`)
  console.log(`\nTo install:`)
  console.log(`1. Open chrome://extensions/`)
  console.log(`2. Enable "Developer mode"`)
  console.log(`3. Drag and drop ${path.basename(zipFile)} into the extensions page`)
})

archive.on('error', (err) => {
  console.error('Error creating zip:', err)
  process.exit(1)
})
