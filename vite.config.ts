import { crx, ManifestV3Export } from '@crxjs/vite-plugin'
import { defineConfig } from 'vite'
import manifest from './manifest.json'

const manifestTyped = manifest as ManifestV3Export

export default defineConfig({
  plugins: [
    crx({
      manifest: manifestTyped,
    }),
  ],
})
