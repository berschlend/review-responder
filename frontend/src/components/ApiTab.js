import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Code, Key, Zap, BookOpen, Settings, Trash2, Copy, CheckCircle, AlertCircle } from 'lucide-react';

const ApiTab = ({ user, api, effectivePlan, isTeamMember }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [editingKeyId, setEditingKeyId] = useState(null);
  const [editingKeyName, setEditingKeyName] = useState('');
  const [apiDocSection, setApiDocSection] = useState('quickstart');

  // Use effectivePlan for team members
  const actualPlan = effectivePlan || user?.plan;
  const canUseApi = actualPlan === 'unlimited';

  const fetchApiKeys = async () => {
    if (!canUseApi) return;
    setLoadingApiKeys(true);
    try {
      const res = await api.get('/keys');
      setApiKeys(res.data.keys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoadingApiKeys(false);
    }
  };

  useEffect(() => {
    if (canUseApi) {
      fetchApiKeys();
    }
  }, [actualPlan]);

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }
    setCreatingKey(true);
    try {
      const res = await api.post('/keys', { name: newKeyName.trim() });
      setNewlyCreatedKey(res.data.key);
      toast.success('API key created! Save it now - it won\'t be shown again.');
      setNewKeyName('');
      fetchApiKeys();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const updateApiKey = async (keyId, updates) => {
    try {
      await api.put(`/keys/${keyId}`, updates);
      toast.success('API key updated');
      fetchApiKeys();
      setEditingKeyId(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update API key');
    }
  };

  const deleteApiKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;
    try {
      await api.delete(`/keys/${keyId}`);
      toast.success('API key deleted');
      fetchApiKeys();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete API key');
    }
  };

  const copyApiKey = (key) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  // Show upgrade prompt for non-unlimited users (but team members with unlimited access can use it)
  if (!canUseApi) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Code size={40} style={{ color: 'var(--primary-600)' }} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>API Access</h2>
        <p style={{ color: 'var(--gray-600)', maxWidth: '400px', margin: '0 auto 24px' }}>
          Integrate ReviewResponder into your own applications with our REST API. Available exclusively for Unlimited plan subscribers.
        </p>
        <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '20px', maxWidth: '400px', margin: '0 auto 24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>What you get:</h3>
          <ul style={{ textAlign: 'left', fontSize: '14px', color: 'var(--gray-600)', listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} style={{ color: 'var(--success-500)' }} /> Up to 5 API keys</li>
            <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} style={{ color: 'var(--success-500)' }} /> 100 requests per day per key</li>
            <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} style={{ color: 'var(--success-500)' }} /> Full API documentation</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} style={{ color: 'var(--success-500)' }} /> cURL, JavaScript, Python examples</li>
          </ul>
        </div>
        <Link to="/pricing" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
          <Zap size={18} /> Upgrade to Unlimited
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* API Keys Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={20} /> API Keys
          </h2>
          <button
            className="btn btn-primary"
            onClick={() => { setShowCreateKeyModal(true); setNewlyCreatedKey(null); setNewKeyName(''); }}
            disabled={apiKeys.length >= 5}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            <Zap size={16} /> Create API Key
          </button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '20px' }}>
          Use API keys to integrate ReviewResponder into your applications. Each key has a limit of 100 requests per day.
        </p>

        {loadingApiKeys ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', background: 'var(--gray-50)', borderRadius: '8px' }}>
            <Key size={32} style={{ color: 'var(--gray-400)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--gray-500)' }}>No API keys yet. Create one to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {apiKeys.map((key) => (
              <div key={key.id} style={{ background: 'var(--gray-50)', borderRadius: '8px', padding: '16px', border: '1px solid var(--gray-200)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    {editingKeyId === key.id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="text" className="form-input" value={editingKeyName} onChange={(e) => setEditingKeyName(e.target.value)} style={{ padding: '6px 10px', fontSize: '14px' }} autoFocus />
                        <button className="btn btn-primary" onClick={() => updateApiKey(key.id, { name: editingKeyName })} style={{ padding: '6px 12px', fontSize: '13px' }}>Save</button>
                        <button className="btn btn-secondary" onClick={() => setEditingKeyId(null)} style={{ padding: '6px 12px', fontSize: '13px' }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', fontSize: '15px' }}>{key.name}</span>
                        <button onClick={() => { setEditingKeyId(key.id); setEditingKeyName(key.name); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--gray-400)' }}>
                          <Settings size={14} />
                        </button>
                      </div>
                    )}
                    <div style={{ marginTop: '4px' }}>
                      <code style={{ background: 'var(--gray-200)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontFamily: 'monospace', color: 'var(--gray-700)' }}>
                        {key.key_prefix}...
                      </code>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Today</div>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>{key.requests_today}/100</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Total</div>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>{key.requests_total}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => updateApiKey(key.id, { isActive: !key.is_active })} style={{ background: key.is_active ? 'var(--success-100)' : 'var(--gray-200)', color: key.is_active ? 'var(--success-700)' : 'var(--gray-600)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button onClick={() => deleteApiKey(key.id)} style={{ background: 'var(--error-100)', color: 'var(--error-600)', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                {key.last_request_at && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--gray-500)' }}>
                    Last used: {new Date(key.last_request_at).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {apiKeys.length >= 5 && (
          <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--gray-500)' }}>
            Maximum 5 API keys reached. Delete an existing key to create a new one.
          </p>
        )}
      </div>

      {/* API Documentation Section */}
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} /> API Documentation
        </h2>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0' }}>
          {['quickstart', 'reference', 'errors'].map((section) => (
            <button key={section} onClick={() => setApiDocSection(section)} style={{ padding: '10px 16px', background: apiDocSection === section ? 'var(--primary-50)' : 'transparent', border: 'none', borderBottom: apiDocSection === section ? '2px solid var(--primary-600)' : '2px solid transparent', color: apiDocSection === section ? 'var(--primary-600)' : 'var(--gray-600)', fontWeight: apiDocSection === section ? '600' : '500', cursor: 'pointer', fontSize: '14px', marginBottom: '-1px' }}>
              {section === 'quickstart' ? 'Quick Start' : section === 'reference' ? 'Reference' : 'Errors'}
            </button>
          ))}
        </div>

        {apiDocSection === 'quickstart' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Getting Started</h3>
            <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '16px' }}>
              Generate AI-powered review responses with a single API call. Include your API key in the X-API-Key header.
            </p>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', marginTop: '20px' }}>cURL</h4>
            <pre style={{ background: 'var(--gray-900)', color: '#e5e7eb', padding: '16px', borderRadius: '8px', fontSize: '13px', overflowX: 'auto', fontFamily: 'monospace' }}>
{`curl -X POST https://review-responder.onrender.com/api/v1/generate \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"review_text": "Great service!", "tone": "professional"}'`}
            </pre>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', marginTop: '20px' }}>JavaScript</h4>
            <pre style={{ background: 'var(--gray-900)', color: '#e5e7eb', padding: '16px', borderRadius: '8px', fontSize: '13px', overflowX: 'auto', fontFamily: 'monospace' }}>
{`const response = await fetch('https://review-responder.onrender.com/api/v1/generate', {
  method: 'POST',
  headers: { 'X-API-Key': 'YOUR_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ review_text: 'Great service!', tone: 'professional' })
});
const data = await response.json();`}
            </pre>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', marginTop: '20px' }}>Python</h4>
            <pre style={{ background: 'var(--gray-900)', color: '#e5e7eb', padding: '16px', borderRadius: '8px', fontSize: '13px', overflowX: 'auto', fontFamily: 'monospace' }}>
{`import requests

response = requests.post(
    'https://review-responder.onrender.com/api/v1/generate',
    headers={'X-API-Key': 'YOUR_API_KEY'},
    json={'review_text': 'Great service!', 'tone': 'professional'}
)
data = response.json()`}
            </pre>
          </div>
        )}

        {apiDocSection === 'reference' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>POST /api/v1/generate</h3>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Request Body</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>Parameter</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>Type</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}><code>review_text</code></td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}>string (required)</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-600)' }}>Customer review text</td></tr>
                <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}><code>review_rating</code></td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}>integer</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-600)' }}>Star rating (1-5)</td></tr>
                <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}><code>tone</code></td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}>string</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-600)' }}>professional, friendly, formal, apologetic</td></tr>
                <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}><code>language</code></td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}>string</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-600)' }}>Language code (en, de, es, etc.)</td></tr>
                <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}><code>platform</code></td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}>string</td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-600)' }}>google, yelp, facebook, tripadvisor</td></tr>
              </tbody>
            </table>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Response</h4>
            <pre style={{ background: 'var(--gray-900)', color: '#e5e7eb', padding: '16px', borderRadius: '8px', fontSize: '13px', overflowX: 'auto', fontFamily: 'monospace' }}>
{`{
  "success": true,
  "response": "Thank you for your wonderful feedback!...",
  "tone": "professional",
  "language": "en"
}`}
            </pre>

            <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px', fontSize: '14px', marginTop: '16px' }}>
              <strong>Rate Limit:</strong> 100 requests per day per API key. Resets at midnight UTC.
            </div>
          </div>
        )}

        {apiDocSection === 'errors' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Error Codes</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>Code</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}><code style={{ color: 'var(--error-600)' }}>400</code></td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-600)' }}>Missing review_text in request body</td></tr>
                <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}><code style={{ color: 'var(--error-600)' }}>401</code></td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-600)' }}>Missing or invalid API key</td></tr>
                <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}><code style={{ color: 'var(--error-600)' }}>403</code></td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-600)' }}>Unlimited plan required for API access</td></tr>
                <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}><code style={{ color: 'var(--error-600)' }}>429</code></td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-600)' }}>Rate limit exceeded (100 requests/day)</td></tr>
                <tr><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)' }}><code style={{ color: 'var(--error-600)' }}>500</code></td><td style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-600)' }}>Internal server error</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateKeyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => !newlyCreatedKey && setShowCreateKeyModal(false)}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            {!newlyCreatedKey ? (
              <>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={20} /> Create New API Key
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '20px' }}>
                  Give your API key a name to help you identify it later.
                </p>
                <div className="form-group">
                  <label className="form-label">Key Name</label>
                  <input type="text" className="form-input" placeholder="e.g., Production Server, My App" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} maxLength={50} autoFocus />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button className="btn btn-secondary" onClick={() => setShowCreateKeyModal(false)} style={{ flex: 1 }}>Cancel</button>
                  <button className="btn btn-primary" onClick={createApiKey} disabled={creatingKey || !newKeyName.trim()} style={{ flex: 1 }}>{creatingKey ? 'Creating...' : 'Create Key'}</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: '60px', height: '60px', background: 'var(--success-100)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={32} style={{ color: 'var(--success-600)' }} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>API Key Created!</h2>
                <div style={{ background: 'var(--warning-50)', border: '1px solid var(--warning-200)', borderRadius: '8px', padding: '12px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertCircle size={20} style={{ color: 'var(--warning-600)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--warning-800)', margin: 0 }}>
                    <strong>Important:</strong> This is the only time you'll see this key. Copy it now and store it securely.
                  </p>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label">Your API Key</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="form-input" value={newlyCreatedKey} readOnly style={{ fontFamily: 'monospace', fontSize: '13px' }} />
                    <button className="btn btn-primary" onClick={() => copyApiKey(newlyCreatedKey)} style={{ flexShrink: 0 }}>
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => { setShowCreateKeyModal(false); setNewlyCreatedKey(null); }} style={{ width: '100%' }}>Done</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTab;
