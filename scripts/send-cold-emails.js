// Cold Email Script für München Restaurant Leads
// Sendet personalisierte Emails über Resend API

const https = require('https');

// Resend API Key aus Environment oder hardcoded für lokalen Test
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_PjDLaHWF_3gg2L4BQAi48NqKu1yqQp4XU';

const leads = [
  {
    name: 'Steinheil 16',
    email: 'steinheil16@t-online.de',
    reviews: 1263,
    type: 'German, Austrian'
  },
  {
    name: 'Augustiner-Keller',
    email: 'buero@augustinerkeller.de',
    reviews: 781,
    type: 'Bavarian/Beer Garden'
  },
  {
    name: 'Schiller Bräu',
    email: 'info@schiller-braeu.de',
    reviews: 706,
    type: 'German, Brew Pub'
  }
];

function generateEmail(lead) {
  const subject = `${lead.reviews} Bewertungen - Antworten Sie auf alle mit AI?`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <p>Guten Tag,</p>

  <p>ich habe gesehen, dass <strong>${lead.name}</strong> über <strong>${lead.reviews} Bewertungen</strong> auf TripAdvisor und Yelp hat - das ist beeindruckend!</p>

  <p>Aber Hand aufs Herz: Wie viele davon bleiben unbeantwortet?</p>

  <p>Mit <strong>ReviewResponder</strong> können Sie:</p>
  <ul>
    <li>AI-generierte, personalisierte Antworten in Sekunden erstellen</li>
    <li>Den richtigen Ton treffen (professionell, freundlich, oder entschuldigend)</li>
    <li>Zeit sparen und trotzdem jeden Gast wertschätzen</li>
  </ul>

  <p><strong>20 kostenlose Antworten pro Monat</strong> - ohne Kreditkarte, ohne Verpflichtung.</p>

  <p>Hier können Sie es sofort testen:<br>
  <a href="https://tryreviewresponder.com?utm_source=cold_email&utm_campaign=munich_restaurants&utm_content=${encodeURIComponent(lead.name)}" style="color: #2563eb;">https://tryreviewresponder.com</a></p>

  <p>Falls Sie Fragen haben, antworten Sie einfach auf diese Email.</p>

  <p>Mit freundlichen Grüßen,<br>
  Berend Mainz<br>
  <span style="color: #666;">ReviewResponder</span></p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #999;">
    Sie erhalten diese Email, weil Ihr Restaurant viele Online-Bewertungen hat.<br>
    <a href="https://tryreviewresponder.com/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #999;">Abmelden</a>
  </p>
</body>
</html>
  `;

  return { subject, html };
}

async function sendEmail(lead) {
  const { subject, html } = generateEmail(lead);

  const data = JSON.stringify({
    from: 'Berend von ReviewResponder <hello@tryreviewresponder.com>',
    to: [lead.email],
    subject: subject,
    html: html,
    reply_to: 'berend.mainz@web.de'
  });

  const options = {
    hostname: 'api.resend.com',
    port: 443,
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✓ Email sent to ${lead.name} (${lead.email})`);
          resolve(JSON.parse(body));
        } else {
          console.error(`✗ Failed for ${lead.name}: ${body}`);
          reject(new Error(body));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Sending cold emails to Munich restaurants...\n');

  for (const lead of leads) {
    try {
      await sendEmail(lead);
      // Wait 1 second between emails to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      console.error(`Error sending to ${lead.name}:`, error.message);
    }
  }

  console.log('\nDone! Check Resend dashboard for delivery status.');
}

main();
