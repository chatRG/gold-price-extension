interface GoldPrice {
  karat: string
  pricePerGram: number
}

// Global cache in the content script so we NEVER ask background script repeatedly
let inMemoryMarketPrice: number | null = null;
let lastFetchTimestamp = 0;

// Fetch ONLY ONCE per minute from background script
async function getMarketPrice(): Promise<number | null> {
  const now = Date.now();
  if (inMemoryMarketPrice && (now - lastFetchTimestamp < 60000)) {
    return inMemoryMarketPrice;
  }

  console.log('[Gold Price] Requesting price from background...');
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getGoldPrice' });
    if (response && response.success && response.data) {
      inMemoryMarketPrice = response.data.pricePerGram;
      lastFetchTimestamp = now;
      console.log('[Gold Price] Received price:', inMemoryMarketPrice);
      return inMemoryMarketPrice;
    }
  } catch (error) {
    console.error('[Gold Price] Error communicating with background:', error);
  }
  return inMemoryMarketPrice;
}

// Extracts price (e.g., "₹ 24,999" -> 24999)
function extractPriceFromText(text: string): number | null {
  const match = text.replace(/[₹,Rs.]/gi, '').trim();
  const price = parseFloat(match);
  return price > 0 ? price : null;
}

// Extracts weight (e.g., "10.5g" -> 10.5)
function extractWeightFromText(text: string): number | null {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*grams?\s*(?:of\s*)?gold/i,
    /(\d+(?:\.\d+)?)\s*g\s*(?:of\s*)?gold/i,
    /gold\s*weight\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,
    /net\s*weight\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,
    /weight\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,
    /(\d+(?:\.\d+)?)\s*g\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const weight = parseFloat(match[1]);
      if (weight > 0 && weight < 1000) return weight;
    }
  }
  return null;
}

function findProductContainers(): Element[] {
  const host = window.location.hostname;
  let selectors: string[] = [];

  if (host.includes('myntra.com')) {
    selectors = [
      '.product-base',       // Search list
      '.pdp-main',          // Product detail page
      '.pdp-details'        // Product detail alternate
    ];
  } else if (host.includes('ajio.com')) {
    selectors = [
      '.item',              // Search list
      '.prod-content'       // Product detail page
    ];
  } else if (host.includes('flipkart.com')) {
    selectors = [
      '[data-id]',          // Search list
      '.aMaAEs',            // Product detail page
      '.slAVV4',            // Search list alternative
      '.cPHDOP'             // Search list alternative
    ];
  }

  const containers: Element[] = [];
  for (const sel of selectors) {
    document.querySelectorAll(sel).forEach(el => containers.push(el));
  }

  // Fallback: If no specific containers found, treat the whole body as one container for PDPs
  if (containers.length === 0) {
    containers.push(document.body);
  }

  return [...new Set(containers)];
}

function getPriceElement(container: Element): Element | null {
  const host = window.location.hostname;
  let selectors: string[] = [];

  if (host.includes('myntra.com')) {
    selectors = ['.product-discountedPrice', '.pdp-price', 'strong', '.product-price'];
  } else if (host.includes('ajio.com')) {
    selectors = ['.price', '.prod-price', '.price-val'];
  } else if (host.includes('flipkart.com')) {
    selectors = ['.Nx9bqj', '._30jeq3', '.CEmiEU', '.hl05eU'];
  }

  for (const sel of selectors) {
    const el = container.querySelector(sel);
    if (el) return el;
  }

  // Fallback: search for elements containing ₹ or Rs
  const elements = Array.from(container.querySelectorAll('*'));
  for (const el of elements) {
    if (el.children.length === 0 && (el.textContent?.includes('₹') || el.textContent?.includes('Rs'))) {
      return el;
    }
  }
  return null;
}

function createBadge(productPrice: number, goldWeight: number, marketPrice: number): HTMLElement {
  const productPricePerGram = productPrice / goldWeight;
  const isBuy = productPricePerGram <= marketPrice;
  const emoji = isBuy ? '🟢' : '🔴';
  const status = isBuy ? 'BUY' : 'SKIP';
  const color = isBuy ? '#22c55e' : '#ef4444';

  const diff = Math.abs(productPricePerGram - marketPrice);
  const diffText = isBuy 
    ? `₹${diff.toFixed(2)}/g below market`
    : `₹${diff.toFixed(2)}/g above market`;

  const badge = document.createElement('div');
  badge.className = 'gold-price-extension-badge';
  // Use aggressive styling to ensure visibility
  badge.style.cssText = `
    display: block !important;
    position: relative !important;
    width: 100% !important;
    min-width: 200px !important;
    margin: 8px 0 !important;
    padding: 8px 12px !important;
    background: white !important;
    border-radius: 6px !important;
    border: 1px solid #e5e7eb !important;
    border-left: 5px solid ${color} !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    z-index: 99999 !important;
    font-family: system-ui, -apple-system, sans-serif !important;
    box-sizing: border-box !important;
  `;

  badge.innerHTML = `
    <div style="display: flex !important; align-items: center !important; gap: 8px !important; background: transparent !important;">
      <span style="font-size: 24px !important; line-height: 1 !important; margin: 0 !important;">${emoji}</span>
      <div style="display: flex !important; flex-direction: column !important; align-items: flex-start !important; line-height: 1.3 !important; text-align: left !important; background: transparent !important;">
        <span style="font-weight: 800 !important; color: ${color} !important; font-size: 13px !important; margin: 0 !important;">${status}</span>
        <span style="font-size: 11px !important; color: #4b5563 !important; margin: 0 !important; font-weight: normal !important;">Mkt: ₹${marketPrice.toFixed(0)}/g | Prod: ₹${productPricePerGram.toFixed(0)}/g</span>
        <span style="font-size: 11px !important; color: ${color} !important; margin: 0 !important; font-weight: 600 !important;">${diffText}</span>
      </div>
    </div>
  `;

  return badge;
}

async function runAnalysis() {
  const containers = findProductContainers();
  if (containers.length === 0) {
    console.log('[Gold Price] No product containers found on this page.');
    return;
  }

  const unbadgedContainers = containers.filter(c => !c.querySelector('.gold-price-extension-badge'));
  if (unbadgedContainers.length === 0) return;

  let processedCount = 0;
  let marketPrice: number | null = null;
  let skippedReasons: Record<string, number> = {
    notGold: 0,
    noPrice: 0,
    noWeight: 0
  };

  for (const container of unbadgedContainers) {
    const textContext = container.textContent?.toLowerCase() || '';
    
    // Only process if it explicitly mentions gold
    if (!textContext.includes('gold') && !textContext.includes('22k') && !textContext.includes('18k') && !textContext.includes('24k')) {
      skippedReasons.notGold++;
      continue;
    }

    const priceEl = getPriceElement(container);
    if (!priceEl) {
      skippedReasons.noPrice++;
      continue;
    }

    const priceText = priceEl.textContent || '';
    const price = extractPriceFromText(priceText);
    if (!price) {
      skippedReasons.noPrice++;
      continue;
    }

    const weight = extractWeightFromText(textContext);
    if (!weight) {
      skippedReasons.noWeight++;
      continue;
    }

    // We found a valid gold product! Only fetch market price NOW if we haven't already.
    if (!marketPrice) {
      marketPrice = await getMarketPrice();
      if (!marketPrice) {
        console.warn('[Gold Price] Aborting: Failed to get market price.');
        return;
      }
    }

    const badge = createBadge(price, weight, marketPrice);
    
    // Some e-commerce sites heavily constrain spans/divs inside prices.
    // Insert just outside the price element to ensure it's visible.
    const insertTarget = priceEl.closest('div') || priceEl.parentElement;
    if (insertTarget) {
      insertTarget.insertAdjacentElement('afterend', badge);
      processedCount++;
    }
  }

  if (processedCount > 0) {
    console.log(`[Gold Price] Successfully rendered badges for ${processedCount} products.`);
  } else {
    console.log(`[Gold Price] Found ${unbadgedContainers.length} containers, but skipped all:`, skippedReasons);
  }
}

// Ensure the analysis runs safely
let isRunning = false;
let runTimeout: number | null = null;

function triggerAnalysis() {
  if (runTimeout) clearTimeout(runTimeout);
  runTimeout = window.setTimeout(async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await runAnalysis();
    } catch (e) {
      console.error('[Gold Price] Error during analysis:', e);
    } finally {
      isRunning = false;
    }
  }, 1000); // Wait 1s for DOM to settle
}

// Observe DOM for infinite scrolling/dynamic content
const observer = new MutationObserver((mutations) => {
  // Only trigger on added nodes to avoid infinite loops when we add our own badge
  const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0);
  if (hasAddedNodes) {
    triggerAnalysis();
  }
});

// Initial runs
window.addEventListener('load', () => setTimeout(triggerAnalysis, 1500));
observer.observe(document.body, { childList: true, subtree: true });

console.log('[Gold Price] Extension loaded and waiting for products...');
