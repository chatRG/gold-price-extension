interface GoldPrice {
  karat: string
  pricePer10g: number
  pricePerGram: number
  timestamp: number
}

const CACHE_DURATION = 30 * 60 * 1000

function parseGoldPriceFromHTML(html: string): GoldPrice | null {
  // Try meta description: "24K 10g: ₹1,64,672"
  const metaMatch = html.match(/24K\s*10g:\s*₹?([\d,]+)/)
  
  // Try JSON-LD: "price":"164672" for "24K 999 — per 10g (Retail)"
  const jsonLdMatch = html.match(/"name":\s*"24K 999.*?per 10g.*?"price":\s*"(\d+)"/)
  
  // Try header: "Today's 24K Gold Price: ₹1,64,672 per 10g"
  const headerMatch = html.match(/24K Gold Price:.*?₹([\d,]+)\s*per\s*10g/i)

  let pricePer10g: number | null = null

  if (metaMatch) {
    pricePer10g = parseInt(metaMatch[1].replace(/,/g, ''), 10)
  } else if (jsonLdMatch) {
    pricePer10g = parseInt(jsonLdMatch[1], 10)
  } else if (headerMatch) {
    pricePer10g = parseInt(headerMatch[1].replace(/,/g, ''), 10)
  }

  if (!pricePer10g) {
    return null
  }

  return {
    karat: '24K',
    pricePer10g,
    pricePerGram: pricePer10g / 10,
    timestamp: Date.now()
  }
}

async function fetchGoldPrice(): Promise<GoldPrice> {
  // 1. Check Chrome Storage (persists across service worker restarts)
  const result = await chrome.storage.local.get(['cachedGoldPrice'])
  const cached = result.cachedGoldPrice as GoldPrice | undefined

  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    console.log('[Gold Price Background] Using valid cached price from storage:', cached.pricePerGram)
    return cached
  }

  // 2. Fetch new price if cache is empty or expired
    console.log('[Gold Price Background] Fetching fresh price from network...')
  try {
    const response = await fetch('https://allindiabullion.com', {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    const goldPrice = parseGoldPriceFromHTML(html)

    if (goldPrice) {
      // 3. Save to storage
      await chrome.storage.local.set({ cachedGoldPrice: goldPrice })
      console.log('[Gold Price Background] Successfully fetched and cached new price:', goldPrice.pricePerGram)
      return goldPrice
    }

    throw new Error('Failed to parse gold price from HTML')
  } catch (error) {
    console.error('[Gold Price Background] Error fetching gold price:', error)
    
    // Fallback: return old cache if network fails, even if expired
    if (cached) {
      console.log('[Gold Price Background] Network failed, returning expired cache as fallback.')
      return cached
    }
    throw error
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getGoldPrice') {
    fetchGoldPrice()
      .then(price => sendResponse({ success: true, data: price }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true // Keep channel open for async response
  }
})

console.log('Gold Price Extension background script loaded')
