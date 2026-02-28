# Gold Price Comparator Chrome Extension

A Chrome extension that helps you compare gold jewelry prices on e-commerce sites (Myntra, Ajio) with real-time market rates from allindiabullion.com.

## Installation

### Option 1: Load Unpacked Extension (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/chatRG/gold-price-extension.git
   cd gold-price-extension
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Build the extension:
   ```bash
   bun run build
   ```

4. Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select `dist` folder in the project directory

### Option 2: Install from GitHub Release

1. Go to [Releases](https://github.com/chatRG/gold-price-extension/releases) page
2. Download `gold-price-extension.zip`
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Drag and drop the zip file into the extensions page

## Development

```bash
# Install dependencies
bun install

# Start development server with hot reload
bun run dev

# Build for production
bun run build

# Create zip package for distribution
bun run package

# Create GitHub release
bun run release
```

## How It Works

1. **Background Service Worker** (`background/background.ts`):
   - Fetches gold prices from allindiabullion.com
   - Parses HTML to extract current 24K gold rate
   - Caches prices for 30 minutes to optimize performance
   - Responds to content script requests for gold prices

2. **Content Script** (`content/content.ts`):
   - Runs on Myntra and Ajio product pages and search listings
   - Detects gold products using keyword matching
   - Extracts product price and weight information
   - Sends request to background script for current gold prices
   - Compares product price per gram with market rates
   - Displays price badges with BUY/SKIP recommendations

## Supported Websites

- ✅ Myntra.com
- ✅ Ajio.com
- ✅ Flipkart.com

## Limitations

- Gold weight extraction is based on text patterns and may not work for all product descriptions
- Product price selectors are optimized for current site layouts and may break if sites change
- Making charges, GST, and brand premiums are not separately calculated
- Only 24K gold rates are used for comparison (jewelry is typically 22K or 18K)

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
