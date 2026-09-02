export default async function handler(req, res) {
  try {
    // Read the secret API token from Vercel Environment Variables
    const token = process.env.CPA_API_TOKEN;
    
    if (!token) {
      return res.status(500).json({ 
        error: 'Missing CPA_API_TOKEN environment variable in Vercel.' 
      });
    }

    // Extract required parameters for OGAds from the incoming request
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '1.1.1.1';
    const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

    // Build the query string with required parameters
    const params = new URLSearchParams({
      ip: ip.split(',')[0], // Use the first IP if there's a list
      user_agent: userAgent
    });

    const endpoint = `https://appsave.store/api/v2?${params.toString()}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('CPA API Error:', data);
      return res.status(response.status).json({ 
        error: 'CPA API rejected the request', 
        details: data 
      });
    }
    let offers = data.offers || data.data || [];
    
    // --- WHITELIST LOGIC ---
    // If you want to force specific offers, put their IDs here (e.g. [9164, 2993, 12345])
    // The script will ONLY show these offers if they are valid for the user's IP.
    // If empty, it will just show the highest paying/default offers for that IP.
    const WHITELISTED_OFFER_IDS = []; 
    
    if (WHITELISTED_OFFER_IDS.length > 0 && offers.length > 0) {
      const filteredOffers = offers.filter(o => 
        WHITELISTED_OFFER_IDS.includes(parseInt(o.offerid || o.offer_id))
      );
      // Only apply whitelist if it actually matches something for this user
      if (filteredOffers.length > 0) {
        offers = filteredOffers;
      }
    }
    
    // Make sure we always return the structure the frontend expects
    data.offers = offers;

    // Forward the successful data back to our frontend
    res.status(200).json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Failed to connect to the offers network.' });
  }
}
