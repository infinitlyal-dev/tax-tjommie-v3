// Hit the deployed Vercel proxy with test_statement.pdf and dump the full response.
import { readFileSync, writeFileSync } from 'fs';

const URL = process.argv[2] || 'https://tax-tjommie-app.vercel.app/api/categorise-file';
const b64 = readFileSync('test_statement.pdf').toString('base64');

const body = {
  fileType: 'pdf',
  base64: b64,
  filename: 'test_statement.pdf',
  context: { userType: 'freelancer', occupation: 'Photographer' },
};

console.log(`POST ${URL}  (pdf ${Math.round(b64.length * 0.75 / 1024)} KB)`);
const t0 = Date.now();
const res = await fetch(URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const elapsed = Date.now() - t0;
console.log(`HTTP ${res.status} in ${elapsed}ms`);

const text = await res.text();
writeFileSync('proxy_raw.json', text);

try {
  const json = JSON.parse(text);
  if (json.results) {
    console.log(`RESULTS COUNT: ${json.results.length}`);
    console.log(`USAGE:`, json.usage);
    const cats = {};
    json.results.forEach(r => { cats[r.category] = (cats[r.category] || 0) + 1; });
    console.log('CATEGORIES:', cats);
    console.log('FIRST 5:');
    json.results.slice(0, 5).forEach(r => console.log('  ', r));
    console.log('LAST 3:');
    json.results.slice(-3).forEach(r => console.log('  ', r));
  } else {
    console.log('RAW:', JSON.stringify(json, null, 2).slice(0, 1500));
  }
} catch (e) {
  console.log('Non-JSON body:', text.slice(0, 800));
}
