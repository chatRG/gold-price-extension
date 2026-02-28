# Gold Price Comparator Chrome Extension

Compare gold jewelry prices on Myntra, Ajio, and Flipkart with live 24K market rates from allindiabullion.com.

## Installation

1. Clone and build:
   ```bash
   git clone https://github.com/chatRG/gold-price-extension.git
   cd gold-price-extension
   bun install
   bun run build
   ```

2. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

Or download the zip from [Releases](https://github.com/chatRG/gold-price-extension/releases) and drag it into the extensions page.

## How It Works

- **Background script** fetches the 24K gold rate from allindiabullion.com once and caches it for 30 minutes via `chrome.storage.local`.
- **Content script** runs on product pages. It scans for gold products (must mention "gold" + a karat like 18K/22K/24K), extracts the listed price and weight, then shows a badge:
  - 🟢 **BUY** — product price per gram is at or below market
  - 🔴 **SKIP** — product price per gram is above market
  - Shows market rate, product rate, and the difference

## Supported Sites

- Myntra.com
- Ajio.com
- Flipkart.com

## Limitations

- Weight must appear in the product text in a recognizable format (e.g. "2.5 grams gold")
- Only 24K rate is used for comparison; jewelry is typically 22K/18K so the badge is a rough indicator
- Making charges, GST, and brand premiums are not separated out

## License

ISC
