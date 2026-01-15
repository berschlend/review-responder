const fs = require('fs');

const filePath = 'C:/Users/Berend Mainz/Documents/Start-up/reviewresponder-2/frontend/src/App.js';
let content = fs.readFileSync(filePath, 'utf-8');

let count = 0;

// Pattern 1: Multi-line format with btn btn-primary (default color)
const multiLinePattern =
  /<div style=\{\{\s*display: 'flex',\s*flexWrap: 'wrap',\s*background: 'white',\s*padding: '6px',\s*borderRadius: '14px',\s*maxWidth: '540px',\s*margin: '0 auto 32px',\s*boxShadow: '0 20px 25px -5px rgba\(0, 0, 0, 0\.1\), 0 10px 10px -5px rgba\(0, 0, 0, 0\.04\)'\s*\}\}>\s*<input\s*type="email"\s*placeholder="Enter your business email"\s*style=\{\{\s*flex: 1,\s*minWidth: '200px',\s*border: 'none',\s*padding: '14px 20px',\s*fontSize: '16px',\s*color: 'var\(--gray-900\)',\s*outline: 'none',\s*background: 'transparent',\s*borderRadius: '10px'\s*\}\}\s*\/>\s*<Link\s*to="\/register"\s*className="btn btn-primary"\s*style=\{\{\s*padding: '14px 28px',\s*borderRadius: '10px',\s*fontWeight: '600',\s*display: 'flex',\s*alignItems: 'center',\s*gap: '8px',\s*margin: 0,\s*whiteSpace: 'nowrap'\s*\}\}\s*>\s*Get Started Free <Sparkles size=\{18\} \/>\s*<\/Link>\s*<\/div>/g;

content = content.replace(multiLinePattern, match => {
  count++;
  return '<LandingEmailCapture />';
});
console.log(`Multi-line (default color): ${count}`);

// Pattern 2: Single-line format with custom color (practice email - Healthgrades/Zocdoc)
let count2 = 0;
const practiceEmailPattern =
  /<div style=\{\{ display: 'flex', flexWrap: 'wrap', background: 'white', padding: '6px', borderRadius: '14px', maxWidth: '540px', margin: '0 auto 32px', boxShadow: '0 20px 25px -5px rgba\(0, 0, 0, 0\.1\)' \}\}>\s*<input type="email" placeholder="Enter your practice email" style=\{\{ flex: 1, minWidth: '200px', border: 'none', padding: '14px 20px', fontSize: '16px', color: 'var\(--gray-900\)', outline: 'none', background: 'transparent', borderRadius: '10px' \}\} \/>\s*<Link to="\/register" className="btn" style=\{\{ padding: '14px 28px', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, whiteSpace: 'nowrap', background: '(#[A-Fa-f0-9]+)', color: 'white' \}\}>Get Started Free <Sparkles size=\{18\} \/><\/Link>\s*<\/div>/g;

content = content.replace(practiceEmailPattern, (match, color) => {
  count2++;
  return `<LandingEmailCapture buttonColor="${color}" />`;
});
console.log(`Practice email (custom color): ${count2}`);

console.log(`Total replaced: ${count + count2}`);
fs.writeFileSync(filePath, content);
console.log('Done!');
