# /product-refine - Continuous Learning Product Quality System

> **Based on Anthropic's Official Documentation (2025/2026)**
> - Claude 4 Best Practices: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices
> - XML Tag Usage: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags
> - State Management: Structured JSON for tests, unstructured text for progress

---

## OVERVIEW

This skill implements **Continuous Learning** for ReviewResponder's AI response quality.

**Core Principle:** Success isn't getting it right the first time - it's continuous refinement based on data.

---

## USAGE

```bash
/product-refine              # Full audit + recommendations (default)
/product-refine quick        # Quick consistency check only
/product-refine learn        # Review learnings, add new ones
/product-refine test         # Generate test responses, evaluate
/product-refine api          # Query API endpoints for live metrics
```

> **Note:** `check` and `audit` modes were merged into `default`. `status` merged into `api`.

---

## MODE: api (NEW - Backend Integration)

**Query live API endpoints for product quality metrics.**

### Available Endpoints:

| Endpoint | Purpose | Usage |
|----------|---------|-------|
| `GET /api/admin/product-quality` | Dashboard metrics | Default status |
| `GET /api/admin/product-quality?run_tests=true` | Run 3 quick tests | Live testing |
| `GET /api/cron/quality-test?secret=XXX` | Run 5-10 comprehensive tests | Cron/CI |

### Quick Status (via curl):
```bash
# Get current quality metrics
curl "https://review-responder.onrender.com/api/admin/product-quality" \
  -H "X-Admin-Key: $ADMIN_SECRET"

# Run live tests
curl "https://review-responder.onrender.com/api/admin/product-quality?run_tests=true" \
  -H "X-Admin-Key: $ADMIN_SECRET"

# Full cron test (5 cases)
curl "https://review-responder.onrender.com/api/cron/quality-test?secret=$ADMIN_SECRET&limit=5"
```

### Response Structure:
```json
{
  "quality_score": 92,
  "slop_rate": "1.5%",
  "avg_length": "2.3 sentences",
  "tone_accuracy": "92%",
  "last_audit": "2026-01-17",
  "tests_run": 3,
  "tests_passed": 3,
  "test_results": [...],
  "recent_responses_checked": 87
}
```

### Admin Panel:
**URL:** `/admin` → "Product Quality" tab
- Live quality score gauge
- Slop rate and tone accuracy
- Run tests button
- Recent test results table

### Cron Setup (cron-job.org):
| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| Daily 03:00 | `quality-test?limit=5` | Quick daily check |
| Monday 02:00 | `quality-test?limit=10` | Weekly full audit |

---

## MODE: quick

**Quick consistency check of all prompt systems.**

### Checklist:
1. **Rating Strategies Sync**
   - [ ] Main generate (server.js - search `ratingStrategies =`)
   - [ ] Demo generate (search `demo.*ratingStrategies`)
   - [ ] Instant demo (search `instant.*demo`)
   - Are goals/lengths consistent for same ratings?

2. **Tone Definitions Used**
   - [ ] toneDefinitions defined (search `toneDefinitions =`)
   - [ ] toneConfig used in prompt (check for `<tone_instruction>`)
   - [ ] All 4 tones have description + goodExample + avoidExample

3. **AI Slop Systems**
   - [ ] AI_SLOP_WORDS populated (promptExamples.js)
   - [ ] AI_SLOP_PHRASES populated
   - [ ] checkAISlop() called after generation
   - [ ] cleanAISlop() post-processing active

4. **XML Structure (Anthropic Best Practice)**
   - [ ] `<role>` tag present
   - [ ] `<context>` tag present
   - [ ] `<voice>` tag present
   - [ ] `<examples>` with industry-specific few-shot
   - [ ] `<output_format>` explicit

### Commands:
```bash
# Find all ratingStrategies definitions
grep -n "ratingStrategies = {" backend/server.js

# Check toneConfig usage
grep -n "toneConfig" backend/server.js

# Check AI slop systems
grep -n "checkAISlop\|cleanAISlop" backend/server.js
```

---

## DEFAULT MODE (Full Audit)

**Deep quality audit with real response generation.**

> Runs when calling `/product-refine` without arguments. Combines quick check + API tests + recommendations.

### Process:
1. Generate 10 test responses across ratings (1-5 stars)
2. Run checkAISlop() on each
3. Measure response lengths
4. Check for forbidden patterns
5. Score and report

### Test Cases (Structured JSON):
```json
{
  "test_cases": [
    {"id": 1, "rating": 5, "tone": "professional", "review": "Amazing pizza! Best in town.", "expected_length": "1-2 sentences"},
    {"id": 2, "rating": 5, "tone": "friendly", "review": "Love this place! Staff is great.", "expected_length": "1-2 sentences"},
    {"id": 3, "rating": 4, "tone": "professional", "review": "Good food, bit slow service.", "expected_length": "2-3 sentences"},
    {"id": 4, "rating": 3, "tone": "professional", "review": "Average experience. Nothing special.", "expected_length": "2-3 sentences"},
    {"id": 5, "rating": 2, "tone": "apologetic", "review": "Food was cold. Waited 45 minutes.", "expected_length": "2-3 sentences"},
    {"id": 6, "rating": 1, "tone": "apologetic", "review": "Terrible. Never coming back.", "expected_length": "2-3 sentences"},
    {"id": 7, "rating": 5, "tone": "formal", "review": "Exquisite dining experience.", "expected_length": "1-2 sentences"},
    {"id": 8, "rating": 1, "tone": "professional", "review": "Staff was rude. Manager didn't care.", "expected_length": "2-3 sentences"},
    {"id": 9, "rating": 4, "tone": "friendly", "review": "Great vibes! Music was a bit loud.", "expected_length": "2-3 sentences"},
    {"id": 10, "rating": 3, "tone": "formal", "review": "Decent but overpriced for quality.", "expected_length": "2-3 sentences"}
  ]
}
```

### Quality Metrics:
| Metric | Target | Critical |
|--------|--------|----------|
| Slop Words | 0-1 | >2 = fail |
| Slop Phrases | 0 | >0 = fail |
| Starts with AI pattern | No | Yes = fail |
| Length matches rating | Yes | No = warning |
| Uses reviewer detail | Yes | No = warning |
| Uses contractions | Yes | No = warning |

### Audit Command:
```bash
# Test single response
curl -X POST "https://review-responder.onrender.com/api/public/try" \
  -H "Content-Type: application/json" \
  -d '{"reviewText": "Amazing pizza!", "tone": "professional", "platform": "google"}'
```

---

## MODE: learn

**Continuous Learning System (Anthropic Pattern)**

### Learning Storage (Structured):
File: `content/claude-progress/product-learnings.json`

```json
{
  "learnings": [
    {
      "id": 1,
      "date": "2026-01-17",
      "category": "ai_slop",
      "pattern": "glad to hear",
      "context": "Claude-specific phrase that sounds AI",
      "action": "Added to AI_SLOP_PHRASES",
      "impact": "Reduced AI-sounding responses by ~15%",
      "status": "implemented"
    },
    {
      "id": 2,
      "date": "2026-01-17",
      "category": "tone_bug",
      "pattern": "toneConfig defined but not used",
      "context": "User selected tone was ignored in prompt",
      "action": "Added <tone_instruction> XML block",
      "impact": "Tone selection now affects output",
      "status": "implemented"
    }
  ],
  "pending_investigation": [],
  "metrics": {
    "last_audit": "2026-01-17",
    "slop_rate": "2%",
    "avg_response_length": "2.3 sentences",
    "tone_accuracy": "95%"
  }
}
```

### Progress Notes (Unstructured):
File: `content/claude-progress/product-progress.md`

```markdown
## 17.01.2026 - toneConfig Fix

Found that toneDefinitions with description, goodExample, avoidExample
were defined but never used in the system message. Fixed by adding
<tone_instruction> XML block that includes all three elements.

Next: Check if platform-specific examples would improve quality.
Consider adding Yelp/TripAdvisor specific few-shot examples.
```

### Learning Categories:
1. **ai_slop** - New patterns to blacklist
2. **tone_bug** - Tone system issues
3. **length_issue** - Response too long/short
4. **language_issue** - Wrong language output
5. **prompt_structure** - XML/structure improvements
6. **few_shot** - Example quality issues

---

## MODE: test

**Generate test responses and evaluate.**

### Process:
1. Pick 3 random test cases
2. Call /api/public/try for each
3. Run quality checks
4. Report pass/fail
5. Log failures to learnings

### Automated Test Script:
```javascript
// Can be run as cron job
async function runProductQualityTest() {
  const testCases = [
    { review: "Best coffee ever!", rating: 5, tone: "friendly" },
    { review: "Waited an hour. Unacceptable.", rating: 1, tone: "apologetic" },
    { review: "Good but could be better.", rating: 3, tone: "professional" }
  ];

  const results = [];
  for (const test of testCases) {
    const response = await fetch('/api/public/try', {
      method: 'POST',
      body: JSON.stringify({ reviewText: test.review, tone: test.tone })
    });
    const data = await response.json();

    // Check quality
    const slop = checkAISlop(data.response);
    results.push({
      test,
      response: data.response,
      passed: slop.passed,
      issues: slop.issues
    });
  }

  return results;
}
```

---

## CONTINUOUS LEARNING WORKFLOW

Based on Anthropic's State Management Best Practices:

### 1. Daily Quick Check
```bash
/product-refine check
```
- Verify all systems consistent
- No code drift

### 2. Weekly Deep Audit
```bash
/product-refine audit
```
- Generate test responses
- Measure metrics
- Update learnings.json

### 3. On Issue Discovery
```bash
/product-refine learn
```
- Document finding
- Categorize
- Plan fix
- Implement
- Verify

### 4. After Major Changes
```bash
/product-refine test
```
- Regression test
- Ensure no quality drop

---

## ANTHROPIC BEST PRACTICES CHECKLIST

From official Claude 4 docs:

### Prompt Structure
- [ ] **Be explicit** - Don't assume, tell Claude exactly what you want
- [ ] **Add context/motivation** - Explain WHY behind instructions
- [ ] **Use XML tags** - `<role>`, `<context>`, `<instructions>`, `<examples>`
- [ ] **Few-shot examples** - Include 2-4 relevant examples
- [ ] **Negative examples** - Show what NOT to do

### Output Control
- [ ] **Tell what TO do** - Not just what not to do
- [ ] **Match prompt style to output** - Less markdown in prompt = less in output
- [ ] **Length instructions** - Be specific ("2-3 sentences")
- [ ] **Format indicators** - Use XML tags for sections

### Anti-AI-Slop
- [ ] **Blacklist phrases** - "Thank you for your feedback", etc.
- [ ] **Blacklist words** - "thrilled", "delighted", "leverage"
- [ ] **Forbidden starts** - "Here's", "Let me", "Thank you for"
- [ ] **Post-processing filter** - cleanAISlop()
- [ ] **Validation check** - checkAISlop()

### Continuous Improvement
- [ ] **Structured state** - JSON for metrics/tests
- [ ] **Unstructured notes** - Markdown for progress
- [ ] **Git for tracking** - Commits as checkpoints
- [ ] **Incremental progress** - Small improvements over time

---

## METRICS TO TRACK

| Metric | How to Measure | Target |
|--------|----------------|--------|
| Slop Rate | checkAISlop() pass rate | >95% |
| Avg Length | Word count per rating | Match strategy |
| Tone Accuracy | Manual review sample | >90% |
| Specificity | Contains review detail? | >80% |
| Contraction Usage | "we're" vs "we are" | >95% |
| Reviewer Name | Uses name if available | >70% |

---

## QUICK REFERENCE

### Files to Check:
- `backend/server.js` - Main prompts
- `backend/promptExamples.js` - Few-shot + slop lists
- `content/claude-progress/product-learnings.json` - Learning storage
- `content/claude-progress/product-progress.md` - Progress notes

### Key Functions:
- `checkAISlop()` - Validate response
- `cleanAISlop()` - Post-process filter
- `getFewShotExamplesXML()` - Get industry examples
- `toneDefinitions` - Tone configs
- `ratingStrategies` - Per-rating guidance

### XML Tags in Use:
```xml
<role>Owner identity</role>
<context>Platform, rating, business</context>
<tone_instruction>Tone with examples</tone_instruction>
<voice>Writing style</voice>
<style_rules>Length, format</style_rules>
<examples>Few-shot</examples>
<avoid_patterns>AI slop blacklist</avoid_patterns>
<output_format>Direct response only</output_format>
<language_instruction>Match review language</language_instruction>
```

---

## NEW FEATURES (17.01.2026)

### Prefill Technique (Phase 3a)

**Problem:** AI responses often start with "Thank you for your feedback" which sounds robotic.

**Solution:** Anthropic's Prefill Technique forces the model to continue from a given word.

```javascript
messages: [
  { role: 'user', content: userMessage },
  { role: 'assistant', content: 'Really' }  // Prefill
]
```

**Implementation:**
- Positive reviews (4-5 stars): Prefill with "Really" → "Really glad the..."
- Negative reviews (1-3 stars): Prefill with "We" → "We dropped the ball..."

### Platform-Specific Examples (Phase 3b)

Different platforms have different cultures:

| Platform | Culture | Style |
|----------|---------|-------|
| Google | Professional, direct | Medium formality |
| Yelp | Community, casual | More playful, personality |
| TripAdvisor | Travel-focused, detailed | Professional, travel context |
| Facebook | Social, personal | Friendly, local community |
| Trustpilot | E-commerce, resolution | Solution-oriented |

**Usage:**
- `getPlatformExamplesXML('google')` returns platform-specific guidance
- Automatically included in system prompt when platform is specified

### Regression Detection (Phase 4)

**Endpoint:** `GET /api/cron/quality-test?secret=XXX`

**Features:**
- Reads `product-metrics-history.json` for baseline
- Compares new quality score with last known score
- Alerts if score drops more than `regression_threshold` (default: 3%)
- Returns structured alerts with severity and recommendations

**Response Example:**
```json
{
  "quality_score": 88,
  "last_known_score": 92,
  "regression_detected": true,
  "alerts": [{
    "type": "regression",
    "severity": "warning",
    "message": "Quality score dropped from 92% to 88%",
    "recommendation": "Review recent prompt changes."
  }]
}
```

---

## WHEN TO USE THIS SKILL

1. **Weekly maintenance** - Keep quality high
2. **After prompt changes** - Verify no regression
3. **When users complain** - Diagnose and fix
4. **New feature launch** - Ensure quality baseline
5. **A/B testing** - Compare prompt versions

---

> **Remember:** Continuous learning isn't about perfection on day 1.
> It's about getting 1% better every week through systematic refinement.
