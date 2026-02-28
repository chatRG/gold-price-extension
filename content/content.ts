interface GoldPrice {
  karat: string
  pricePerGram: number
}

function isGoldElement(element: Element): boolean {
  const text = element.textContent?.toLowerCase() || ''
  const goldKeywords = ['gold', 'yellow gold', '18k', '22k', '24k', '14k', '916', '999', '750', '585']
  return goldKeywords.some(keyword => text.includes(keyword))
}

function extractPrice(element: Element): number | null {
  const priceText = element.textContent?.replace(/[₹,]/g, '').trim()
  const price = parseFloat(priceText || '0')
  return price > 0 ? price : null
}

function extractWeight(element: Element): number | null {
  const text = element.textContent?.toLowerCase() || ''
  const weightPatterns = [
    /(\d+(?:\.\d+)?)\s*grams?\s*(?:of\s*)?gold/i,
    /(\d+(?:\.\d+)?)\s*g\s*(?:of\s*)?gold/i,
    /(\d+(?:\.\d+)?)\s*gramme?\s*(?:of\s*)?gold/i,
    /gold\s*weight\s*:?\s*(\d+(?:\.\d+)?)\s*grams?/i,
    /net weight\s*:?\s*(\d+(?:\.\d+)?)\s*grams?/i,
    /weight\s*:?\s*(\d+(?:\.\d+)?)\s*grams?/i,
  ]

  for (const pattern of weightPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const weight = parseFloat(match[1])
      if (weight > 0) return weight
    }
  }

  return null
}

function findProductCards(): Element[] {
  const hostname = window.location.hostname
  let productSelectors: string[] = []

  if (hostname.includes('myntra.com')) {
    productSelectors = [
      '[class*="product"]',
      '[class*="Product"]',
      '[class*="pdp"]',
      'article',
    ]
  } else if (hostname.includes('ajio.com')) {
    productSelectors = [
      '[class*="product"]',
      '[class*="Product"]',
      '[class*="item"]',
      '[class*="card"]',
      'article',
    ]
  } else if (hostname.includes('flipkart.com')) {
    productSelectors = [
      '[class*="product"]',
      '[class*="Product"]',
      '[class*="card"]',
      '[class*="item"]',
      'div[data-id]',
      'article',
    ]
  }

  const allElements: Element[] = []
  for (const selector of productSelectors) {
    const elements = Array.from(document.querySelectorAll(selector))
    allElements.push(...elements)
  }

  return [...new Set(allElements)]
}

function findPriceInCard(card: Element): Element | null {
  const hostname = window.location.hostname
  let priceSelectors: string[] = []

  if (hostname.includes('myntra.com')) {
    priceSelectors = ['.pdp-price', '[class*="price"]']
  } else if (hostname.includes('ajio.com')) {
    priceSelectors = ['.price', '.prod-price', '[class*="price"]', '.price-val']
  } else if (hostname.includes('flipkart.com')) {
    priceSelectors = ['[class*="price"]', '[class*="Price"]', '.Nx9bqj']
  }

  for (const selector of priceSelectors) {
    const element = card.querySelector(selector)
    if (element) {
      return element
    }
  }

  return null
}

function createPriceBadge(
  productPrice: number,
  goldWeight: number,
  goldPricePerGram: number
): HTMLElement {
  const productPricePerGram = productPrice / goldWeight
  const isBuy = productPricePerGram <= goldPricePerGram
  const emoji = isBuy ? '🟢' : '🔴'
  const status = isBuy ? 'BUY' : 'SKIP'
  const color = isBuy ? '#22c55e' : '#ef4444'

  const difference = Math.abs(productPricePerGram - goldPricePerGram)
  const differenceText = isBuy 
    ? `₹${difference.toFixed(2)}/g below market`
    : `₹${difference.toFixed(2)}/g above market`

  const badge = document.createElement('div')
  badge.className = 'gold-price-badge'
  badge.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: white; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border-left: 4px solid ${color}; margin-top: 8px;">
      <span style="font-size: 20px;">${emoji}</span>
      <div style="flex: 1;">
        <div style="font-weight: bold; color: ${color}; font-size: 13px;">${status}</div>
        <div style="font-size: 11px; color: #666;">Market: ₹${goldPricePerGram.toFixed(0)}/g | Prod: ₹${productPricePerGram.toFixed(0)}/g</div>
        <div style="font-size: 11px; color: ${color};">${differenceText}</div>
      </div>
    </div>
  `

  return badge
}

function removeExistingBadges(): void {
  document.querySelectorAll('.gold-price-badge').forEach(badge => badge.remove())
}

async function analyzeCard(card: Element): Promise<void> {
  if (!isGoldElement(card)) {
    return
  }

  const priceElement = findPriceInCard(card)
  if (!priceElement) {
    return
  }

  const productPrice = extractPrice(priceElement)
  if (!productPrice) {
    return
  }

  const goldWeight = extractWeight(card)
  if (!goldWeight) {
    return
  }

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getGoldPrice' })

    if (response.success && response.data) {
      const goldPrice: GoldPrice = response.data
      const badge = createPriceBadge(productPrice, goldWeight, goldPrice.pricePerGram)

      const existingBadge = card.querySelector('.gold-price-badge')
      if (existingBadge) {
        existingBadge.replaceWith(badge)
      } else {
        priceElement.parentElement?.insertBefore(badge, priceElement.nextSibling)
      }

      console.log('Gold Price Analysis:', {
        productName: card.textContent?.substring(0, 50),
        productPrice,
        goldWeight,
        productPricePerGram: productPrice / goldWeight,
        marketPricePerGram: goldPrice.pricePerGram,
      })
    }
  } catch (error) {
    console.error('Error analyzing product:', error)
  }
}

async function analyzePage(): Promise<void> {
  removeExistingBadges()

  const cards = findProductCards()
  if (cards.length === 0) {
    return
  }

  for (const card of cards) {
    await analyzeCard(card)
  }
}

let isAnalyzing = false

function checkAndAnalyze(): void {
  if (!isAnalyzing) {
    isAnalyzing = true
    setTimeout(async () => {
      await analyzePage()
      isAnalyzing = false
    }, 1500)
  }
}

window.addEventListener('load', checkAndAnalyze)
window.addEventListener('hashchange', checkAndAnalyze)
window.addEventListener('popstate', checkAndAnalyze)

const observer = new MutationObserver(() => {
  checkAndAnalyze()
})

observer.observe(document.body, { childList: true, subtree: true })

console.log('Gold Price Extension content script loaded')
