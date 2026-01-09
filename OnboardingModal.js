// Onboarding Modal Component - to be integrated into App.js
const OnboardingModal = ({ isVisible, onComplete, onSkip }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Business Name
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  
  // Step 2: Sample Review
  const [sampleReview, setSampleReview] = useState('');
  const [sampleResponse, setSampleResponse] = useState('');
  const [generating, setGenerating] = useState(false);
  
  const sampleReviews = [
    "Great service and fast delivery! Really happy with my experience. Will definitely come back again.",
    "The food was amazing and the staff was very friendly. Highly recommend this place to everyone!",
    "Terrible experience. The product broke after one day and customer service was unhelpful."
  ];

  useEffect(() => {
    if (isVisible && sampleReview === '') {
      setSampleReview(sampleReviews[0]);
    }
  }, [isVisible]);

  const nextStep = () => {
    if (currentStep === 1 && businessName.trim()) {
      updateBusinessProfile();
    } else if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const updateBusinessProfile = async () => {
    try {
      await api.put('/auth/profile', {
        businessName: businessName.trim()
      });
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to update business name:', error);
      toast.error('Failed to save business name');
    }
  };

  const generateSampleResponse = async () => {
    if (!sampleReview.trim()) return;
    
    setGenerating(true);
    try {
      const response = await api.post('/generate', {
        reviewText: sampleReview,
        tone: 'professional',
        platform: 'google'
      });
      
      setSampleResponse(response.data.response);
      toast.success('Sample response generated!');
    } catch (error) {
      console.error('Failed to generate sample response:', error);
      toast.error('Failed to generate response');
    } finally {
      setGenerating(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await api.put('/auth/complete-onboarding');
      toast.success('Welcome to ReviewResponder! 🎉');
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const skipOnboarding = async () => {
    try {
      await api.put('/auth/complete-onboarding');
      onSkip();
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div 
        className="card" 
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '0',
          overflow: 'hidden',
          position: 'relative',
          animation: 'slideIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          color: 'white',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>
            Welcome to ReviewResponder! 🎉
          </h2>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Let's get you set up in just 3 quick steps
          </p>
          
          {/* Progress bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '20px'
          }}>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                style={{
                  width: '32px',
                  height: '4px',
                  borderRadius: '2px',
                  background: step <= currentStep ? 'white' : 'rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {/* Step 1: Business Name */}
          {currentStep === 1 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                What's your business name?
              </h3>
              <p style={{ color: 'var(--gray-600)', marginBottom: '20px', fontSize: '14px' }}>
                This helps us personalize your review responses
              </p>
              
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Tony's Pizza, Smith & Co Law Firm"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && businessName.trim() && nextStep()}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step 2: Generate Sample Response */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Let's generate your first response!
              </h3>
              <p style={{ color: 'var(--gray-600)', marginBottom: '20px', fontSize: '14px' }}>
                Here's a sample review. Click "Generate Response" to see the magic ✨
              </p>
              
              <div className="form-group">
                <label className="form-label">Sample Review</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={sampleReview}
                  onChange={(e) => setSampleReview(e.target.value)}
                />
              </div>
              
              {!sampleResponse && (
                <button
                  className="btn btn-primary"
                  onClick={generateSampleResponse}
                  disabled={generating || !sampleReview.trim()}
                  style={{ width: '100%', marginBottom: '16px' }}
                >
                  {generating ? 'Generating...' : '🪄 Generate Response'}
                </button>
              )}
              
              {sampleResponse && (
                <div>
                  <label className="form-label" style={{ color: 'var(--primary)' }}>
                    ✨ AI-Generated Response
                  </label>
                  <div style={{
                    background: 'var(--gray-50)',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {sampleResponse}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>
                    Pretty cool, right? You can customize tone, add business context, and more!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Chrome Extension */}
          {currentStep === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                You're all set!
              </h3>
              <p style={{ color: 'var(--gray-600)', marginBottom: '24px', fontSize: '14px' }}>
                Want to make responding even faster? Install our Chrome extension to respond directly from Google Reviews, Yelp, and more.
              </p>
              
              <div style={{
                background: 'var(--gray-50)',
                border: '1px solid var(--gray-200)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <Chrome size={32} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Chrome Extension
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '16px' }}>
                  Generate responses without leaving the review page
                </p>
                <Link
                  to="/extension"
                  className="btn btn-secondary"
                  style={{ fontSize: '14px', padding: '8px 16px' }}
                >
                  <Download size={16} />
                  Install Extension
                </Link>
              </div>
              
              <p style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                Don't worry - you can always install it later from the dashboard
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--gray-200)',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            className="btn btn-secondary"
            onClick={skipOnboarding}
            disabled={loading}
            style={{ fontSize: '14px' }}
          >
            Skip for now
          </button>
          
          {currentStep < 3 ? (
            <button
              className="btn btn-primary"
              onClick={nextStep}
              disabled={(currentStep === 1 && !businessName.trim()) || (currentStep === 2 && !sampleResponse)}
            >
              {currentStep === 1 ? 'Continue' : 'Next'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={completeOnboarding}
              disabled={loading}
            >
              {loading ? 'Finishing...' : '🚀 Start Using ReviewResponder'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};