(function(){let l=null,f=0;async function b(){const o=Date.now();if(l&&o-f<6e4)return l;console.log("[Gold Price] Requesting price from background...");try{const t=await chrome.runtime.sendMessage({action:"getGoldPrice"});if(t&&t.success&&t.data)return l=t.data.pricePerGram,f=o,console.log("[Gold Price] Received price:",l),l}catch(t){console.error("[Gold Price] Error communicating with background:",t)}return l}function y(o){const t=o.replace(/[₹,Rs.]/gi,"").trim(),e=parseFloat(t);return e>0?e:null}function w(o){const t=[/(\d+(?:\.\d+)?)\s*grams?\s*(?:of\s*)?gold/i,/(\d+(?:\.\d+)?)\s*g\s*(?:of\s*)?gold/i,/gold\s*weight\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,/net\s*weight\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,/weight\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,/(\d+(?:\.\d+)?)\s*g\b/i];for(const e of t){const i=o.match(e);if(i&&i[1]){const n=parseFloat(i[1]);if(n>0&&n<1e3)return n}}return null}function P(){const o=window.location.hostname;let t=[];o.includes("myntra.com")?t=[".product-base",".pdp-main",".pdp-details"]:o.includes("ajio.com")?t=[".item",".prod-content"]:o.includes("flipkart.com")&&(t=["[data-id]",".aMaAEs",".slAVV4",".cPHDOP"]);const e=[];for(const i of t)document.querySelectorAll(i).forEach(n=>e.push(n));return e.length===0&&e.push(document.body),[...new Set(e)]}function k(o){const t=window.location.hostname;let e=[];t.includes("myntra.com")?e=[".product-discountedPrice",".pdp-price","strong",".product-price"]:t.includes("ajio.com")?e=[".price",".prod-price",".price-val"]:t.includes("flipkart.com")&&(e=[".Nx9bqj","._30jeq3",".CEmiEU",".hl05eU"]);for(const n of e){const r=o.querySelector(n);if(r)return r}const i=Array.from(o.querySelectorAll("*"));for(const n of i)if(n.children.length===0&&(n.textContent?.includes("₹")||n.textContent?.includes("Rs")))return n;return null}function v(o,t,e){const i=o/t,n=i<=e,r=n?"🟢":"🔴",a=n?"BUY":"SKIP",s=n?"#22c55e":"#ef4444",d=Math.abs(i-e),p=n?`₹${d.toFixed(2)}/g below market`:`₹${d.toFixed(2)}/g above market`,c=document.createElement("div");return c.className="gold-price-extension-badge",c.style.cssText=`
    display: block !important;
    position: relative !important;
    width: 100% !important;
    min-width: 200px !important;
    margin: 8px 0 !important;
    padding: 8px 12px !important;
    background: white !important;
    border-radius: 6px !important;
    border: 1px solid #e5e7eb !important;
    border-left: 5px solid ${s} !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    z-index: 99999 !important;
    font-family: system-ui, -apple-system, sans-serif !important;
    box-sizing: border-box !important;
  `,c.innerHTML=`
    <div style="display: flex !important; align-items: center !important; gap: 8px !important; background: transparent !important;">
      <span style="font-size: 24px !important; line-height: 1 !important; margin: 0 !important;">${r}</span>
      <div style="display: flex !important; flex-direction: column !important; align-items: flex-start !important; line-height: 1.3 !important; text-align: left !important; background: transparent !important;">
        <span style="font-weight: 800 !important; color: ${s} !important; font-size: 13px !important; margin: 0 !important;">${a}</span>
        <span style="font-size: 11px !important; color: #4b5563 !important; margin: 0 !important; font-weight: normal !important;">Mkt: ₹${e.toFixed(0)}/g | Prod: ₹${i.toFixed(0)}/g</span>
        <span style="font-size: 11px !important; color: ${s} !important; margin: 0 !important; font-weight: 600 !important;">${p}</span>
      </div>
    </div>
  `,c}async function G(){const o=P();if(o.length===0){console.log("[Gold Price] No product containers found on this page.");return}const t=o.filter(r=>!r.querySelector(".gold-price-extension-badge"));if(t.length===0)return;let e=0,i=null,n={notGold:0,noPrice:0,noWeight:0};for(const r of t){const a=r.textContent?.toLowerCase()||"";if(!a.includes("gold")&&!a.includes("22k")&&!a.includes("18k")&&!a.includes("24k")){n.notGold++;continue}const s=k(r);if(!s){n.noPrice++;continue}const d=s.textContent||"",p=y(d);if(!p){n.noPrice++;continue}const c=w(a);if(!c){n.noWeight++;continue}if(!i&&(i=await b(),!i)){console.warn("[Gold Price] Aborting: Failed to get market price.");return}const h=v(p,c,i),g=s.closest("div")||s.parentElement;g&&(g.insertAdjacentElement("afterend",h),e++)}e>0?console.log(`[Gold Price] Successfully rendered badges for ${e} products.`):console.log(`[Gold Price] Found ${t.length} containers, but skipped all:`,n)}let m=!1,u=null;function x(){u&&clearTimeout(u),u=window.setTimeout(async()=>{if(!m){m=!0;try{await G()}catch(o){console.error("[Gold Price] Error during analysis:",o)}finally{m=!1}}},1e3)}const E=new MutationObserver(o=>{o.some(e=>e.addedNodes.length>0)&&x()});window.addEventListener("load",()=>setTimeout(x,1500));E.observe(document.body,{childList:!0,subtree:!0});console.log("[Gold Price] Extension loaded and waiting for products...");
})()
