const fs = require('fs');

const filePath = 'C:/Users/Berend Mainz/Documents/Start-up/reviewresponder-2/frontend/src/App.js';
let content = fs.readFileSync(filePath, 'utf-8');

// Pattern to match the old email input div with Link button
// Matches: <div style={{ display: 'flex', ... }}><input type="email" .../><Link to="/register" ... background: '#COLOR' ...>...</Link></div>
const oldPattern =
  /<div style=\{\{ display: 'flex', flexWrap: 'wrap', background: 'white', padding: '6px', borderRadius: '14px', maxWidth: '540px', margin: '0 auto 32px', boxShadow: '0 20px 25px -5px rgba\(0, 0, 0, 0\.1\)' \}\}>\s*<input type="email" placeholder="Enter your business email" style=\{\{ flex: 1, minWidth: '200px', border: 'none', padding: '14px 20px', fontSize: '16px', color: 'var\(--gray-900\)', outline: 'none', background: 'transparent', borderRadius: '10px' \}\} \/>\s*<Link to="\/register" className="btn" style=\{\{ padding: '14px 28px', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, whiteSpace: 'nowrap', background: '(#[A-Fa-f0-9]+)', color: 'white' \}\}>Get Started Free <Sparkles size=\{18\} \/><\/Link>\s*<\/div>/g;

let count = 0;
content = content.replace(oldPattern, (match, color) => {
  count++;
  return `<LandingEmailCapture buttonColor="${color}" />`;
});

console.log(`Replaced ${count} occurrences`);
fs.writeFileSync(filePath, content);
console.log('Done!');
