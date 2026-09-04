module.exports = function handler(req, res) {
  // Read conversion data from query string
  const { offer_id, payout, ip, aff_sub, aff_sub2 } = req.query;

  const lead = {
    offer_id: offer_id || 'unknown',
    payout: payout || '0.00',
    ip: ip || 'unknown',
    aff_sub: aff_sub || '',
    aff_sub2: aff_sub2 || '',
    timestamp: new Date().toISOString()
  };

  // Log the lead (visible in Vercel function logs)
  console.log('[POSTBACK] Lead received:', JSON.stringify(lead));

  // OGAds requires a 200 response, otherwise it retries
  return res.status(200).json({
    status: 'ok',
    lead: lead
  });
};
