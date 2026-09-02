// native fetch

async function test() {
  try {
    const res = await fetch('https://appsave.store/api/v2?ip=23.45.21.76&user_agent=Mozilla%2F5.0', {
      headers: {
        'Authorization': 'Bearer 47461|FHItLr3LACC9T00A8dWbkvwMmPfk6YHFADpd6Yru8263a017',
        'Accept': 'application/json'
      }
    });
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('BODY:', text.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
}
test();
