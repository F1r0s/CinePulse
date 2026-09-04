module.exports = async (req, res) => {
  // ── CORS Headers ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Configuration ──
  const API_KEY = '47558|DluqLUTirEcifKUEHLp0wrBpqTebJR7XbTqwtkL666b7e813';
  const API_ENDPOINT = 'https://lockerpreview.com/api/v2';
  const MAX_OFFERS = 50; // Query full pool to find highest payout offers
  const RETURN_OFFERS = 2; // Return top 2 offers to frontend

  // Optional: whitelist specific offer IDs (leave empty to show all)
  const WHITELISTED_OFFER_IDS = [];

  try {
    // ── Get visitor IP ──
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    let clientIp = '1.1.1.1';

    if (forwarded) {
      clientIp = forwarded.split(',')[0].trim();
    } else if (realIp) {
      clientIp = realIp.trim();
    } else if (req.socket && req.socket.remoteAddress) {
      clientIp = req.socket.remoteAddress;
    }

    // Fallback for local development and private ranges
    if (!clientIp || clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.')) {
      clientIp = '1.1.1.1';
    }

    // ── Get User-Agent ──
    const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

    // ── Call OGAds API ──
    const apiUrl = `${API_ENDPOINT}?ip=${encodeURIComponent(clientIp)}&user_agent=${encodeURIComponent(userAgent)}&max=${MAX_OFFERS}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': userAgent,
        'X-Forwarded-For': clientIp
      }
    });

    const data = await response.json();

    if (!data || !data.success) {
      console.error('OGAds API returned unsuccessful:', JSON.stringify(data));
      return res.status(200).json({
        success: false,
        offers: [],
        error: 'No offers available for your region'
      });
    }

    let offers = data.offers || [];

    // ── Apply whitelist filter if configured ──
    if (WHITELISTED_OFFER_IDS.length > 0) {
      const filtered = offers.filter(offer => {
        const offerId = parseInt(offer.offerid || offer.offer_id, 10);
        return WHITELISTED_OFFER_IDS.includes(offerId);
      });
      if (filtered.length > 0) {
        offers = filtered;
      }
    }

    // ── Prioritize Boosted Offers & Sort by Highest Payout First ──
    // 1. If boosted offers exist, put boosted offers first.
    // 2. Within boosted offers (and within non-boosted), sort strictly by payout descending.
    offers.sort((a, b) => {
      const aBoost = (a.boosted === true || a.boosted === 1 || a.boosted === 'true') ? 1 : 0;
      const bBoost = (b.boosted === true || b.boosted === 1 || b.boosted === 'true') ? 1 : 0;

      if (bBoost !== aBoost) {
        return bBoost - aBoost; // Boosted offers come first
      }

      const payA = parseFloat(a.payout) || 0;
      const payB = parseFloat(b.payout) || 0;
      return payB - payA; // Highest payout in first position
    });

    // ── Map to clean format & limit to top offers ──
    const limit = parseInt(req.query && req.query.limit, 10) || RETURN_OFFERS;
    const cleanOffers = offers.slice(0, limit).map((offer, index) => ({
      offer_id: offer.offerid || offer.offer_id,
      name: offer.name_short || offer.name,
      description: offer.adcopy || offer.description || 'Complete this offer to continue',
      image: offer.picture || offer.icon || '',
      link: offer.link || offer.url,
      payout: offer.payout || '0.00',
      boosted: Boolean(offer.boosted === true || offer.boosted === 1 || offer.boosted === 'true'),
      cta: 'START OFFER →',
      step: index + 1
    }));

    console.log(`[offers] IP: ${clientIp} | Found ${offers.length} offers | Returning top ${cleanOffers.length} offers (Highest payout: $${cleanOffers[0] ? cleanOffers[0].payout : '0'}, Boosted: ${cleanOffers[0] ? cleanOffers[0].boosted : false})`);

    return res.status(200).json({
      success: true,
      offers: cleanOffers
    });

  } catch (error) {
    console.error('[offers] Error:', error.message);
    return res.status(200).json({
      success: false,
      offers: [],
      error: 'Failed to load offers. Please try again.'
    });
  }
};
