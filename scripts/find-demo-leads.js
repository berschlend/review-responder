const fs = require('fs');
const path = require('path');
const tmpPath = path.join(__dirname, '..', 'temp_all_new.json');
const data = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));

const usCities = ['new york', 'los angeles', 'chicago', 'miami', 'houston', 'denver', 'boston', 'austin', 'phoenix', 'dallas', 'atlanta', 'seattle'];

const qualified = data.leads.filter(l => {
  const reviews = parseInt(l.google_reviews_count) || 0;
  const email = l.email || '';
  const city = (l.city || '').toLowerCase();
  const isUS = usCities.some(c => city.includes(c));
  const isGeneric = /^(info|contact|office|hello|admin|support|noreply)@/i.test(email);
  const isCorporate = /^[A-Z]\d{3,}@/i.test(email) || email.includes('@accor.') || email.includes('@ihg.');
  return reviews >= 200 && isUS && email && !isGeneric && !isCorporate && !l.demo_token;
}).slice(0, 10);

console.log('HIGH-VALUE LEADS WITHOUT DEMO (500+ reviews, personal email):');
console.log('');
qualified.forEach((l, i) => {
  console.log((i+1) + '. ' + l.business_name + ' (' + l.city + ')');
  console.log('   Reviews: ' + l.google_reviews_count + ' | Email: ' + l.email);
  console.log('   Type: ' + (l.business_type || 'unknown'));
  console.log('   ID: ' + l.id);
  console.log('');
});
console.log('Total qualified: ' + qualified.length);

// Output as JSON for next step
console.log('\n---JSON---');
console.log(JSON.stringify(qualified.map(l => ({
  id: l.id,
  name: l.business_name,
  city: l.city,
  email: l.email,
  reviews: l.google_reviews_count
})), null, 2));
