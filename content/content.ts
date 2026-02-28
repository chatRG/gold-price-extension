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
    /net\s*weight\s*:?\s*(\d+(?:\.\d+)?)\s*grams?/i,
    /weight\s*:?\s*(\d+(?:\.\d+)?)\s*grams?/i,
    /(\d+(?:\.\d+)?)\s*g\s*gold/i,
  ]

  for (const pattern of weightPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const weight = parseFloat(match[1])
      if (weight > 0 && weight < 1000) return weight // reasonable weight limit
    }
  }

  return null
}

function findGoldProducts(): Element[] {
  const goldProducts: Element[] = []
  
  // Find all elements that contain gold-related keywords
  const allElements = document.querySelectorAll('*')
  
  for (const el of allElements) {
    // Check if element or its children contain gold keywords
    if (isGoldElement(el)) {
      // Find the parent product card
      let parent = el.closest('[class*="product"]') || 
                   el.closest('[class*="card"]') || 
                   el.closest('[class*="item"]') ||
                   el.closest('article') ||
                   el.closest('li')
      
      if (parent) {
        goldProducts.push(parent as Element)
      }
    }
  }
  
  return [...new Set(goldProducts)]
}

function findPriceInProduct(product: Element): Element | null {
  const hostname = window.location.hostname
  
  let priceSelectors: string[] = []
  
  if (hostname.includes('myntra.com')) {
    priceSelectors = ['.pdp-price', '[class*="price"]', '.sp-key']
  } else if (hostname.includes('ajio.com')) {
    priceSelectors = ['.price', '.prod-price', '[class*="price"]', '.price-val', '.org-price']
  } else if (hostname.includes('flipkart.com')) {
    priceSelectors = ['[class*="price"]', '.Nx9bqj', '[data-id="price"]', '._1vC4OE']
  }
  
  for (const selector of priceSelectors) {
    const element = product.querySelector(selector)
    if (element && extractPrice(element)) {
      return element
    }
  }
  
  return null
}

function findWeightInProduct(product: Element): number | null {
  // Try to find weight in the product element or its children
  const priceEl = findPriceInProduct(product)
  if (priceEl) {
    // Check around the price element
    const context = priceEl.parentElement || priceEl
    const parentText = context?.textContent || ''
    
    const weightPatterns = [
      /(\d+(?:\.\d+)?)\s*grams?\s*(?:of\s*)?gold/i,
      /(\d+(?:\.\d+)?)\s*g\s*(?:of\s*)?gold/i,
      /gold\s*(\d+(?:\.\d+)?)\s*g/i,
      /weight\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,
      /(\d+(?:\.\d+)?)\s*g\s*\.?\s*$/im,
    ]
    
    for (const pattern of weightPatterns) {
      const match = parentText.match(pattern)
      if (match && match[1]) {
        const weight = parseFloat(match[1])
        if (weight > 0 && weight < 1000) return weight
      }
    }
  }
  
  return extractWeight(product)
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
    <div style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: white; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border-left: 4px solid ${color}; margin-top: 4px; font-family: system-ui, sans-serif;">
      <span style="font-size: 18px;">${emoji}</span>
      <div style="flex: 1;">
        <div style="font-weight: bold; color: ${color}; font-size: 12px;">${status}</div>
        <div style="font-size: 10px; color: #666;">Mkt: ₹${goldPricePerGram.toFixed(0)}/g | Prod: ₹${productPricePerGram.toFixed(0)}/g</div>
        <div style="font-size: 10px; color: ${color};">${differenceText}</div>
      </div>
    </div>
  `

  return badge
}

function removeExistingBadges(): void {
  document.querySelectorAll('.gold-price-badge').forEach(badge => badge.remove())
}

async function analyzeProducts(): Promise<void> {
  removeExistingBadges()

  const goldProducts = findGoldProducts()
  console.log('[Gold Price] Found gold products:', goldProducts.length)
  
  if (goldProducts.length === 0) {
    return
  }

  let goldPricePerGram: number | null = null

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getGoldPrice' })
    if (response.success && response.data) {
      goldPricePerGram = response.data.pricePerGram
      console.log('[Gold Price] Market price:', goldPricePerGram)
    }
  } catch (error) {
    console.error('[Gold Price] Error getting price:', error)
  }

  if (!goldPricePerGram) {
    console.log('[Gold Price] Could not get market price')
    return
  }

  for (const product of goldProducts) {
    const priceElement = findPriceInProduct(product)
    if (!priceElement) continue

    const productPrice = extractPrice(priceElement)
    if (!productPrice) continue

    const goldWeight = findWeightInProduct(product)
    if (!goldWeight) continue

    console.log('[Gold Price] Product:', { price: productPrice, weight: goldWeight, perGram: productPrice / goldWeight })

    const badge = createPriceBadge(productPrice, goldWeight, goldPricePerGram)

    const existingBadge = product.querySelector('.gold-price-badge')
    if (existingBadge) {
      existingBadge.replaceWith(badge)
    } else {
      priceElement.parentElement?.insertBefore(badge, priceElement.nextSibling)
    }
  }
}

let isAnalyzing = false

function checkAndAnalyze(): void {
  if (!isAnalyzing) {
    isAnalyzing = true
    setTimeout(async () => {
      await analyzeProducts()
      isAnalyzing = false
    }, 2000)
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
