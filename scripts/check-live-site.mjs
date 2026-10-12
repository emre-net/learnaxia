async function test() {
  const res = await fetch('https://learnaxia.com');
  const html = await res.text();
  console.log('Homepage status:', res.status, 'HTML length:', html.length);
  
  const cssMatches = [...html.matchAll(/href="(\/_next\/static\/css\/[^"]+)"/g)];
  console.log('CSS links found:', cssMatches.length);
  for (const m of cssMatches) {
    const cssUrl = 'https://learnaxia.com' + m[1];
    const cssRes = await fetch(cssUrl);
    console.log('CSS URL:', m[1], 'Status:', cssRes.status, 'Content-Type:', cssRes.headers.get('content-type'));
  }
  
  const jsMatches = [...html.matchAll(/src="(\/_next\/static\/[^"]+)"/g)];
  console.log('JS links count:', jsMatches.length);
  for (const m of jsMatches.slice(0, 3)) {
    const jsUrl = 'https://learnaxia.com' + m[1];
    const jsRes = await fetch(jsUrl);
    console.log('JS URL:', m[1], 'Status:', jsRes.status);
  }
}
test().catch(console.error);
