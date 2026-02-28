interface GoldPrice {
  karat: string
  pricePer10g: number
  pricePerGram: number
  timestamp: number
}

let cachedGoldPrice: GoldPrice | null = null
const CACHE_DURATION = 30 * 60 * 1000

function parseGoldPriceFromHTML(html: string): GoldPrice | null {
  const retailGoldMatch = html.match(/RETAIL 999GOLD₹([\d,]+)/)
  const karat24Match = html.match(/24K([\d,]+)per 10g/)

  let pricePer10g: number | null = null

  if (retailGoldMatch) {
    pricePer10g = parseInt(retailGoldMatch[1].replace(/,/g, ''), 10)
  } else if (karat24Match) {
    pricePer10g = parseInt(karat24Match[1].replace(/,/g, ''), 10)
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
