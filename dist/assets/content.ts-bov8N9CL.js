(function(){let c=null,f=0;async function x(){const e=Date.now();if(c&&e-f<6e4)return c;console.log("[Gold Price] Requesting price from background...");try{const t=await chrome.runtime.sendMessage({action:"getGoldPrice"});if(t&&t.success&&t.data)return c=t.data.pricePerGram,f=e,console.log("[Gold Price] Received price:",c),c}catch(t){console.error("[Gold Price] Error communicating with background:",t)}return c}function h(e){const t=e.replace(/[₹,Rs.]/gi,"").trim(),n=parseFloat(t);return n>0?n:null}function b(e){const t=[/(\d+(?:\.\d+)?)\s*grams?\s*(?:of\s*)?gold/i,/(\d+(?:\.\d+)?)\s*g\s*(?:of\s*)?gold/i,/gold\s*weight\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,/net\s*weight\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,/weight\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,/(\d+(?:\.\d+)?)\s*g\b/i];for(const n of t){const i=e.match(n);if(i&&i[1]){const o=parseFloat(i[1]);if(o>0&&o<1e3)return o}}return null}function y(){const e=window.location.hostname;let t=[];e.includes("myntra.com")?t=[".product-base",".pdp-main",".pdp-details"]:e.includes("ajio.com")?t=[".item",".prod-content"]:e.includes("flipkart.com")&&(t=["[data-id]",".aMaAEs",".slAVV4",".cPHDOP"]);const n=[];for(const i of t)document.querySelectorAll(i).forEach(o=>n.push(o));return[...new Set(n)]}function w(e){const t=window.location.hostname;let n=[];t.includes("myntra.com")?n=[".product-discountedPrice",".pdp-price","strong"]:t.includes("ajio.com")?n=[".price",".prod-price"]:t.includes("flipkart.com")&&(n=[".Nx9bqj","._30jeq3",".CEmiEU"]);for(const o of n){const r=e.querySelector(o);if(r)return r}const i=Array.from(e.querySelectorAll("*"));for(const o of i)if(o.children.length===0&&o.textContent?.includes("₹"))return o;return null}function P(e,t,n){const i=e/t,o=i<=n,r=o?"🟢":"🔴",s=o?"BUY":"SKIP",l=o?"#22c55e":"#ef4444",d=Math.abs(i-n),p=o?`₹${d.toFixed(2)}/g below market`:`₹${d.toFixed(2)}/g above market`,a=document.createElement("div");return a.className="gold-price-extension-badge",a.style.cssText=`
    display: block !important;
    position: relative !important;
    width: 100% !important;
    min-width: 200px !important;
    margin: 8px 0 !important;
    padding: 8px 12px !important;
    background: white !important;
    border-radius: 6px !important;
    border: 1px solid #e5e7eb !important;
    border-left: 5px solid ${l} !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    z-index: 99999 !important;
    font-family: system-ui, -apple-system, sans-serif !important;
    box-sizing: border-box !important;
  `,a.innerHTML=`
    <div style="display: flex !important; align-items: center !important; gap: 8px !important; background: transparent !important;">
      <span style="font-size: 24px !important; line-height: 1 !important; margin: 0 !important;">${r}</span>
      <div style="display: flex !important; flex-direction: column !important; align-items: flex-start !important; line-height: 1.3 !important; text-align: left !important; background: transparent !important;">
        <span style="font-weight: 800 !important; color: ${l} !important; font-size: 13px !important; margin: 0 !important;">${s}</span>
        <span style="font-size: 11px !important; color: #4b5563 !important; margin: 0 !important; font-weight: normal !important;">Mkt: ₹${n.toFixed(0)}/g | Prod: ₹${i.toFixed(0)}/g</span>
        <span style="font-size: 11px !important; color: ${l} !important; margin: 0 !important; font-weight: 600 !important;">${p}</span>
      </div>
    </div>
  `,a}async function k(){const e=y();if(e.length===0)return;const t=e.filter(o=>!o.querySelector(".gold-price-extension-badge"));if(t.length===0)return;let n=0,i=null;for(const o of t){const r=o.textContent?.toLowerCase()||"";if(!r.includes("gold")&&!r.includes("22k")&&!r.includes("18k")&&!r.includes("24k"))continue;const s=w(o);if(!s)continue;const l=s.textContent||"",d=h(l);if(!d)continue;const p=b(r);if(!p)continue;if(!i&&(i=await x(),!i)){console.warn("[Gold Price] Aborting: Failed to get market price.");return}const a=P(d,p,i);s.parentElement&&(s.insertAdjacentElement("afterend",a),n++)}n>0&&console.log(`[Gold Price] Successfully rendered badges for ${n} products.`)}let m=!1,u=null;function g(){u&&clearTimeout(u),u=window.setTimeout(async()=>{if(!m){m=!0;try{await k()}catch(e){console.error("[Gold Price] Error during analysis:",e)}finally{m=!1}}},1e3)}const E=new MutationObserver(e=>{e.some(n=>n.addedNodes.length>0)&&g()});window.addEventListener("load",()=>setTimeout(g,1500));E.observe(document.body,{childList:!0,subtree:!0});console.log("[Gold Price] Extension loaded and waiting for products...");
})()
