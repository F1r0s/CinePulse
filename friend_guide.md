# 🚀 Complete Guide: Build an OGAds Affiliate Landing Page on Vercel

> **Give this entire document to your AI assistant.** It explains the full project structure, how the API works, and the exact prompt to use to build a similar page.

---

## 📁 Project Structure (5 files total)

```
my-landing-page/
│
├── index.html          ← The main landing page (the "front door")
├── redirect.html       ← A small utility page that redirects users with a spinner
├── package.json        ← Tells Vercel: "this is a Node.js project, use Node 18+"
├── vercel.json         ← Vercel configuration (function timeouts, cache headers)
│
└── api/
    ├── offers.js       ← 🔑 SERVER function: calls OGAds API, returns offers
    └── postback.js     ← 🔑 SERVER function: receives completion signals from OGAds
```

> **Why Vercel?** Vercel hosts static HTML files FOR FREE and also runs **serverless functions** (the `api/` folder). This means your API key stays secret on the server — never visible to users.

---

## 🧠 How The Full System Works (The Mechanic)

```
USER visits index.html
        │
        ▼
[1] User clicks "CLAIM MY COUPON" button
        │
        ▼
[2] JavaScript calls → GET /api/offers  (your Vercel serverless function)
        │
        ▼
[3] api/offers.js runs ON THE SERVER:
    - Reads visitor's IP from request headers
    - Calls OGAds API: https://appsave.store/api/v2?ip=...&user_agent=...
    - Receives a list of offers targeted to that visitor
    - Filters by your WHITELIST (if configured)
    - Returns clean JSON: { success: true, offers: [...] }
        │
        ▼
[4] JavaScript receives the offers and renders them as clickable cards in a modal
        │
        ▼
[5] User clicks an offer → opens in NEW TAB (with rel="noopener" but NOT noreferrer
    so the referrer header is sent to OGAds — this is required for tracking!)
        │
        ▼
[6] User completes the offer on the advertiser's site
        │
        ▼
[7] OGAds detects completion → calls your postback URL:
    GET https://your-domain.vercel.app/api/postback?offer_id=XXX&payout=1.50&ip=...
        │
        ▼
[8] api/postback.js logs the lead and returns { status: "ok" }
        │
        ▼
[9] After 15 seconds on the landing page, the coupon code appears automatically
```

---

## 📄 File-by-File Explanation

### `package.json`
```json
{
  "name": "my-offer-page",
  "version": "1.0.0",
  "engines": {
    "node": ">=18"
  }
}
```
**Purpose:** Tells Vercel to use Node.js 18+. Required for `fetch()` to work natively in the serverless functions (no extra packages needed).

---

### `vercel.json`
```json
{
  "functions": {
    "api/offers.js":   { "maxDuration": 10 },
    "api/postback.js": { "maxDuration": 5  }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, no-cache" }
      ]
    }
  ]
}
```
**Purpose:**
- Sets max execution time for each function (OGAds API can be slow)
- **Disables caching** on all `/api/` routes — CRITICAL! Without this, Vercel might serve the same offers to everyone (offers are targeted by IP, so caching breaks personalization)

---

### `api/offers.js` — THE MOST IMPORTANT FILE

This is a **Vercel Serverless Function**. It runs on the server, never in the browser.

```
FLOW:
1. Read visitor IP from request headers (x-forwarded-for)
2. Read visitor User-Agent
3. Call OGAds API with those values
4. Parse the response
5. Apply whitelist filter (optional)
6. Return max 3 clean offers as JSON
```

**Key variables to customize:**
| Variable | What to change |
|----------|----------------|
| `API_KEY` | Your OGAds API key (format: `affiliateId\|token`) |
| `WHITELISTED_OFFER_IDS` | Array of offer IDs you want to show (empty = show all) |
| `MAX_OFFERS` | How many offers to request from OGAds (default: 10) |

**Why the IP trick works:**
OGAds targets offers by geography. By forwarding the real visitor IP (not the Vercel server IP), OGAds returns offers appropriate for that visitor's country.

**The whitelist logic:**
```
If WHITELISTED_OFFER_IDS is empty:
  → Show top 3 offers from OGAds
If WHITELISTED_OFFER_IDS has IDs:
  → Only show offers whose ID is in your list
  → If none match (wrong country/device), fallback to top 3 anyway
Always return max 3 offers
```

---

### `api/postback.js`

OGAds calls this URL when a user finishes an offer. You set this URL in your OGAds dashboard:
```
Settings → Postback URL → https://YOUR-DOMAIN.vercel.app/api/postback?offer_id={offer_id}&payout={payout}&ip={session_ip}&aff_sub={aff_sub}
```

The `{offer_id}`, `{payout}`, etc. are **OGAds macros** — they fill in the real values automatically.

This function:
1. Reads those values from the query string
2. Logs them to Vercel's function logs
3. Returns `200 OK` (OGAds requires a 200 response, otherwise it retries)

---

### `index.html` — The Landing Page

A single-file landing page with everything inline (CSS + JS + HTML).

**Key parts:**
- **Hero section** — big product image with a "SAVE 50%+" badge
- **How it works** — explains the process to users
- **CTA Button** — "CLAIM MY COUPON" → triggers the modal
- **Modal / Offer Wall** — slides up, loads offers from `/api/offers`
- **Countdown timer** — 15-minute urgency timer
- **Complete banner** — shows coupon code after 15 seconds of offer being started

**Critical JS detail — why `rel="noopener"` but NOT `rel="noreferrer"`:**
```html
<a href="..." target="_blank" rel="noopener">  ✅ CORRECT
<a href="..." target="_blank" rel="noopener noreferrer">  ❌ WRONG
```
Adding `noreferrer` strips the HTTP Referer header, which breaks OGAds tracking. Without referrer data, OGAds can't properly credit your conversion.

---

### `redirect.html`

A simple utility page. When called with `?url=https://...`, it redirects there while showing a spinner. Usage:
```
/redirect.html?url=https://some-offer-link.com
```
This is optional — useful for wrapping offer links through your own domain for cleaner tracking.

---

## 🔑 How to Get Your OGAds API Key

1. Go to [ogads.com](https://ogads.com) → Login
2. Go to **API** section in the sidebar
3. Your key format is: `AFFILIATE_ID|TOKEN`
   Example: `47479|ZiiV01pvJMDm0by3lYH6qX8pyWYwxeQza84XBid95d45c773`
4. Copy this and put it in `api/offers.js` as `API_KEY`

---

## 🚀 How to Deploy

1. Create a GitHub repository and push all 5 files
2. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
3. Click **Deploy** (no build settings needed — Vercel auto-detects everything)
4. Your site is live at `https://your-project-name.vercel.app`
5. Set your postback URL in OGAds dashboard

---

## 🤖 THE AI PROMPT (copy-paste this to your AI)

---

```
I need you to build a CPA affiliate landing page that works with OGAds offer wall. 
Deploy target is Vercel (free tier). No frameworks, no npm packages — just vanilla HTML/CSS/JS 
and two Vercel serverless functions.

## THEME
[DESCRIBE YOUR THEME HERE — e.g. "Amazon gift card giveaway", "Netflix free trial", 
"iPhone 16 giveaway", "Back to school discount", etc.]

## PROJECT STRUCTURE (exactly these 5 files, nothing else)

```
project-root/
├── index.html
├── redirect.html
├── package.json
├── vercel.json
└── api/
    ├── offers.js
    └── postback.js
```

## package.json
Simple, just sets Node version:
```json
{
  "name": "my-offer-page",
  "version": "1.0.0",
  "engines": { "node": ">=18" }
}
```

## vercel.json
Must disable cache on /api/ routes and set function timeouts:
```json
{
  "functions": {
    "api/offers.js":   { "maxDuration": 10 },
    "api/postback.js": { "maxDuration": 5 }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "no-store, no-cache" }]
    }
  ]
}
```

## api/offers.js (Vercel Serverless Function)

This is the most critical file. It MUST:

1. Use `module.exports = async (req, res) => { ... }` syntax (CommonJS, NOT ES modules)
2. Set CORS headers: Access-Control-Allow-Origin: *
3. Handle OPTIONS preflight (return 200)
4. Read visitor IP from: `req.headers['x-forwarded-for']` (first value before comma) 
   OR `req.socket?.remoteAddress`, fallback to '1.1.1.1'
5. Read User-Agent from: `req.headers['user-agent']`
6. Call OGAds API using native fetch() (available in Node 18+):
   URL: `https://appsave.store/api/v2?ip=${clientIp}&user_agent=${userAgent}&max=10`
   Headers: { 'Authorization': 'Bearer YOUR_API_KEY_HERE', 'User-Agent': userAgent, 'X-Forwarded-For': clientIp }
7. Parse the JSON response. The response has shape: { success: boolean, offers: [...] }
8. Apply optional whitelist: const WHITELISTED_OFFER_IDS = []; // add offer IDs or leave empty
   - If whitelist is empty → return top 3 offers
   - If whitelist has IDs → filter to only those offers, fallback to top 3 if none match
9. Map each offer to clean format:
   { offer_id, name, description, image, link, payout, cta: 'START OFFER →' }
   Use these field mappings: 
   - offer_id: offer.offerid || offer.offer_id
   - name: offer.name_short || offer.name
   - description: offer.adcopy || offer.description
   - image: offer.picture || offer.icon
   - link: offer.link || offer.url
   - payout: offer.payout
10. Return: res.status(200).json({ success: true, offers: cleanOffers })
11. On any error: return res.status(200).json({ success: false, offers: [], error: '...' })
    ALWAYS return HTTP 200 even on errors (frontend checks data.success flag)

## api/postback.js (Vercel Serverless Function)

Receives conversion notifications from OGAds. Must:
1. Use `module.exports = function handler(req, res) { ... }` syntax
2. Read from req.query: offer_id, payout, ip, aff_sub, aff_sub2
3. Log the lead data with console.log (visible in Vercel function logs)
4. Return res.status(200).json({ status: 'ok', lead }) — OGAds needs a 200 response

## index.html

A beautiful, mobile-first, dark-themed landing page. Single file with all CSS and JS inline.

Design requirements:
- Dark background (#0F1519 or similar dark navy)
- Amazon orange (#FF9900) as primary accent color
- Inter font from Google Fonts
- Max width 520px, centered
- Has: navbar with logo, hero image section, CTA button, offer wall modal
- Countdown timer (15 minutes) for urgency
- Trust badges (SSL Secured, Verified, Instant Delivery)

The offer wall modal must:
1. Open when user clicks the CTA button
2. Call `fetch('/api/offers')` to load offers
3. Show a loading spinner while fetching
4. Render offer cards with: icon image, name, description, CTA button
5. Each offer link MUST have `target="_blank" rel="noopener"` 
   ⚠️ CRITICAL: do NOT add "noreferrer" — it breaks OGAds tracking by removing the HTTP Referer header
6. When user clicks an offer: show "Offer Started" banner
7. After 15 seconds: hide offers list, show "Coupon Unlocked!" banner with the coupon code
8. Show error state if API fails, with retry button

## redirect.html

Simple utility page:
- Shows a spinner while redirecting
- Reads `?url=` query param
- Calls `window.location.replace(dest)` to redirect
- Has `<meta name="referrer" content="unsafe-url">` to preserve referrer

## My OGAds API Key: [PUT YOUR KEY HERE — format: affiliateId|token]

## Theme/Niche: [DESCRIBE YOUR OFFER — e.g. "Amazon gift card $500", "Free iPhone", etc.]

Please generate all 5 files with beautiful, premium design. The page should look 
convincing and professional with smooth animations, glassmorphism effects where appropriate, 
and a strong call-to-action.
```

---

## ⚠️ Common Mistakes That Break Everything

| Mistake | Why It Breaks | Fix |
|---------|---------------|-----|
| Adding `noreferrer` to offer links | Strips HTTP Referer → OGAds can't track | Use only `rel="noopener"` |
| Caching `/api/offers` | All users get same offers (wrong country) | Add `Cache-Control: no-store` in vercel.json |
| Using ES modules (`import/export`) in api/ | Vercel Node runtime uses CommonJS | Use `module.exports = async (req, res) => {}` |
| Returning HTTP 500 on API errors | Frontend fetch fails entirely | Always return HTTP 200, set `success: false` in JSON |
| Putting API key in index.html | Key visible to everyone in browser | Keep API key ONLY in api/offers.js (server-side) |
| Forgetting `vercel.json` | Functions have default 5s timeout | Always include with `maxDuration` settings |
| Using `fetch()` with Node 16 or lower | fetch not available | Set `"node": ">=18"` in package.json |

---

## 📊 How To Find Your Offer IDs (Whitelist)

1. Login to OGAds dashboard
2. Go to **Offers** section
3. Filter by: Easy offers, your target country, offer type (free trial / app install)
4. Note the **Offer ID** numbers of offers you want
5. Add them to `WHITELISTED_OFFER_IDS` in `api/offers.js`:
   ```js
   const WHITELISTED_OFFER_IDS = [9164, 2993, 12345];
   ```

> **Tip:** Leave the array empty first to test that everything works, then add specific IDs.

---

*Good luck! The key insight is: the HTML is just the pretty face, but the real magic is the `/api/offers.js` serverless function running on the server that keeps your API key safe and forwards the real visitor IP to OGAds for proper geo-targeting.*
