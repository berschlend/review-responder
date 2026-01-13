const fs = require('fs');

const filePath = 'C:/Users/Berend Mainz/Documents/Start-up/reviewresponder-2/frontend/src/App.js';
let content = fs.readFileSync(filePath, 'utf-8');

let count = 0;

// Pattern: Multi-line format with custom color (className="btn" with background color)
const multiLineCustomColorPattern = /<div style=\{\{\s*display: 'flex',\s*flexWrap: 'wrap',\s*background: 'white',\s*padding: '6px',\s*borderRadius: '14px',\s*maxWidth: '540px',\s*margin: '0 auto 32px',\s*boxShadow: '0 20px 25px -5px rgba\(0, 0, 0, 0\.1\), 0 10px 10px -5px rgba\(0, 0, 0, 0\.04\)'\s*\}\}>\s*<input\s*type="email"\s*placeholder="Enter your business email"\s*style=\{\{\s*flex: 1,\s*minWidth: '200px',\s*border: 'none',\s*padding: '14px 20px',\s*fontSize: '16px',\s*color: 'var\(--gray-900\)',\s*outline: 'none',\s*background: 'transparent',\s*borderRadius: '10px'\s*\}\}\s*\/>\s*<Link\s*to="\/register"\s*className="btn"\s*style=\{\{\s*padding: '14px 28px',\s*borderRadius: '10px',\s*fontWeight: '600',\s*display: 'flex',\s*alignItems: 'center',\s*gap: '8px',\s*margin: 0,\s*whiteSpace: 'nowrap',\s*background: '(#[A-Fa-f0-9]+)',\s*color: 'white'\s*\}\}\s*>\s*Get Started Free <Sparkles size=\{18\} \/>\s*<\/Link>\s*<\/div>/g;

content = content.replace(multiLineCustomColorPattern, (match, color) => {
  count++;
  console.log(`Found color: ${color}`);
  return `<LandingEmailCapture buttonColor="${color}" />`;
});

console.log(`Total replaced: ${count}`);
fs.writeFileSync(filePath, content);
console.log('Done!');
