module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // NOTE: This is a placeholder for checking offer completion.
  // In a real environment, you would check your database to see if a postback
  // from OGAds has marked the offer as completed for this user's IP or click ID.
  
  // To test the unlock process, you can change this to `true`
  // or add a query parameter like `?force_unlock=true`.
  
  const forceUnlock = req.query && req.query.force_unlock === 'true';

  return res.status(200).json({
    completed: forceUnlock // Returns false by default, meaning it keeps loading until you implement the real postback.
  });
};
