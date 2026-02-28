// ─── State ───────────────────────────────────────────────────────
let marketPrice: number | null = null
let fetched = false
const BADGE_CLASS = 'gpc-badge'

// ─── Fetch market price exactly once ─────────────────────────────
async function fetchMarketPrice(): Promise<number | null> {
  if (fetched) return marketPrice
  fetched = true

  try {
    const res = await chrome.runtime.sendMessage({ type: 'GET_GOLD_PRICE' })
    if (res?.ok) {
      marketPrice = res.pricePerGram
      console.log('[GPC] Market gold price: ₹' + marketPrice + '/g')
    } else {
      console.error('[GPC] Background error:', res?.error)
    }
  } catch (e) {
    console.error('[GPC] Failed to contact background:', e)
  }
  return marketPrice
}

// ─── Extract price from text like "₹24,999" or "Rs. 1,299" ─────
function parsePrice(text: string): number | null {
  // Find the first price-like pattern: ₹ or Rs followed by digits
  const m = text.match(/(?:₹|Rs\.?\s*)([\d,]+(?:\.\d+)?)/)
  if (!m) return null
  const n = parseFloat(m[1].replace(/,/g, ''))
  return n > 0 ? n : null
}

// ─── Extract gold weight from text ──────────────────────────────
// Must appear near the word "gold" or "weight" to avoid false matches
function parseWeight(text: string): number | null {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:grams?|gms?)\s+(?:of\s+)?gold/i,
    /gold\s+weight\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:grams?|gms?|g\b)/i,
    /net\s+weight\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:grams?|gms?|g\b)/i,
    /weight\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:grams?|gms?|g\b)/i,
    /(\d+(?:\.\d+)?)\s*(?:grams?|gms?)\s+gold/i,
    /(\d+(?:\.\d+)?)\s*g\s+(?:of\s+)?gold/i,
  ]

  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const w = parseFloat(m[1])
      if (w > 0.1 && w < 500) return w  // sane range for jewelry
    }
  }
  return null
}

// ─── Check if text mentions gold jewelry ────────────────────────
function isGoldProduct(text: string): boolean {
  const lower = text.toLowerCase()
  // Must contain "gold" AND a karat indicator to avoid false positives
  // OR contain specific karat mentions
  return (
    (lower.includes('gold') && /\b(14|18|22|24)\s*k/i.test(lower)) ||
    (lower.includes('gold') && /\b(585|750|916|999)\b/.test(lower)) ||
    (/\b(14|18|22|24)\s*k(?:t|arat)?\b/i.test(lower) && lower.includes('gold'))
  )
}

// ─── Create the badge element ───────────────────────────────────
function createBadge(productPrice: number, weight: number, mktPrice: number): HTMLElement {
  const prodPerGram = productPrice / weight
  const isBuy = prodPerGram <= mktPrice
  const color = isBuy ? '#16a34a' : '#dc2626'
  const label = isBuy ? 'BUY' : 'SKIP'
  const emoji = isBuy ? '🟢' : '🔴'
  const diff = Math.abs(prodPerGram - mktPrice)
  const direction = isBuy ? 'below' : 'above'

  const el = document.createElement('div')
  el.className = BADGE_CLASS
  el.style.cssText = `
    display:flex!important;align-items:center!important;gap:8px!important;
    margin:6px 0!important;padding:6px 10px!important;
    background:#fff!important;border-radius:6px!important;
    border-left:4px solid ${color}!important;
    box-shadow:0 1px 4px rgba(0,0,0,.12)!important;
    font:12px/1.4 system-ui,sans-serif!important;
    width:fit-content!important;z-index:99999!important;
    color:#333!important;
  `
  el.innerHTML = `
    <span style="font-size:18px">${emoji}</span>
    <div>
      <b style="color:${color}">${label}</b>
      <span style="color:#666"> Mkt ₹${mktPrice.toFixed(0)}/g · Prod ₹${prodPerGram.toFixed(0)}/g</span><br>
      <span style="color:${color};font-weight:600">₹${diff.toFixed(0)}/g ${direction} market</span>
    </div>
  `
  return el
}

// ─── Find price element inside a container ──────────────────────
function findPriceEl(container: Element): Element | null {
  // Walk leaf nodes looking for ₹ or Rs pattern
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return /(?:₹|Rs\.?\s*)\d/.test(node.textContent || '')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    }
  })

  const first = walker.nextNode()
  return first?.parentElement || null
}

// ─── Main scan ──────────────────────────────────────────────────
async function scan() {
  const pageText = document.body.innerText
  if (!isGoldProduct(pageText)) return  // fast exit: page has no gold

  const price = await fetchMarketPrice()
  if (!price) return

  // Find all leaf-level product containers by looking for price elements
  // then walking UP to find a reasonable container boundary
  const priceEls = document.querySelectorAll('*')
  const processed = new Set<Element>()

  for (const el of priceEls) {
    // Skip non-leaf, already-processed, or our own badges
    if (el.children.length > 0) continue
    if (!el.textContent || !/(?:₹|Rs\.?\s*)\d/.test(el.textContent)) continue

    // Walk up to find the product card boundary
    let card: Element | null = el
    for (let i = 0; i < 8 && card; i++) {
      card = card.parentElement
      if (!card) break
      // Stop at a reasonable card boundary
      const tag = card.tagName.toLowerCase()
      if (tag === 'li' || tag === 'article') break
      if (tag === 'a' && card.getAttribute('href')) break
      if (tag === 'div') {
        const cls = card.className.toLowerCase()
        if (/product|card|item|result|listing/.test(cls)) break
      }
    }

    if (!card || card === document.body || processed.has(card)) continue
    if (card.querySelector('.' + BADGE_CLASS)) continue
    processed.add(card)

    const cardText = card.innerText || card.textContent || ''
    if (!isGoldProduct(cardText)) continue

    const priceEl = findPriceEl(card)
    if (!priceEl) continue

    const productPrice = parsePrice(priceEl.textContent || '')
    if (!productPrice) continue

    const weight = parseWeight(cardText)
    if (!weight) continue

    const badge = createBadge(productPrice, weight, price)
    priceEl.after(badge)
  }
}

// ─── Entry point: run once after page settles ───────────────────
let hasRun = false

function run() {
  if (hasRun) return
  hasRun = true
  // Give SPAs time to render
  setTimeout(scan, 2000)
}

// For initial page load
if (document.readyState === 'complete') {
  run()
} else {
  window.addEventListener('load', run)
}

// For SPA navigation (Myntra, Ajio use client-side routing)
let lastUrl = location.href
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    hasRun = false
    run()
  }
}).observe(document.body, { childList: true, subtree: true })
