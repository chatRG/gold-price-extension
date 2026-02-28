#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const releaseDir = path.resolve('release')
const zipFile = path.join(releaseDir, 'gold-price-extension.zip')

// Check if release exists
try {
  execSync('gh release view', { stdio: 'ignore' })
  console.log('Release already exists. Creating new tag...')

  // Get current version from package.json
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
  const version = pkg.version
  const tagName = `v${version}`
  
  // Increment patch version
  const versionParts = version.split('.')
  versionParts[2] = parseInt(versionParts[2]) + 1
  const newVersion = versionParts.join('.')
  
  pkg.version = newVersion
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2))
  
  const newTagName = `v${newVersion}`
  execSync(`git tag ${newTagName}`, { stdio: 'inherit' })
  execSync(`git push origin ${newTagName}`, { stdio: 'inherit' })
  
  console.log(`Created new release tag: ${newTagName}`)
} catch (e) {
  console.log('Creating first release...')
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
  const tagName = `v${pkg.version}`
  execSync(`git tag ${tagName}`, { stdio: 'inherit' })
  execSync(`git push origin ${tagName}`, { stdio: 'inherit' })
  console.log(`Created release tag: ${tagName}`)
}

// Create GitHub release
console.log('Creating GitHub release...')

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
const tagName = `v${pkg.version}`

const releaseNotes = `
## Gold Price Comparator v${pkg.version}

### Installation
1. Download \`gold-price-extension.zip\`
2. Open \`chrome://extensions/\` in Chrome
3. Enable "Developer mode" (toggle in top right)
4. Drag and drop the zip file into the extensions page

### Features
- Real-time gold prices from allindiabullion.com
- Gold product detection on Myntra and Ajio
- Price comparison with emoji recommendations
  - 🟢 Buy: Product price ≤ market price
  - 🔴 Skip: Product price > market price

### Supported Sites
- Myntra.com
- Ajio.com
`

// Create release
try {
  execSync(`gh release create ${tagName} ${zipFile} --title "v${pkg.version}" --notes "${releaseNotes}"`, { stdio: 'inherit' })
  console.log(`✅ Release ${tagName} created successfully!`)
  console.log(`📦 Download: https://github.com/chatRG/gold-price-extension/releases/tag/${tagName}`)
} catch (error) {
  console.error('❌ Error creating release:', error.message)
  console.log('\nYou may need to manually create the release:')
  console.log(`1. Push the tag: git push origin ${tagName}`)
  console.log('2. Go to GitHub Releases and create a new release')
  console.log(`3. Upload the zip file from: ${zipFile}`)
}
