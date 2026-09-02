async function test() {
  const token = '47461|FHItLr3LACC9T00A8dWbkvwMmPfk6YHFADpd6Yru8263a017';
  
  const tests = [
    { name: 'Android', ip: '23.45.21.76', ua: 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36' },
    { name: 'iPhone', ip: '23.45.21.76', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1' },
    { name: 'Desktop', ip: '23.45.21.76', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36' }
  ];

  for (const t of tests) {
    console.log(`\nTesting ${t.name}...`);
    try {
      const url = `https://appsave.store/api/v2?ip=${t.ip}&user_agent=${encodeURIComponent(t.ua)}`;
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
        console.log(`First offer: ${data.offers[0].name}`);
      } else {
        console.log(data);
      }
    } catch (e) {
      console.error(e);
    }
  }
}
test();
