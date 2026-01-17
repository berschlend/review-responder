// Deep Click Authenticity Analysis
const https = require('https');

const options = {
  hostname: 'review-responder.onrender.com',
  path: '/api/outreach/dashboard',
  headers: { 'x-admin-key': 'rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U' }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('         DATA QUALITY DEEP ANALYSIS: Click Authenticity');
    console.log('═══════════════════════════════════════════════════════════════');

    // Filter out obvious bots (midnight + test emails)
    const testPatterns = ['user@domain.com', 'xxx@xxx.com', '%40'];
    const leads = json.hot_leads.filter(lead => {
      const hour = new Date(lead.clicked_at).getUTCHours();
      const minute = new Date(lead.clicked_at).getUTCMinutes();
      const email = (lead.email || '').toLowerCase();
      const isMidnight = hour === 0 && minute < 20;
      const isTestEmail = testPatterns.some(p => email.includes(p.toLowerCase()));
      return !isMidnight && !isTestEmail;
    });

    console.log('\n📊 INITIAL FILTER: ' + leads.length + ' clicks passed bot filter\n');

    // ====== ANALYSIS 1: Timing Patterns ======
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('1. TIMING ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════');

    // Group by exact minute
    const byMinute = {};
    leads.forEach(l => {
      const ts = l.clicked_at.substring(0, 16); // YYYY-MM-DDTHH:MM
      byMinute[ts] = byMinute[ts] || [];
      byMinute[ts].push(l.email);
    });

    const minuteClusters = Object.entries(byMinute).filter(([ts, emails]) => emails.length > 1);
    if (minuteClusters.length > 0) {
      console.log('⚠️  SUSPICIOUS: Multiple clicks in same minute:');
      minuteClusters.forEach(([ts, emails]) => {
        console.log('   ' + ts + ': ' + emails.length + ' clicks');
        emails.forEach(e => console.log('      - ' + e));
      });
    } else {
      console.log('✅ No suspicious timing clusters found');
    }

    // Check for sequential clicks (within 5 seconds)
    const sorted = [...leads].sort((a,b) => new Date(a.clicked_at) - new Date(b.clicked_at));
    const sequential = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff = new Date(sorted[i].clicked_at) - new Date(sorted[i-1].clicked_at);
      if (diff < 10000 && diff > 0) { // Less than 10 seconds
        sequential.push({
          email1: sorted[i-1].email,
          email2: sorted[i].email,
          diff: Math.round(diff/1000)
        });
      }
    }
    if (sequential.length > 0) {
      console.log('\n⚠️  SUSPICIOUS: Sequential clicks (<10s apart):');
      sequential.forEach(s => {
        console.log('   ' + s.email1.substring(0,30) + ' -> ' + s.email2.substring(0,30) + ' (' + s.diff + 's)');
      });
    }

    // ====== ANALYSIS 2: Email Domain Patterns ======
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('2. EMAIL DOMAIN ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════');

    const domains = {};
    leads.forEach(l => {
      const domain = l.email.split('@')[1] || 'unknown';
      domains[domain] = (domains[domain] || 0) + 1;
    });

    const sortedDomains = Object.entries(domains).sort((a,b) => b[1] - a[1]);
    console.log('Domain distribution:');
    sortedDomains.slice(0, 15).forEach(([domain, count]) => {
      const flag = count > 2 ? ' ⚠️ CLUSTER' : '';
      console.log('   ' + domain.padEnd(35) + ': ' + count + flag);
    });

    // Check for generic/suspicious domains
    const suspiciousDomains = ['hotmail.com', 'gmail.com', 'yahoo.com', 'outlook.com'];
    const genericEmails = leads.filter(l => suspiciousDomains.some(d => l.email.toLowerCase().includes(d)));
    if (genericEmails.length > 0) {
      console.log('\n⚠️  Generic email domains (personal, not business):');
      genericEmails.forEach(l => console.log('   - ' + l.email + ' (' + (l.business_name || 'NO NAME') + ')'));
    }

    // ====== ANALYSIS 3: Business Name Quality ======
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('3. BUSINESS DATA QUALITY');
    console.log('═══════════════════════════════════════════════════════════════');

    const noBusinessName = leads.filter(l => !l.business_name);
    const noReviews = leads.filter(l => !l.google_reviews_count);

    console.log('Missing business_name: ' + noBusinessName.length);
    if (noBusinessName.length > 0) {
      console.log('   ⚠️  These have no business data (could be fake):');
      noBusinessName.forEach(l => console.log('      - ' + l.email));
    }

    console.log('Missing review count: ' + noReviews.length);

    // ====== ANALYSIS 4: Daily Distribution ======
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('4. DAILY DISTRIBUTION');
    console.log('═══════════════════════════════════════════════════════════════');

    const byDay = {};
    leads.forEach(l => {
      const day = l.clicked_at.substring(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });

    Object.entries(byDay).sort().forEach(([day, count]) => {
      const bar = '█'.repeat(count);
      const flag = count > 8 ? ' ⚠️ BURST' : '';
      console.log('   ' + day + ': ' + count.toString().padStart(2) + ' ' + bar + flag);
    });

    // ====== ANALYSIS 5: Geographic Clusters ======
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('5. GEOGRAPHIC CLUSTERS');
    console.log('═══════════════════════════════════════════════════════════════');

    const byCity = {};
    leads.forEach(l => {
      const city = l.city || 'Unknown';
      byCity[city] = byCity[city] || [];
      byCity[city].push(l);
    });

    Object.entries(byCity)
      .sort((a,b) => b[1].length - a[1].length)
      .slice(0, 10)
      .forEach(([city, cityLeads]) => {
        const flag = cityLeads.length >= 3 ? ' ⚠️ CLUSTER' : '';
        console.log('   ' + city.padEnd(20) + ': ' + cityLeads.length + flag);
        if (cityLeads.length >= 3) {
          cityLeads.forEach(l => {
            const time = l.clicked_at.substring(11, 16);
            const day = l.clicked_at.substring(5, 10);
            console.log('      ' + day + ' ' + time + ' - ' + l.email.substring(0,40));
          });
        }
      });

    // ====== ANALYSIS 6: Hour Distribution (Check for automated patterns) ======
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('6. HOUR DISTRIBUTION (Business hours check)');
    console.log('═══════════════════════════════════════════════════════════════');

    const byHour = {};
    leads.forEach(l => {
      const hour = new Date(l.clicked_at).getUTCHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
    });

    for (let h = 0; h < 24; h++) {
      const count = byHour[h] || 0;
      const bar = '█'.repeat(count);
      const isBusinessHour = (h >= 8 && h <= 18) || (h >= 14 && h <= 23); // US + EU business hours
      const flag = !isBusinessHour && count > 2 ? ' ⚠️ OFF-HOURS' : '';
      console.log('   ' + h.toString().padStart(2, '0') + ':00 UTC: ' + count.toString().padStart(2) + ' ' + bar + flag);
    }

    // ====== FINAL VERDICT ======
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                      FINAL VERDICT');
    console.log('═══════════════════════════════════════════════════════════════');

    let suspiciousCount = 0;
    let reasons = [];

    // Count suspicious indicators
    const clusterEmails = new Set();
    minuteClusters.forEach(([ts, emails]) => emails.forEach(e => clusterEmails.add(e)));
    sequential.forEach(s => { clusterEmails.add(s.email1); clusterEmails.add(s.email2); });
    noBusinessName.forEach(l => clusterEmails.add(l.email));

    suspiciousCount = clusterEmails.size;

    if (minuteClusters.length > 0) reasons.push(minuteClusters.length + ' timing clusters');
    if (sequential.length > 0) reasons.push(sequential.length + ' sequential pairs');
    if (noBusinessName.length > 0) reasons.push(noBusinessName.length + ' missing business data');
    if (genericEmails.length > 0) reasons.push(genericEmails.length + ' generic emails');

    const realCount = leads.length - suspiciousCount;

    console.log('');
    console.log('   Passed initial bot filter:  ' + leads.length);
    console.log('   With suspicious patterns:   ' + suspiciousCount);
    console.log('   ─────────────────────────────────');
    console.log('   LIKELY REAL:                ' + Math.max(0, realCount));
    console.log('');

    if (reasons.length > 0) {
      console.log('   Red flags: ' + reasons.join(', '));
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    if (realCount < 10) {
      console.log('   🚨 CONCLUSION: VERY FEW verifiably real clicks');
      console.log('   Most "clicks" are likely bots, tests, or automated systems');
    } else if (realCount < 20) {
      console.log('   ⚠️  CONCLUSION: Some clicks are questionable');
      console.log('   Roughly ' + realCount + ' appear to be genuine interest');
    } else {
      console.log('   ✅ CONCLUSION: Most clicks appear legitimate');
    }
    console.log('═══════════════════════════════════════════════════════════════');
  });
}).on('error', console.error);
