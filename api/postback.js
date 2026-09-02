// Global memory store for completions (Note: resets on Vercel cold starts)
global.completedOffers = global.completedOffers || {};

module.exports = function handler(req, res) {
  const { offer_id, payout, ip, aff_sub } = req.query;
  console.log(`[CONVERSION] Offer: ${offer_id} | Payout: $${payout} | IP: ${ip} | Sub: ${aff_sub}`);

  if (ip) {
    if (!global.completedOffers[ip]) global.completedOffers[ip] = 0;
    global.completedOffers[ip] += 1;
  }

  res.status(200).json({ status: 'ok', lead: { offer_id, payout, ip } });
};
