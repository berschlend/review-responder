#!/usr/bin/env node
/**
 * Import Call Preps into Database
 * Run: node scripts/import-call-preps.js
 */

const https = require('https');

const ADMIN_KEY = 'rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U';
const API_BASE = 'https://review-responder.onrender.com';

const callPreps = [
  // HOT LEADS (aus aktueller Analyse)
  {
    business_name: 'Tí Cafe Denver',
    phone: '+1-720-440-2864',
    city: 'Denver',
    country: 'USA',
    problem: 'HOT - Gestern auf Demo geklickt!',
    priority_score: 5
  },
  {
    business_name: 'Trattoria Sempre Zürich',
    phone: '+41-44-262-5462',
    city: 'Zürich',
    country: 'Switzerland',
    problem: 'Magic Link genutzt - interessiert!',
    priority_score: 5
  },
  {
    business_name: 'Sphere Tim Raue Berlin',
    phone: '030-247575875',
    city: 'Berlin',
    country: 'Germany',
    problem: 'Registriert, Michelin Restaurant - Premium Lead',
    priority_score: 5
  },
  // Düsseldorf Leads
  {
    business_name: 'Bocconcino - Restaurant Duesseldorf Medienhafen',
    phone: '0211 56681482',
    city: 'Duesseldorf',
    country: 'Germany',
    reviews_count: 1042,
    rating: 4.7,
    problem: '1-Stern Review ueber Silvester-Storno - EMOTIONAL!',
    email: 'iso@bocconcino-duesseldorf.de',
    priority_score: 4
  },
  {
    business_name: 'ALCHEMIST Bistro',
    phone: '0211 30035660',
    city: 'Duesseldorf',
    country: 'Germany',
    reviews_count: 368,
    rating: 4.6,
    problem: 'Viele Reviews - braucht Hilfe beim Antworten',
    priority_score: 3
  },
  {
    business_name: 'Restaurant Le Flair',
    phone: '0211 51455688',
    city: 'Duesseldorf',
    country: 'Germany',
    reviews_count: 259,
    rating: 4.7,
    problem: 'Upscale = hohe Erwartungen, jede negative Review zaehlt',
    priority_score: 3
  },
  // Wien Leads
  {
    business_name: 'arte Hotel Wien',
    phone: '+43 1 7898899',
    city: 'Wien',
    country: 'Austria',
    reviews_count: 2669,
    rating: 4.3,
    problem: 'MASSIV viel Reviews - 2669! Braucht Automatisierung',
    priority_score: 3
  },
  {
    business_name: 'Hampton by Hilton Wien',
    phone: '+43 1 2350009',
    city: 'Wien',
    country: 'Austria',
    reviews_count: 780,
    rating: 4.3,
    problem: 'Hilton-Kette - Entscheider evtl. nicht vor Ort',
    priority_score: 2
  }
];

async function importCallPreps() {
  console.log('Importing', callPreps.length, 'call preps...');

  const postData = JSON.stringify({ calls: callPreps });

  const options = {
    hostname: 'review-responder.onrender.com',
    path: '/api/admin/call-preps/bulk-import',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': ADMIN_KEY,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('Result:', result);
          if (result.success) {
            console.log(`Imported ${result.imported} call preps!`);
          } else {
            console.log('Error:', result.error);
          }
          resolve(result);
        } catch (e) {
          console.log('Response:', data);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

importCallPreps()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Failed:', err));
