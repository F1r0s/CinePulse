module.exports = function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '1.1.1.1';
  
  // Check the global memory store for completions
  global.completedOffers = global.completedOffers || {};
  
  // Clean the IP string in case it's a list
  const cleanIp = ip.split(',')[0].trim();
  const completions = global.completedOffers[cleanIp] || 0;

  res.status(200).json({ 
    success: true, 
    ip: cleanIp,
    completions: completions 
  });
};
