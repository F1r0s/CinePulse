export default async function handler(req, res) {
  try {
    // Read the secret API token from Vercel Environment Variables
    const token = process.env.CPA_API_TOKEN;
    
    if (!token) {
      return res.status(500).json({ 
        error: 'Missing CPA_API_TOKEN environment variable in Vercel.' 
      });
    }

    // Build the request
    const endpoint = `https://lockerpreview.com/api/v2?api=${token}`;

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

    // Forward the successful data back to our frontend
    res.status(200).json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Failed to connect to the offers network.' });
  }
}
