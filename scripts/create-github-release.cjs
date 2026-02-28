#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const releaseDir = path.resolve('release')
const zipFile = path.join(releaseDir, 'gold-price-extension.zip')
const notesFile = path.join(releaseDir, 'release-notes.md')

console.log('Creating GitHub release...')

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
const tagName = `v${pkg.version}`

const releaseNotes = `## Gold Price Comparator v${pkg.version}`

fs.writeFileSync(notesFile, releaseNotes)

// Create release
try {
  execSync(`gh release create ${tagName} "${zipFile}" --title "v${pkg.version}" --notes-file "${notesFile}"`, { stdio: 'inherit' })
  fs.unlinkSync(notesFile)
  console.log(`\n✅ Release ${tagName} created successfully!`)
  console.log(`📦 Download: https://github.com/chatRG/gold-price-extension/releases/tag/${tagName}`)
} catch (error) {
  fs.unlinkSync(notesFile)
  console.error('❌ Error creating release:', error.message)
  console.log('\nYou may need to manually create the release:')
  console.log(`1. Push the tag: git push origin ${tagName}`)
  console.log('2. Go to GitHub Releases and create a new release')
  console.log(`3. Upload the zip file from: ${zipFile}`)
}
