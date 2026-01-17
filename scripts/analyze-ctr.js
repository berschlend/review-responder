// CTR Data Quality Analyzer
const https = require('https');

const options = {
  hostname: 'review-responder.onrender.com',
  path: '/api/outreach/dashboard',
  method: 'GET',
  headers: {
    'x-admin-key': 'rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    analyzeData(json);
  });
}).on('error', console.error);

function analyzeData(data) {
  console.log('=== CTR DATA QUALITY ANALYSIS ===\n');

  const clicksByHour = {};
  const suspiciousClicks = [];
  const legitimateClicks = [];
  const testPatterns = ['user@domain.com', 'xxx@xxx.com', 'test@', 'berend', '%40'];

  data.hot_leads.forEach(lead => {
    const clickedAt = new Date(lead.clicked_at);
    const hour = clickedAt.getUTCHours();
    clicksByHour[hour] = (clicksByHour[hour] || 0) + 1;

    const email = (lead.email || '').toLowerCase();
    const isTestEmail = testPatterns.some(t => email.includes(t));
    const isMidnight = hour === 0;
    const noBusinessName = !lead.business_name;

    const isSuspicious = isMidnight || isTestEmail || noBusinessName;

    if (isSuspicious) {
      const reason = isTestEmail ? 'test-email' : isMidnight ? 'midnight-burst' : 'no-business';
      suspiciousClicks.push({ email, reason, clicked: lead.clicked_at, business: lead.business_name });
    } else {
      legitimateClicks.push({ email, business: lead.business_name, clicked: lead.clicked_at });
    }
  });

  // Hour distribution
  console.log('CLICK DISTRIBUTION BY HOUR (UTC):');
  console.log('─'.repeat(50));
  Object.entries(clicksByHour)
    .sort((a,b) => b[1] - a[1])
    .forEach(([hour, count]) => {
      const pct = (count / data.hot_leads.length * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(count / 2));
      const flag = hour == 0 ? ' 🚨 MIDNIGHT BURST' : '';
      console.log(`  ${hour.toString().padStart(2, '0')}:00 | ${count.toString().padStart(2)} clicks (${pct.padStart(5)}%) ${bar}${flag}`);
    });

  console.log('\n=== SUSPICIOUS CLICKS ===');
  console.log(`Total: ${suspiciousClicks.length} / ${data.hot_leads.length} (${(suspiciousClicks.length/data.hot_leads.length*100).toFixed(1)}%)`);
  console.log('─'.repeat(50));

  // Group by reason
  const byReason = {};
  suspiciousClicks.forEach(c => {
    byReason[c.reason] = (byReason[c.reason] || 0) + 1;
  });
  Object.entries(byReason).forEach(([reason, count]) => {
    console.log(`  ${reason}: ${count}`);
  });

  console.log('\nExamples:');
  suspiciousClicks.slice(0, 8).forEach(c => {
    console.log(`  - ${c.email} (${c.reason})`);
  });

  console.log('\n=== LEGITIMATE CLICKS ===');
  console.log(`Total: ${legitimateClicks.length} / ${data.hot_leads.length} (${(legitimateClicks.length/data.hot_leads.length*100).toFixed(1)}%)`);
  console.log('─'.repeat(50));
  console.log('Top legitimate clickers:');
  legitimateClicks.slice(0, 10).forEach(c => {
    console.log(`  ✓ ${c.business}`);
  });

  console.log('\n=== REAL CTR CALCULATION ===');
  console.log('═'.repeat(50));
  const totalSent = data.stats.emails_sent;
  const reportedClicks = data.stats.clicks;
  const realClicks = legitimateClicks.length;
  const reportedCTR = (reportedClicks / totalSent * 100).toFixed(2);
  const realCTR = (realClicks / totalSent * 100).toFixed(2);
  const inflation = ((reportedClicks - realClicks) / realClicks * 100).toFixed(0);

  console.log(`  Emails Sent:       ${totalSent}`);
  console.log(`  Reported Clicks:   ${reportedClicks} (CTR: ${reportedCTR}%)`);
  console.log(`  Legitimate Clicks: ${realClicks} (CTR: ${realCTR}%)`);
  console.log(`  Fake Clicks:       ${reportedClicks - realClicks}`);
  console.log('═'.repeat(50));
  console.log(`  📊 REAL CTR: ${realCTR}% (inflated by ${inflation}%)`);
  console.log('═'.repeat(50));

  // Midnight burst analysis
  console.log('\n=== MIDNIGHT BURST ANALYSIS ===');
  const midnightClicks = suspiciousClicks.filter(c => c.reason === 'midnight-burst');

  // Group by exact timestamp (within same second)
  const byTimestamp = {};
  midnightClicks.forEach(c => {
    const ts = c.clicked.substring(0, 16); // YYYY-MM-DDTHH:MM
    byTimestamp[ts] = (byTimestamp[ts] || 0) + 1;
  });

  console.log('Clicks per minute (midnight only):');
  Object.entries(byTimestamp)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([ts, count]) => {
      console.log(`  ${ts} - ${count} clicks ${count > 5 ? '🚨 LIKELY BOT' : ''}`);
    });

  console.log('\n=== CONCLUSION ===');
  if (realCTR < 2) {
    console.log('⚠️  Real CTR is LOW. Most clicks are from bots/tests.');
    console.log('    The midnight bursts suggest automated link checking.');
  } else if (realCTR < 3) {
    console.log('📊 Real CTR is AVERAGE for cold email.');
  } else {
    console.log('✅ Real CTR is GOOD!');
  }
}
