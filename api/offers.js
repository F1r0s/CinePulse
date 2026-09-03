// ============================================================
// CinePulse — Vercel Serverless Function: /api/offers
// Proxies OGAds API with IP forwarding for correct geo-targeting.
// MUST use CommonJS syntax (module.exports) for Vercel Node runtime.
// ============================================================

// Whitelist: Add specific OGAds offer IDs to only show those.
// Leave empty [] to show all available offers for the visitor's geo.
const WHITELISTED_OFFER_IDS = [];

module.exports = async function handler(req, res) {
  // ── CORS Headers ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ── API Key (hardcoded for reliability) ──
    const token = '47520|e6zCepkeJKVqtjKsz0FSByIPUB9PkHudJNxcrCXU9791003b';

    // ── Extract Real Visitor IP ──
    // x-forwarded-for can be a comma-separated list; take the first (real client IP)
    const rawIp = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '1.1.1.1';
    const clientIp = rawIp.split(',')[0].trim();

    // ── Extract User-Agent ──
    const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

    // ── Build OGAds API URL ──
    const apiUrl = `https://appsave.store/api/v2?ip=${encodeURIComponent(clientIp)}&user_agent=${encodeURIComponent(userAgent)}&max=10`;

    console.log(`[OFFERS] Fetching for IP: ${clientIp} | UA: ${userAgent.substring(0, 60)}...`);

    // ── Fetch from OGAds ──
    // CRITICAL: Forward X-Forwarded-For and User-Agent so OGAds
    // geo-targets correctly (e.g. Morocco, US, etc.)
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Forwarded-For': clientIp,
        'User-Agent': userAgent,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[OFFERS] OGAds API Error:', response.status, data);
      return res.status(200).json({
        success: false,
        offers: [],
        error: 'Upstream API returned an error.'
      });
    }

    // ── Parse offers from response ──
    let allOffers = data.offers || data.data || [];
    if (!Array.isArray(allOffers)) allOffers = [];

    console.log(`[OFFERS] Raw offers received: ${allOffers.length}`);

    // ── Filter disabled offers ──
    allOffers = allOffers.filter(function(o) {
      return !o.disabled && o.status !== 'disabled' && o.enabled !== false && o.is_disabled !== true;
    });

    // ── Whitelist Logic ──
    let finalOffers = allOffers;

    if (WHITELISTED_OFFER_IDS.length > 0) {
      const whitelisted = allOffers.filter(function(o) {
        const id = parseInt(o.offerid || o.offer_id, 10);
        return WHITELISTED_OFFER_IDS.includes(id);
      });

      if (whitelisted.length > 0) {
        finalOffers = whitelisted;
        console.log(`[OFFERS] Whitelist matched: ${whitelisted.length} offers`);
      } else {
        // FALLBACK: Whitelist had IDs but none matched this geo/device
        // Return top 3 from all available offers
        finalOffers = allOffers.slice(0, 3);
        console.log(`[OFFERS] Whitelist miss — falling back to top ${finalOffers.length} offers`);
      }
    } else {
      // No whitelist configured — return top 3
      finalOffers = allOffers.slice(0, 3);
    }

    // ── CRITICAL FALLBACK: Response must NEVER be empty ──
    if (finalOffers.length === 0 && allOffers.length > 0) {
      finalOffers = allOffers.slice(0, 3);
      console.log('[OFFERS] Emergency fallback — using first 3 available offers');
    }

    // ── Map to clean format ──
    const cleanOffers = finalOffers.map(function(offer) {
      return {
        offer_id: offer.offerid || offer.offer_id,
        name: offer.name_short || offer.name || 'Verification Step',
        description: offer.adcopy || offer.description || 'Complete this step to verify.',
        image: offer.picture || offer.icon || '',
        link: offer.link || offer.url || '#',
        payout: offer.payout || '0.00',
        cta: 'START OFFER →',
        boosted: offer.boosted || false
      };
    });

    console.log(`[OFFERS] Returning ${cleanOffers.length} clean offers to frontend`);

    return res.status(200).json({
      success: true,
      offers: cleanOffers
    });

  } catch (error) {
    console.error('[OFFERS] Server Error:', error.message || error);
    return res.status(200).json({
      success: false,
      offers: [],
      error: 'Failed to connect to the offers network.'
    });
  }
};
