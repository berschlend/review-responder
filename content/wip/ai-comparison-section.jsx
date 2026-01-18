{/* AI Comparison Section - Why We're Different */}
{/*
  TODO (morgen finishen):
  - Von der Seite entfernen oder überarbeiten
  - Berend: "weg von der seite müssen wir morgen finishen"

  Original Location: frontend/src/App.js, Zeilen 3929-4130
*/}
<section
  style={{
    padding: '64px 20px',
    background: 'var(--bg-primary)',
    borderBottom: '1px solid var(--border-color)',
  }}
>
  <div style={{ maxWidth: '900px', margin: '0 auto' }}>
    <h2
      style={{
        textAlign: 'center',
        marginBottom: '12px',
        fontSize: '1.75rem',
        fontWeight: '700',
        color: 'var(--text-primary)',
      }}
    >
      Still Using Generic AI Tools?
    </h2>
    <p
      style={{
        textAlign: 'center',
        color: 'var(--text-muted)',
        marginBottom: '40px',
        fontSize: '1rem',
      }}
    >
      Here's what your competitors' responses look like.
    </p>

    {/* Side-by-Side Response Comparison */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
      }}
    >
      {/* Competitor Response */}
      <div
        style={{
          padding: '24px',
          background: 'var(--bg-tertiary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <X size={20} color="#ef4444" />
          <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>
            Typical AI Tools
          </span>
        </div>
        <p
          style={{
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            marginBottom: '12px',
          }}
        >
          "Dear Customer, we're genuinely sorry to hear about your experience. Thank you for
          bringing this to our attention. Your feedback is appreciated as it helps us
          improve. We would love the opportunity to make things right. Please contact us so
          we can fix this."
        </p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>47 words</span>
          <span>•</span>
          <span>Generic</span>
          <span>•</span>
          <span>No specifics</span>
        </div>
      </div>

      {/* ReviewResponder Response */}
      <div
        style={{
          padding: '24px',
          background: 'rgba(79, 70, 229, 0.05)',
          borderRadius: '12px',
          border: '2px solid var(--primary)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <Check size={20} color="var(--primary)" />
          <span style={{ fontWeight: '600', color: 'var(--primary)' }}>ReviewResponder</span>
          <span
            style={{
              fontSize: '0.65rem',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '600',
            }}
          >
            REAL OUTPUT
          </span>
        </div>
        <p
          style={{
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            marginBottom: '12px',
          }}
        >
          "That's unacceptable on every level. Cold food and poor service aren't what we
          stand for - let me fix this personally."
        </p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            fontSize: '0.75rem',
            color: 'var(--primary)',
            fontWeight: '500',
          }}
        >
          <span>22 words</span>
          <span>•</span>
          <span>Direct</span>
          <span>•</span>
          <span>Takes ownership</span>
        </div>
      </div>
    </div>

    {/* Context Badge */}
    <div
      style={{
        textAlign: 'center',
        marginBottom: '24px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
      }}
    >
      <span
        style={{
          background: 'var(--bg-secondary)',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
        }}
      >
        Same 2-star review • "Waited 45 minutes for food, arrived cold"
      </span>
    </div>

    {/* CTA Button */}
    <div style={{ textAlign: 'center' }}>
      <Link
        to="/register"
        className="btn btn-primary"
        style={{
          padding: '12px 28px',
          fontSize: '0.95rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        Try It Free <ArrowRight size={16} />
      </Link>
      <p
        style={{
          marginTop: '12px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}
      >
        20 free responses/month • No credit card required
      </p>
    </div>
  </div>
</section>
