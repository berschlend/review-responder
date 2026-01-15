// Lead Scorer Script for Burst-14
const fs = require('fs');
const path = require('path');

const hotLeads = [
  {email:'advantageclub@leonardo-hotels.com',clicked_at:'2026-01-15T07:01:37.599Z',business_name:'Leonardo Hotel & Residenz München',city:'Munich',google_reviews_count:4343},
  {email:'afif@alicetoronto.com',clicked_at:'2026-01-13T16:59:11.546Z',business_name:'Alice Restaurant & Bar',city:null,google_reviews_count:null},
  {email:'awayspa.edinburgh@whotels.com',clicked_at:'2026-01-14T22:05:50.268Z',business_name:'AWAY® SPA',city:'Edinburgh',google_reviews_count:37},
  {email:'bren@ldry.com',clicked_at:'2026-01-13T16:20:16.153Z',business_name:'Brenners Steakhouse',city:'Houston',google_reviews_count:null},
  {email:'community@bullring.co.uk',clicked_at:'2026-01-14T22:05:26.837Z',business_name:'Bullring',city:'Birmingham',google_reviews_count:56381},
  {email:'dining@edgewaterhotel.com',clicked_at:'2026-01-13T16:19:45.718Z',business_name:'Six Seven Restaurant',city:'Seattle',google_reviews_count:2183},
  {email:'guestservices@steak44.com',clicked_at:'2026-01-13T16:19:11.969Z',business_name:'Steak 44',city:'Phoenix',google_reviews_count:null},
  {email:'H0796@accor.com',clicked_at:'2026-01-15T03:07:58.427Z',business_name:'ibis Wien Mariahilf',city:'Wien',google_reviews_count:4234},
  {email:'h9057@accor.com',clicked_at:'2026-01-15T00:13:12.381Z',business_name:'Novotel London Canary Wharf',city:'London',google_reviews_count:4589},
  {email:'hello@shopviu.com',clicked_at:'2026-01-15T00:13:17.650Z',business_name:'VIU flagship store',city:'Graz',google_reviews_count:119},
  {email:'hello@stjamesquarter.com',clicked_at:'2026-01-15T00:13:06.656Z',business_name:'St James Quarter',city:'Edinburgh',google_reviews_count:9691},
  {email:'hello@tulio.com',clicked_at:'2026-01-13T16:19:47.058Z',business_name:'Tulio',city:'Seattle',google_reviews_count:null},
  {email:'info@alderandashsea.com',clicked_at:'2026-01-14T08:03:21.408Z',business_name:'Alder & Ash',city:'Seattle',google_reviews_count:653},
  {email:'info@bostoniapublichouse.com',clicked_at:'2026-01-13T16:18:51.155Z',business_name:'Bostonia Public House',city:'Boston',google_reviews_count:null},
  {email:'info@hilton.com',clicked_at:'2026-01-15T00:13:20.856Z',business_name:'Hilton Los Angeles Airport',city:'Los Angeles',google_reviews_count:11849},
  {email:'info@hummelklappen.se',clicked_at:'2026-01-15T00:13:21.932Z',business_name:'Hummelkläppen',city:'Stockholm',google_reviews_count:10},
  {email:'info@kentwood.com',clicked_at:'2026-01-15T00:13:20.231Z',business_name:'Kentwood Real Estate',city:'Denver',google_reviews_count:115},
  {email:'info@marriott.com',clicked_at:'2026-01-15T00:13:20.370Z',business_name:'Sheraton Grand Edinburgh',city:'Edinburgh',google_reviews_count:2449},
  {email:'info@pia.be',clicked_at:'2026-01-15T00:13:16.322Z',business_name:'DBM Tax & Accounting',city:'Brüssel',google_reviews_count:8},
  {email:'info@romanolaw.com',clicked_at:'2026-01-14T22:02:45.963Z',business_name:'Romano Law',city:'New York',google_reviews_count:325},
  {email:'info@terrasse-zuerich.ch',clicked_at:'2026-01-15T00:13:09.692Z',business_name:'terrasse Restaurant',city:'Zürich',google_reviews_count:2339},
  {email:'info@thedoldergrand.com',clicked_at:'2026-01-15T00:32:36.124Z',business_name:'The Dolder Grand',city:'Zürich',google_reviews_count:3838},
  {email:'info@thesmithrestaurant.com',clicked_at:'2026-01-13T16:20:03.358Z',business_name:'The Smith',city:'New York',google_reviews_count:6152},
  {email:'info@treudelberg.com',clicked_at:'2026-01-15T09:04:34.177Z',business_name:'IntercityHotel Hamburg',city:'Hamburg',google_reviews_count:2752},
  {email:'info@wildginger.net',clicked_at:'2026-01-13T16:19:25.758Z',business_name:'Wild Ginger',city:'Seattle',google_reviews_count:null},
  {email:'info@wirtshausinderau.de',clicked_at:'2026-01-13T16:18:44.261Z',business_name:'Wirtshaus in der Au',city:'München',google_reviews_count:5624},
  {email:'i.schmidt@tv-turm.de',clicked_at:'2026-01-13T16:20:00.996Z',business_name:'Sphere Tim Raue',city:'Berlin',google_reviews_count:8474},
  {email:'langstrasse@25hours-hotels.com',clicked_at:'2026-01-14T22:09:40.311Z',business_name:'25hours Hotel Zürich',city:'Zürich',google_reviews_count:3387},
  {email:'leasing@kprcenters.com',clicked_at:'2026-01-15T00:13:18.328Z',business_name:'Vestavia Hills City Center',city:'Birmingham',google_reviews_count:1748},
  {email:'lgho@ldry.com',clicked_at:'2026-01-14T06:20:25.582Z',business_name:'La Griglia',city:'Houston',google_reviews_count:null},
  {email:'nye@komodomiami.com',clicked_at:'2026-01-13T16:20:25.579Z',business_name:'Komodo Miami',city:'Miami',google_reviews_count:7240},
  {email:'onlinebestellung@pearle.at',clicked_at:'2026-01-15T00:13:37.995Z',business_name:'Pearle-Optik Graz',city:'Graz',google_reviews_count:36},
  {email:'orders@petitpierrebakery.com',clicked_at:'2026-01-14T21:23:40.210Z',business_name:'Petit Pierre Bakery',city:'Seattle',google_reviews_count:772},
  {email:'pmuszynski@thecapitalgrille.com',clicked_at:'2026-01-14T06:22:20.638Z',business_name:'The Capital Grille',city:'Seattle',google_reviews_count:2096},
  {email:'reservation.web@madamebrasserie.com',clicked_at:'2026-01-14T12:08:59.218Z',business_name:'Madame Brasserie',city:'Paris',google_reviews_count:null},
  {email:'welcome@sonnenberg-zurich.ch',clicked_at:'2026-01-15T00:13:18.129Z',business_name:'Restaurant Sonnenberg',city:'Zürich',google_reviews_count:1053},
  {email:'willkommen@augustiner-klosterwirt.de',clicked_at:'2026-01-13T16:20:57.260Z',business_name:'Augustiner Klosterwirt',city:'München',google_reviews_count:13395},
  {email:'zuerich@trattoria-sempre.ch',clicked_at:'2026-01-15T00:13:10.178Z',business_name:'Trattoria Sempre Zürich',city:'Zürich',google_reviews_count:2437}
];

function calculateScore(lead) {
  let engagement = 0, fit = 0, behavior = 0;

  // ENGAGEMENT (max 40)
  // WICHTIG: Ein Klick ist das STÄRKSTE Kaufsignal das wir haben!
  engagement += 25; // clicked = +25 (statt +15)

  // Recency bonus
  const clickedAt = new Date(lead.clicked_at);
  const now = new Date();
  const hoursAgo = (now - clickedAt) / (1000 * 60 * 60);
  if (hoursAgo < 12) engagement += 15; // very recent
  else if (hoursAgo < 24) engagement += 10;
  else if (hoursAgo < 48) engagement += 5;
  // Older clicks still valuable, no penalty

  // FIT (max 30)
  const reviews = lead.google_reviews_count || 0;
  if (reviews >= 5 && reviews <= 50) fit += 18; // perfect sweet spot - needs help most!
  else if (reviews > 50 && reviews <= 200) fit += 15;
  else if (reviews > 200 && reviews <= 1000) fit += 12; // established
  else if (reviews > 1000 && reviews <= 5000) fit += 10; // larger, but still can benefit
  else if (reviews > 5000) fit += 8; // enterprise, might have budget
  else fit += 8; // unknown = neutral

  // Assume average rating if unknown
  fit += 5;

  // BEHAVIOR (max 30)
  // Click implies strong intent
  behavior += 15;

  // Personal email (not info@, not generic) = decision maker!
  const emailPrefix = lead.email.split('@')[0].toLowerCase();
  if (!['info', 'contact', 'hello', 'support', 'admin', 'sales', 'reservations', 'booking'].includes(emailPrefix)) {
    behavior += 10; // personal email = decision maker
  }

  // Hotel/Restaurant bonus (our main target)
  const businessLower = (lead.business_name || '').toLowerCase();
  if (businessLower.includes('hotel') || businessLower.includes('restaurant') ||
      businessLower.includes('spa') || businessLower.includes('bar')) {
    behavior += 5;
  }

  const total = Math.min(engagement + fit + behavior, 100);

  return {
    email: lead.email,
    business: lead.business_name,
    city: lead.city,
    reviews: reviews,
    score: total,
    breakdown: { engagement, fit, behavior },
    clicked_hours_ago: Math.round(hoursAgo),
    segment: total >= 75 ? 'hot' : total >= 55 ? 'warm' : total >= 35 ? 'cool' : 'cold'
  };
}

const scored = hotLeads
  .filter(l => l.email && !l.email.includes('xxx@') && !l.email.includes('user@domain'))
  .map(calculateScore)
  .sort((a, b) => b.score - a.score);

// Count segments
const segments = { hot: 0, warm: 0, cool: 0, cold: 0 };
scored.forEach(l => segments[l.segment]++);

// Get top 10
const top10 = scored.slice(0, 10);

// Find mega-hot leads (score 90+)
const megaHot = scored.filter(l => l.score >= 90);

// Build output
const output = {
  last_updated: new Date().toISOString(),
  total_scored: scored.length,
  segments: segments,
  top_10: top10,
  new_hot_leads: scored.filter(l => l.segment === 'hot'),
  mega_hot_leads: megaHot,
  all_scored: scored
};

// Write to file
const outputPath = path.join(__dirname, '..', 'content', 'claude-progress', 'lead-scores.json');
const existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

// Merge with existing scoring model
const finalOutput = {
  ...output,
  scoring_model: existingData.scoring_model,
  thresholds: existingData.thresholds,
  agent_actions: existingData.agent_actions
};

fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2));
console.log('=== LEAD SCORING COMPLETE ===');
console.log('Total Leads Scored:', scored.length);
console.log('Segments:', JSON.stringify(segments));
console.log('\nTop 10 Hot Leads:');
top10.forEach((l, i) => {
  console.log(`${i+1}. ${l.business} (${l.city}) - Score: ${l.score} [${l.segment}]`);
});

if (megaHot.length > 0) {
  console.log('\n🔥🔥 MEGA-HOT LEADS (90+):');
  megaHot.forEach(l => {
    console.log(`   ${l.business} - ${l.score}/100`);
  });
}
