# Gold Price Comparator Chrome Extension

A Chrome extension that helps you compare gold jewelry prices on e-commerce sites (Myntra, Ajio) with real-time market rates from allindiabullion.com.

## Features

- 🔍 **Real-time Gold Prices**: Fetches live 24K gold prices from allindiabullion.com
- 🛍️ **Smart Detection**: Automatically detects gold products on Myntra and Ajio
- 💰 **Price Comparison**: Calculates price per gram and compares with market rates
- 😊 **Visual Recommendations**: 
  - 🟢 **Buy**: Premium < 10% over market price
  - 🟡 **Check**: Premium 10-30% over market price
  - 🔴 **Skip**: Premium > 30% over market price
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

### Option 2: Install from Pre-built Files

1. Download the pre-built files from the [Releases](https://github.com/chatRG/gold-price-extension/releases) page
2. Extract the archive
3. Load the extension in Chrome as described in Option 1, Step 4

## Development

```bash
# Install dependencies
bun install

# Start development server with hot reload
bun run dev

# Build for production
bun run build
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

The extension calculates the premium percentage:

```
premium = ((productPricePerGram - marketPricePerGram) / marketPricePerGram) * 100
```

- **Buy (🟢)**: Premium < 10% - Great deal below typical market premium
- **Check (🟡)**: Premium 10-30% - Reasonable premium, consider other factors
- **Skip (🔴)**: Premium > 30% - Overpriced, better deals likely available

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

## Future Enhancements

- Support for additional e-commerce sites
- Detailed price breakdown (metal value, making charges, GST)
- Historical price tracking and alerts
- Customizable premium thresholds
- Multiple karat options (18K, 22K)
- Support for international gold rates

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
