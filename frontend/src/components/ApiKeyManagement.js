import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Key, Code, Check, Eye, EyeOff, Copy, Trash2, Lock } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ApiKeyManagement = ({ user }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [showFullKey, setShowFullKey] = useState(false);

  useEffect(() => {
    if (user?.plan === 'unlimited') {
      loadApiKeys();
    }
  }, [user?.plan]);

  const loadApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await api.get('/keys');
      setApiKeys(res.data.keys || []);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoadingKeys(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }
    setCreatingKey(true);
    try {
      const res = await api.post('/keys', { name: newKeyName.trim() });
      setNewApiKey(res.data.apiKey);
      setNewKeyName('');
      loadApiKeys();
      toast.success('API key created! Copy it now - it won\'t be shown again.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const deleteApiKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/keys/${keyId}`);
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
      toast.success('API key deleted');
    } catch (error) {
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // For non-Unlimited users - show upgrade prompt
  if (user?.plan !== 'unlimited') {
    return (
      <div className="card" style={{ marginTop: '40px', textAlign: 'center', padding: '32px' }}>
        <Lock size={32} style={{ color: 'var(--gray-400)', marginBottom: '12px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>API Access</h3>
        <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>
          Programmatic API access is available on the Unlimited plan.
        </p>
        <Link to="/pricing" className="btn btn-primary">
          Upgrade to Unlimited
        </Link>
      </div>
    );
  }

  // For Unlimited users - show API key management
  return (
    <div style={{ marginTop: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={20} />
            API Access
          </h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
            Manage your API keys for programmatic access
          </p>
        </div>
        <Link to="/api-docs" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Code size={16} />
          View API Docs
        </Link>
      </div>

      {/* New Key Created Banner */}
      {newApiKey && (
        <div className="card" style={{
          marginBottom: '20px',
          padding: '16px',
          background: 'linear-gradient(135deg, var(--success-50, #f0fdf4), var(--success-100, #dcfce7))',
          border: '1px solid var(--success)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Check size={20} style={{ color: 'var(--success)' }} />
            <strong style={{ color: 'var(--success)' }}>API Key Created!</strong>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--gray-700)', marginBottom: '12px' }}>
            Copy your API key now. For security, it won't be shown again.
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--gray-900)',
            borderRadius: '6px',
            padding: '12px',
            fontFamily: 'monospace'
          }}>
            <code style={{ flex: 1, color: 'var(--gray-100)', wordBreak: 'break-all' }}>
              {showFullKey ? newApiKey : newApiKey.substring(0, 20) + '...' + newApiKey.substring(newApiKey.length - 8)}
            </code>
            <button
              onClick={() => setShowFullKey(!showFullKey)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              {showFullKey ? <EyeOff size={18} color="var(--gray-400)" /> : <Eye size={18} color="var(--gray-400)" />}
            </button>
            <button
              onClick={() => copyToClipboard(newApiKey)}
              className="btn btn-primary"
              style={{ padding: '6px 12px' }}
            >
              <Copy size={14} />
              Copy
            </button>
          </div>
          <button
            onClick={() => { setNewApiKey(null); setShowFullKey(false); }}
            style={{
              marginTop: '12px',
              background: 'transparent',
              border: 'none',
              color: 'var(--gray-600)',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create New Key */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Create New API Key</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="form-input"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., Production, Development)"
            style={{ flex: 1 }}
          />
          <button
            onClick={createApiKey}
            className="btn btn-primary"
            disabled={creatingKey || !newKeyName.trim()}
          >
            {creatingKey ? 'Creating...' : 'Create Key'}
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '8px' }}>
          Rate limit: 100 requests per day per key. Resets at midnight UTC.
        </p>
      </div>

      {/* Existing Keys */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Your API Keys</h3>
        {loadingKeys ? (
          <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '20px' }}>Loading...</p>
        ) : apiKeys.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '20px' }}>
            No API keys yet. Create one above to get started.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {apiKeys.map((key) => (
              <div
                key={key.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--gray-50)',
                  borderRadius: '8px',
                  border: '1px solid var(--gray-200)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>{key.name}</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--gray-500)' }}>
                    <span>
                      <code style={{ background: 'var(--gray-200)', padding: '2px 6px', borderRadius: '4px' }}>
                        {key.key_prefix}...
                      </code>
                    </span>
                    <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                    <span>Today: {key.requests_today}/100 requests</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteApiKey(key.id)}
                  className="btn"
                  style={{
                    background: 'transparent',
                    color: 'var(--danger)',
                    border: '1px solid var(--danger)',
                    padding: '6px 12px'
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeyManagement;
