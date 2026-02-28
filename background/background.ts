interface GoldPrice {
  pricePerGram: number
  timestamp: number
}

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

function parsePrice(html: string): number | null {
  // JSON-LD is the most reliable source - structured data won't change with UI redesigns
  // Pattern: "name":"24K 999 — per 1g (Retail)","price":"16467"
  const jsonLd = html.match(/"24K 999[^"]*per (?:1\s*)?gram[^"]*"[^}]*"price"\s*:\s*"(\d+)"/i)
    || html.match(/"24K 999[^"]*per 10g[^"]*"[^}]*"price"\s*:\s*"(\d+)"/i)

  if (jsonLd) {
    const price = parseInt(jsonLd[1], 10)
    // If matched "per 10g", divide by 10
    if (jsonLd[0].includes('per 10g')) return price / 10
    return price
  }

  // Fallback: meta description "24K 10g: ₹1,64,672"
  const meta = html.match(/24K\s*10g:\s*₹?([\d,]+)/)
  if (meta) return parseInt(meta[1].replace(/,/g, ''), 10) / 10

  return null
}

async function getGoldPrice(): Promise<GoldPrice> {
  // 1. Check persistent cache
  const { goldPrice: cached } = await chrome.storage.local.get('goldPrice')
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached
  }

  // 2. Fetch from network
  const res = await fetch('https://allindiabullion.com')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const html = await res.text()
  const pricePerGram = parsePrice(html)
  if (!pricePerGram) throw new Error('Could not parse gold price')

  const price: GoldPrice = { pricePerGram, timestamp: Date.now() }
  await chrome.storage.local.set({ goldPrice: price })
  return price
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type !== 'GET_GOLD_PRICE') return false
  getGoldPrice()
    .then(p => reply({ ok: true, pricePerGram: p.pricePerGram }))
    .catch(e => reply({ ok: false, error: e.message }))
  return true // keep message channel open for async reply
})
