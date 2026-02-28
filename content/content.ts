interface GoldProduct {
  name: string
  price: number
  weight?: number
  isGold: boolean
}

interface GoldPrice {
  karat: string
  pricePerGram: number
}

function isGoldProduct(): boolean {
  const title = document.title.toLowerCase()
  const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content')?.toLowerCase() || ''
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')?.toLowerCase() || ''
  const bodyText = document.body.innerText.toLowerCase()

  const goldKeywords = ['gold', 'yellow gold', '18k', '22k', '24k', '14k', '916', '999', '750', '585']

  return goldKeywords.some(keyword =>
    title.includes(keyword) ||
    metaKeywords.includes(keyword) ||
    metaDescription.includes(keyword) ||
    bodyText.includes(keyword)
  )
}

function getProductPrice(): number | null {
  const hostname = window.location.hostname

  let priceSelectors: string[] = []

  if (hostname.includes('myntra.com')) {
    priceSelectors = ['.pdp-price', '.pdp-price strong', '[class*="price"]']
  } else if (hostname.includes('ajio.com')) {
    priceSelectors = ['.price', '.prod-price', '[class*="price"]', '.price-val']
  }

  for (const selector of priceSelectors) {
    const element = document.querySelector(selector)
    if (element) {
      const priceText = element.textContent?.replace(/[₹,]/g, '').trim()
      const price = parseFloat(priceText || '0')
      if (price > 0) return price
    }
  }

  return null
}

function extractGoldWeight(): number | null {
  const bodyText = document.body.innerText.toLowerCase()

  const weightPatterns = [
    /(\d+(?:\.\d+)?)\s*grams?\s*(?:of\s*)?gold/i,
    /(\d+(?:\.\d+)?)\s*g\s*(?:of\s*)?gold/i,
    /(\d+(?:\.\d+)?)\s*gramme?\s*(?:of\s*)?gold/i,
    /gold\s*weight\s*:?\s*(\d+(?:\.\d+)?)\s*grams?/i,
    /net weight\s*:?\s*(\d+(?:\.\d+)?)\s*grams?/i,
    /weight\s*:?\s*(\d+(?:\.\d+)?)\s*grams?/i,
  ]

  for (const pattern of weightPatterns) {
    const match = bodyText.match(pattern)
    if (match && match[1]) {
      const weight = parseFloat(match[1])
      if (weight > 0) return weight
    }
  }

  return null
}

function showRecommendationEmoji(recommendation: string): void {
  const emojiMap: Record<string, string> = {
    buy: '🟢',
    skip: '🔴',
  }

  const emoji = emojiMap[recommendation] || '🟡'

  const existingBadge = document.getElementById('gold-price-extension-badge')
  if (existingBadge) {
    existingBadge.remove()
  }

  const badge = document.createElement('div')
  badge.id = 'gold-price-extension-badge'
  badge.innerHTML = `<span style="font-size: 40px; cursor: help;" title="${recommendation}">${emoji}</span>`

  badge.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    background: white;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `

  document.body.appendChild(badge)
}

function calculateRecommendation(productPrice: number, productWeight: number, goldPricePerGram: number): string {
  if (!productWeight || !goldPricePerGram) {
    return 'skip'
  }

  const productPricePerGram = productPrice / productWeight

  if (productPricePerGram > goldPricePerGram) {
    return 'skip'
  } else {
    return 'buy'
  }
}

async function analyzeProduct(): Promise<void> {
  if (!isGoldProduct()) {
    return
  }

  const productPrice = getProductPrice()
  if (!productPrice) {
    console.log('Could not find product price')
    return
  }

  const goldWeight = extractGoldWeight()
  if (!goldWeight) {
    console.log('Could not determine gold weight')
    showRecommendationEmoji('check')
    return
  }

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getGoldPrice' })

    if (response.success && response.data) {
      const goldPrice: GoldPrice = response.data
      const recommendation = calculateRecommendation(productPrice, goldWeight, goldPrice.pricePerGram)
      showRecommendationEmoji(recommendation)

      console.log('Gold Price Analysis:', {
        productName: document.title,
        productPrice,
        goldWeight,
        productPricePerGram: productPrice / goldWeight,
        marketPricePerGram: goldPrice.pricePerGram,
        recommendation
      })
    } else {
      console.error('Failed to get gold price:', response.error)
      showRecommendationEmoji('check')
    }
  } catch (error) {
    console.error('Error analyzing product:', error)
    showRecommendationEmoji('check')
  }
}

let isAnalyzed = false

function checkAndAnalyze(): void {
  if (!isAnalyzed) {
    setTimeout(() => {
      analyzeProduct()
      isAnalyzed = true
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
