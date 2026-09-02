// native fetch

async function testMobile() {
  const token = '47461|FHItLr3LACC9T00A8dWbkvwMmPfk6YHFADpd6Yru8263a017';
  
  // Test USA Mobile IP
  const usaIp = '107.178.236.42'; // Random USA IP
  const androidUA = 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';

  console.log(`\nTesting USA Android...`);
  try {
    const url = `https://appsave.store/api/v2?ip=${usaIp}&user_agent=${encodeURIComponent(androidUA)}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Offers found: ${data.offers ? data.offers.length : 0}`);
    if (data.offers && data.offers.length > 0) {
      console.log(`\nTop 5 Offers:`);
      data.offers.slice(0, 5).forEach((o, i) => {
        console.log(`${i+1}. ${o.name_short || o.name} ($${o.payout})`);
      });
    }
  } catch (e) {
    console.error(e);
  }
}
testMobile();
