import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Code, Copy, Check, Key, Zap, Shield, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ApiDocsPage = () => {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ code, language = 'bash', id }) => (
    <div style={{ position: 'relative', background: '#1e1e1e', borderRadius: '8px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #333', color: '#888', fontSize: '12px' }}>
        <span>{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {copied === id ? <Check size={14} /> : <Copy size={14} />}
          {copied === id ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{ padding: '16px', margin: 0, overflow: 'auto', color: '#d4d4d4', fontSize: '13px', lineHeight: '1.5' }}>
        <code>{code}</code>
      </pre>
    </div>
  );

  const curlExample = `curl -X POST https://review-responder.onrender.com/api/v1/generate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "review_text": "Great food and excellent service!",
    "review_rating": 5,
    "tone": "friendly",
    "language": "en",
    "platform": "google"
  }'`;

  const responseExample = `{
  "success": true,
  "response": "Thank you so much for your wonderful review! We're thrilled to hear you enjoyed both the food and service. Your kind words mean a lot to our team, and we can't wait to welcome you back soon!",
  "tone": "friendly",
  "language": "en",
  "platform": "google"
}`;

  const pythonExample = `import requests

response = requests.post(
    "https://review-responder.onrender.com/api/v1/generate",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": "YOUR_API_KEY"
    },
    json={
        "review_text": "Great food and excellent service!",
        "review_rating": 5,
        "tone": "friendly"
    }
)

print(response.json())`;

  const jsExample = `const response = await fetch(
  'https://review-responder.onrender.com/api/v1/generate',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'YOUR_API_KEY'
    },
    body: JSON.stringify({
      review_text: 'Great food and excellent service!',
      review_rating: 5,
      tone: 'friendly'
    })
  }
);

const data = await response.json();
console.log(data);`;

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link to="/settings" style={{ color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px', fontSize: '14px' }}>
          &#8592; Back to Settings
        </Link>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Code size={32} />
          API Documentation
        </h1>
        <p style={{ color: 'var(--gray-600)', fontSize: '18px' }}>
          Integrate ReviewResponder into your applications with our REST API
        </p>
      </div>

      {/* Quick Start */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Quick Start</h2>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--primary-100)', borderRadius: '8px', padding: '8px' }}>
              <Key size={20} style={{ color: 'var(--primary-600)' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>1. Get API Key</h3>
              <p style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                Generate an API key in your <Link to="/settings" style={{ color: 'var(--primary-600)' }}>Settings</Link>
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--primary-100)', borderRadius: '8px', padding: '8px' }}>
              <Zap size={20} style={{ color: 'var(--primary-600)' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>2. Make Requests</h3>
              <p style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                Include your API key in the X-API-Key header
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--primary-100)', borderRadius: '8px', padding: '8px' }}>
              <Shield size={20} style={{ color: 'var(--primary-600)' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>3. Rate Limits</h3>
              <p style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                100 requests per day, resets at midnight UTC
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Authentication</h2>
        <p style={{ marginBottom: '16px', color: 'var(--gray-600)' }}>
          All API requests require authentication via the <code style={{ background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '4px' }}>X-API-Key</code> header.
        </p>
        <div style={{ background: 'var(--warning-50)', border: '1px solid var(--warning-200)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
          <p style={{ color: 'var(--warning-700)', fontSize: '14px' }}>
            <strong>Important:</strong> Keep your API key secure. Never expose it in client-side code or public repositories.
          </p>
        </div>
        <CodeBlock
          code={`curl -H "X-API-Key: rr_your_api_key_here" ...`}
          language="bash"
          id="auth"
        />
      </div>

      {/* Endpoint */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          <Globe size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          POST /api/v1/generate
        </h2>
        <p style={{ marginBottom: '16px', color: 'var(--gray-600)' }}>
          Generate an AI-powered response to a customer review.
        </p>

        <h3 style={{ fontWeight: '600', marginBottom: '12px', marginTop: '24px' }}>Request Body</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600' }}>Parameter</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600' }}>Required</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <td style={{ padding: '12px 8px' }}><code>review_text</code></td>
              <td style={{ padding: '12px 8px' }}>string</td>
              <td style={{ padding: '12px 8px' }}>Yes</td>
              <td style={{ padding: '12px 8px', color: 'var(--gray-600)' }}>The customer review text to respond to</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <td style={{ padding: '12px 8px' }}><code>review_rating</code></td>
              <td style={{ padding: '12px 8px' }}>number</td>
              <td style={{ padding: '12px 8px' }}>No</td>
              <td style={{ padding: '12px 8px', color: 'var(--gray-600)' }}>Star rating (1-5) for context</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <td style={{ padding: '12px 8px' }}><code>tone</code></td>
              <td style={{ padding: '12px 8px' }}>string</td>
              <td style={{ padding: '12px 8px' }}>No</td>
              <td style={{ padding: '12px 8px', color: 'var(--gray-600)' }}>Response tone: "professional", "friendly", "formal", "apologetic"</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <td style={{ padding: '12px 8px' }}><code>language</code></td>
              <td style={{ padding: '12px 8px' }}>string</td>
              <td style={{ padding: '12px 8px' }}>No</td>
              <td style={{ padding: '12px 8px', color: 'var(--gray-600)' }}>Language code (e.g., "en", "de", "es", "fr")</td>
            </tr>
            <tr>
              <td style={{ padding: '12px 8px' }}><code>platform</code></td>
              <td style={{ padding: '12px 8px' }}>string</td>
              <td style={{ padding: '12px 8px' }}>No</td>
              <td style={{ padding: '12px 8px', color: 'var(--gray-600)' }}>Platform: "google", "yelp", "tripadvisor", etc.</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ fontWeight: '600', marginBottom: '12px' }}>Example Request (cURL)</h3>
        <CodeBlock code={curlExample} language="bash" id="curl" />

        <h3 style={{ fontWeight: '600', marginBottom: '12px' }}>Example Response</h3>
        <CodeBlock code={responseExample} language="json" id="response" />
      </div>

      {/* Code Examples */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Code Examples</h2>

        <h3 style={{ fontWeight: '600', marginBottom: '12px' }}>Python</h3>
        <CodeBlock code={pythonExample} language="python" id="python" />

        <h3 style={{ fontWeight: '600', marginBottom: '12px' }}>JavaScript</h3>
        <CodeBlock code={jsExample} language="javascript" id="javascript" />
      </div>

      {/* Error Codes */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Error Codes</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600' }}>Error</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <td style={{ padding: '12px 8px' }}><code>400</code></td>
              <td style={{ padding: '12px 8px' }}>Bad Request</td>
              <td style={{ padding: '12px 8px', color: 'var(--gray-600)' }}>Missing or invalid review_text</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <td style={{ padding: '12px 8px' }}><code>401</code></td>
              <td style={{ padding: '12px 8px' }}>Unauthorized</td>
              <td style={{ padding: '12px 8px', color: 'var(--gray-600)' }}>Missing or invalid API key</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <td style={{ padding: '12px 8px' }}><code>403</code></td>
              <td style={{ padding: '12px 8px' }}>Forbidden</td>
              <td style={{ padding: '12px 8px', color: 'var(--gray-600)' }}>API access requires Unlimited plan</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
              <td style={{ padding: '12px 8px' }}><code>429</code></td>
              <td style={{ padding: '12px 8px' }}>Rate Limited</td>
              <td style={{ padding: '12px 8px', color: 'var(--gray-600)' }}>Exceeded 100 requests/day limit</td>
            </tr>
            <tr>
              <td style={{ padding: '12px 8px' }}><code>500</code></td>
              <td style={{ padding: '12px 8px' }}>Server Error</td>
              <td style={{ padding: '12px 8px', color: 'var(--gray-600)' }}>Internal server error</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Rate Limits */}
      <div className="card">
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Rate Limits</h2>
        <ul style={{ color: 'var(--gray-600)', lineHeight: '1.8' }}>
          <li><strong>100 requests per day</strong> per API key</li>
          <li>Rate limits reset at <strong>midnight UTC</strong></li>
          <li>Your current usage is shown in the Settings page</li>
          <li>Need more? Contact us at <a href="mailto:berend.mainz@web.de" style={{ color: 'var(--primary-600)' }}>berend.mainz@web.de</a></li>
        </ul>
      </div>
    </div>
  );
};

export default ApiDocsPage;
