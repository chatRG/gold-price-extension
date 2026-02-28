# Gold Price Comparator Chrome Extension

A Chrome extension that helps you compare gold jewelry prices on e-commerce sites (Myntra, Ajio) with real-time market rates from allindiabullion.com.

## Features

- 🔍 **Real-time Gold Prices**: Fetches live 24K gold prices from allindiabullion.com
- 🛍️ **Smart Detection**: Automatically detects gold products on Myntra and Ajio
- 💰 **Price Comparison**: Calculates price per gram and compares with market rates
- 😊 **Visual Recommendations**: 
  - 🟢 **Buy**: Product price ≤ market price
  - 🔴 **Skip**: Product price > market price
- ⚡ **30-minute Cache**: Efficiently caches gold prices to reduce API calls

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
   - Select the `dist` folder in the project directory

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
   - Parses the HTML to extract current 24K gold rate
   - Caches prices for 30 minutes to optimize performance
   - Responds to content script requests for gold prices

2. **Content Script** (`content/content.ts`):
   - Runs on Myntra and Ajio product pages
   - Detects if a product contains gold using keyword matching
   - Extracts product price and weight information
   - Sends request to background script for current gold prices
   - Compares product price per gram with market rates
   - Displays an emoji badge in the top-right corner with recommendation

## Price Comparison Logic

The extension calculates the product price per gram:

```
productPricePerGram = productPrice / goldWeight
```

Then compares it with the market price:

- **Buy (🟢)**: `productPricePerGram ≤ marketPricePerGram` - Good deal at or below market rate
- **Skip (🔴)**: `productPricePerGram > marketPricePerGram` - Overpriced compared to market rate

## Supported Websites

- ✅ Myntra.com
- ✅ Ajio.com

## Limitations

- Gold weight extraction is based on text patterns and may not work for all product descriptions
- Product price selectors are optimized for current site layouts and may break if sites change
- Making charges, GST, and brand premiums are not separately calculated
- Only 24K gold rates are used for comparison (jewelry is typically 22K or 18K)

## Tech Stack

- **Build Tool**: Vite 7
- **Extension Framework**: @crxjs/vite-plugin 2.3.0
- **Package Manager**: Bun
- **Language**: TypeScript 5
- **Packaging**: Archiver 7

## Creating Releases

To create a new release with the extension package:

```bash
# Update version in package.json
# Run the release script
bun run release
```

This will:
1. Build the extension
2. Create a zip file in the `release/` directory
3. Create a GitHub release with the zip file attached
4. Tag the release with the version number

## Future Enhancements

- Support for additional e-commerce sites
- Detailed price breakdown (metal value, making charges, GST)
- Historical price tracking and alerts
- Multiple karat options (18K, 22K)
- Support for international gold rates

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
