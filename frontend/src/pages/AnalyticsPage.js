import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BarChart2, TrendingUp, TrendingDown, Lock, AlertCircle, Check, Globe, PieChart } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const TONE_COLORS = {
    professional: '#4F46E5',
    friendly: '#10B981',
    formal: '#6366F1',
    apologetic: '#F59E0B'
  };

  const PLATFORM_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics');
      setAnalytics(res.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('upgrade');
      } else {
        setError('Failed to load analytics');
        toast.error('Failed to load analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  if (error === 'upgrade') {
    return (
      <div className="container" style={{ marginTop: '40px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <BarChart2 size={40} style={{ color: 'var(--primary-600)' }} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
            Analytics Dashboard
          </h1>
          <p style={{ color: 'var(--gray-600)', marginBottom: '24px', fontSize: '16px' }}>
            Get detailed insights into your review response patterns with beautiful charts and statistics.
          </p>

          <div style={{
            background: 'var(--gray-50)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>What you'll get:</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Total responses over time (line chart)',
                'Responses by tone distribution (pie chart)',
                'Platform breakdown',
                'Weekly comparison insights',
                'Average responses per day'
              ].map((feature, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: 'var(--gray-700)' }}>
                  <Check size={18} style={{ color: 'var(--secondary)' }} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '14px', color: 'var(--primary-700)' }}>
              <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Available on <strong>Professional</strong> and <strong>Unlimited</strong> plans
            </p>
          </div>

          <Link to="/pricing" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Upgrade to Unlock Analytics
          </Link>
          <Link to="/dashboard" style={{ display: 'block', marginTop: '16px', color: 'var(--gray-500)' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '40px' }}>
        <div className="loading">
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: 'var(--gray-500)' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error && error !== 'upgrade') {
    return (
      <div className="container" style={{ marginTop: '40px', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)' }} />
        <h2 style={{ marginTop: '16px' }}>Failed to load analytics</h2>
        <button onClick={fetchAnalytics} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Try Again
        </button>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="container" style={{ marginTop: '40px', marginBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
            <BarChart2 size={28} style={{ verticalAlign: 'middle', marginRight: '12px', color: 'var(--primary-600)' }} />
            Analytics Dashboard
          </h1>
          <p style={{ color: 'var(--gray-500)' }}>Track your review response patterns and insights</p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-label">Total Responses</div>
          <div className="stat-value primary">{analytics?.totalResponses || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Week</div>
          <div className="stat-value">{analytics?.insights?.thisWeek || 0}</div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px',
            color: analytics?.insights?.weeklyChange >= 0 ? 'var(--secondary)' : 'var(--danger)',
            fontSize: '13px'
          }}>
            {analytics?.insights?.weeklyChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(analytics?.insights?.weeklyChange || 0)} vs last week
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg per Day</div>
          <div className="stat-value">{analytics?.insights?.avgPerDay || '0'}</div>
          <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>Last 30 days</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Most Used Tone</div>
          <div className="stat-value" style={{ fontSize: '20px', textTransform: 'capitalize' }}>
            {analytics?.insights?.mostUsedTone || 'N/A'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary-600)' }} />
            Responses Over Time
          </h3>
          {analytics?.overTime?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.overTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  allowDecimals={false}
                />
                <Tooltip
                  labelFormatter={formatDate}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                />
                <Line
                  type="monotone"
                  dataKey="responses"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={{ fill: '#4F46E5', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
              No data available yet
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={20} style={{ color: 'var(--primary-600)' }} />
            Responses by Tone
          </h3>
          {analytics?.byTone?.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="60%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={analytics.byTone}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {analytics.byTone.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={TONE_COLORS[entry.name] || PLATFORM_COLORS[index % PLATFORM_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {analytics.byTone.map((entry, index) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: TONE_COLORS[entry.name] || PLATFORM_COLORS[index % PLATFORM_COLORS.length]
                    }} />
                    <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{entry.name}</span>
                    <span style={{ fontSize: '14px', color: 'var(--gray-500)', marginLeft: 'auto' }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
              No data available yet
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={20} style={{ color: 'var(--primary-600)' }} />
            Responses by Platform
          </h3>
          {analytics?.byPlatform?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.byPlatform} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  width={80}
                />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
              No data available yet
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%' }}>
              Generate New Response
            </Link>
            <Link to="/settings" className="btn btn-secondary" style={{ width: '100%' }}>
              Update Business Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
