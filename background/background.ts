interface GoldPrice {
  karat: string
  pricePer10g: number
  pricePerGram: number
  timestamp: number
}

let cachedGoldPrice: GoldPrice | null = null
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
  if (cachedGoldPrice && Date.now() - cachedGoldPrice.timestamp < CACHE_DURATION) {
    return cachedGoldPrice
  }

  try {
    const response = await fetch('https://allindiabullion.com')
    const html = await response.text()
    const goldPrice = parseGoldPriceFromHTML(html)

    if (goldPrice) {
      cachedGoldPrice = goldPrice
      return goldPrice
    }

    throw new Error('Failed to parse gold price')
  } catch (error) {
    console.error('Error fetching gold price:', error)
    throw error
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getGoldPrice') {
    fetchGoldPrice()
      .then(price => sendResponse({ success: true, data: price }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true
  }
})

console.log('Gold Price Extension background script loaded')
