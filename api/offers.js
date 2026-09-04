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
  const MAX_OFFERS = 10;
  const RETURN_OFFERS = 2; // Only return 2 offers to the frontend

  // Optional: whitelist specific offer IDs (leave empty to show all)
  const WHITELISTED_OFFER_IDS = [];

  try {
    // ── Get visitor IP ──
    const forwarded = req.headers['x-forwarded-for'];
    let clientIp = '1.1.1.1';
    if (forwarded) {
      clientIp = forwarded.split(',')[0].trim();
    } else if (req.socket && req.socket.remoteAddress) {
      clientIp = req.socket.remoteAddress;
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

    // ── Apply whitelist filter ──
    if (WHITELISTED_OFFER_IDS.length > 0) {
      const filtered = offers.filter(offer => {
        const offerId = parseInt(offer.offerid || offer.offer_id, 10);
        return WHITELISTED_OFFER_IDS.includes(offerId);
      });
      // If whitelist matched some offers, use them; otherwise fallback to all
      if (filtered.length > 0) {
        offers = filtered;
      }
    }

    // ── Map to clean format & limit to 2 offers ──
    const cleanOffers = offers.slice(0, RETURN_OFFERS).map(offer => ({
      offer_id: offer.offerid || offer.offer_id,
      name: offer.name_short || offer.name,
      description: offer.adcopy || offer.description || '',
      image: offer.picture || offer.icon || '',
      link: offer.link || offer.url,
      payout: offer.payout || '0.00',
      cta: 'START OFFER →'
    }));

    console.log(`[offers] IP: ${clientIp} | Returned ${cleanOffers.length} offers`);

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
