$filePath = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder\frontend\src\App.js"
$content = Get-Content $filePath -Raw

# Replace the dependency array
$oldPattern = '}, [location.search]);'
$newCode = @'
}, []);

  // Effect 2: Check onboarding status (runs when user changes)
  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setShowOnboarding(true);
    }
    if (user && user.responsesUsed === 0) setIsFirstResponse(true);
  }, [user]);

  // Effect 3: Handle URL params (runs once on mount)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      window.history.replaceState({}, '', '/dashboard');
      toast.success('Subscription activated! Thank you for subscribing.');
      api.get('/auth/me').then(res => updateUser(res.data.user));
      return;
    }
    if (params.get('plan_changed')) {
      const newPlan = params.get('plan_changed');
      window.history.replaceState({}, '', '/dashboard');
      toast.success(`Plan changed to ${newPlan.toUpperCase()}!`);
      api.get('/auth/me').then(res => updateUser(res.data.user));
    }
  }, []);
'@

$content = $content.Replace($oldPattern, $newCode)
Set-Content $filePath -Value $content -NoNewline
Write-Host "File updated successfully"
