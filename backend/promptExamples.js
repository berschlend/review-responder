/**
 * Industry-Specific Few-Shot Examples for Review Response Generation
 *
 * Based on Anthropic Prompt Engineering Best Practices (2025):
 * - XML tags for clear structure (<example>, <review>, <response>)
 * - Attributes for metadata (type, industry, rating)
 * - Examples should match the desired output context
 *
 * @see https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags
 * @see https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices
 */

// ============ AI SLOP BLACKLIST (Anthropic Official) ============
const AI_SLOP_WORDS = [
  // Generic AI-sounding words
  'thrilled',
  'delighted',
  'amazing',
  'incredible',
  'wonderful',
  'fantastic',
  'exceptional',
  // Corporate speak
  'leverage',
  'embark',
  'journey',
  'vital',
  'crucial',
  'paramount',
  // Anthropic 2025 additions
  'navigate',
  'landscape',
  'unpack',
  'dive into',
  'at its core',
  'game-changer',
  'revolutionary',
  'transform',
  'unlock',
  'skyrocket',
  'elevate',
  'seamless',
  'robust',
  'cutting-edge',
];

const AI_SLOP_PHRASES = [
  'Thank you for your feedback',
  'We appreciate you taking the time',
  'Sorry for any inconvenience',
  'We value your input',
  'We take all feedback seriously',
  'Your satisfaction is our priority',
  'We strive to provide',
  'We are committed to',
  'Rest assured',
  "Here's the thing",
  "Here's a",
  'Let me tell you',
  'Did you know',
  'The truth is',
  "Let's be honest",
  'The uncomfortable truth is',
  'Make no mistake',
  'Full stop',
  // Claude-specific overused phrases (2025)
  'hit the spot',
  'hits the spot',
  'glad it worked out',
  'good to hear',
  'nice to hear',
  'sounds like',
  'glad you enjoyed',
  'hope to see you',
  'swing by',
  'stop by again',
];

const AI_SLOP_STARTS = [
  "Here's",
  'Let me',
  'Did you know',
  'The truth is',
  "I'm excited to",
  'I want to start by',
  'First and foremost',
  "It's worth noting",
];

// ============ INDUSTRY EXAMPLES (XML Format) ============
const industryExamples = {
  restaurant: {
    positive: {
      review: 'Amazing pizza! The crust was perfectly crispy and the toppings were fresh.',
      response:
        'Really happy the crust worked for you. We let our dough rest 48 hours. See you next time.',
    },
    negative: {
      review: 'Waited 45 minutes for our food. When it finally arrived, it was cold.',
      response:
        "45 minutes and cold food. That's on us. Reach out directly and we'll make it right.",
    },
  },
  dental: {
    positive: {
      review:
        'Dr. Smith made my root canal completely painless. Staff was friendly and professional.',
      response:
        "Root canals have a bad reputation, but they don't have to hurt. Glad we could change that for you.",
    },
    negative: {
      review: 'Had to wait 40 minutes past my appointment time. Very frustrating.',
      response:
        "40 minutes is too long. We're working on our scheduling. Email us and we'll prioritize your next visit.",
    },
  },
  hotel: {
    positive: {
      review:
        'Beautiful room with an amazing view. Breakfast was excellent and staff very helpful.',
      response: 'The river view from that room is one of our favorites too. See you next time.',
    },
    negative: {
      review: 'Room was not clean when we arrived. Had to wait for housekeeping to come back.',
      response:
        "That's not the welcome we want for anyone. Contact us and we'll make your next stay right.",
    },
  },
  salon: {
    positive: {
      review: "Best haircut I've had in years! Lisa really understood what I wanted.",
      response:
        "Lisa will love hearing this. She's great at listening first. See you in a few weeks!",
    },
    negative: {
      review: 'Color came out completely different from what I asked for. Very disappointed.',
      response: "That's not okay. Please come back and we'll fix it, no charge.",
    },
  },
  medical: {
    positive: {
      review: 'Dr. Johnson took time to explain everything and really listened to my concerns.',
      response: 'Taking time to listen is important to us. Thanks for trusting us with your care.',
    },
    negative: {
      review: 'Felt rushed during my appointment. Doctor barely looked at me.',
      response:
        "That's not the care we want to provide. Please reach out so we can discuss your concerns properly.",
    },
  },
  automotive: {
    positive: {
      review: 'Fixed my car fast and at a fair price. Mike explained everything clearly.',
      response:
        "Mike's great at that. We believe in explaining what we're doing. Thanks for trusting us with your car.",
    },
    negative: {
      review: 'Charged me for parts they never replaced. Found the old parts still in my car.',
      response:
        "That's completely unacceptable. Please contact me directly so we can review what happened and make this right.",
    },
  },
  fitness: {
    positive: {
      review: 'Best gym in the area. Equipment is always clean and staff is helpful.',
      response:
        'We put a lot of effort into keeping things clean and maintained. See you at your next workout!',
    },
    negative: {
      review: 'Impossible to cancel membership. Been trying for 3 months.',
      response:
        "That shouldn't happen. Email me directly with your details and I'll handle the cancellation myself today.",
    },
  },
  legal: {
    positive: {
      review: 'Attorney Smith handled my case professionally and kept me informed throughout.',
      response: 'Keeping clients informed is a priority for us. Glad we could help with your case.',
    },
    negative: {
      review: 'Never returned my calls. Felt completely ignored during my case.',
      response:
        "Communication is fundamental to good legal service. I'm sorry we fell short. Please contact me directly to discuss.",
    },
  },
  retail: {
    positive: {
      review: 'Found exactly what I needed. Staff was knowledgeable and not pushy.',
      response: 'We train our team to help, not push. Glad you found what you were looking for.',
    },
    negative: {
      review: 'Online order was wrong and customer service was unhelpful.',
      response:
        "Wrong orders frustrate everyone. Email us your order number and we'll fix this immediately.",
    },
  },
  generic: {
    positive: {
      review: 'Great service! Staff was helpful and the quality exceeded my expectations.',
      response: 'The details matter to us. See you again soon.',
    },
    negative: {
      review: 'Poor experience. Service was slow and staff seemed uninterested.',
      response:
        "That's not the experience we want anyone to have. Reach out directly and we'll make it right.",
    },
  },
};

/**
 * Match a business type string to the most relevant industry examples
 * @param {string|null} businessType - The business type from user profile
 * @returns {Object} The matching industry examples with positive and negative examples
 */
function getIndustryExamples(businessType) {
  if (!businessType) return industryExamples.generic;

  const type = businessType.toLowerCase();

  // Restaurant / Food Service
  if (
    type.includes('restaurant') ||
    type.includes('cafe') ||
    type.includes('bar') ||
    type.includes('food') ||
    type.includes('pizza') ||
    type.includes('bakery') ||
    type.includes('coffee') ||
    type.includes('catering')
  ) {
    return industryExamples.restaurant;
  }

  // Dental
  if (type.includes('dental') || type.includes('dentist') || type.includes('orthodont')) {
    return industryExamples.dental;
  }

  // Hotel / Hospitality
  if (
    type.includes('hotel') ||
    type.includes('hostel') ||
    type.includes('motel') ||
    type.includes('airbnb') ||
    type.includes('vacation') ||
    type.includes('bnb') ||
    type.includes('lodging')
  ) {
    return industryExamples.hotel;
  }

  // Salon / Beauty
  if (
    type.includes('salon') ||
    type.includes('spa') ||
    type.includes('hair') ||
    type.includes('beauty') ||
    type.includes('barber') ||
    type.includes('nail') ||
    type.includes('massage')
  ) {
    return industryExamples.salon;
  }

  // Medical / Healthcare
  if (
    type.includes('medical') ||
    type.includes('doctor') ||
    type.includes('clinic') ||
    type.includes('health') ||
    type.includes('therapy') ||
    type.includes('physio') ||
    type.includes('chiro') ||
    type.includes('veterinar')
  ) {
    return industryExamples.medical;
  }

  // Automotive
  if (
    type.includes('auto') ||
    type.includes('car') ||
    type.includes('mechanic') ||
    type.includes('garage') ||
    type.includes('tire') ||
    type.includes('body shop')
  ) {
    return industryExamples.automotive;
  }

  // Fitness / Gym
  if (
    type.includes('gym') ||
    type.includes('fitness') ||
    type.includes('yoga') ||
    type.includes('pilates') ||
    type.includes('crossfit') ||
    type.includes('personal train')
  ) {
    return industryExamples.fitness;
  }

  // Legal
  if (
    type.includes('law') ||
    type.includes('legal') ||
    type.includes('attorney') ||
    type.includes('lawyer') ||
    type.includes('notary')
  ) {
    return industryExamples.legal;
  }

  // Retail / E-commerce
  if (
    type.includes('retail') ||
    type.includes('store') ||
    type.includes('shop') ||
    type.includes('ecommerce') ||
    type.includes('e-commerce')
  ) {
    return industryExamples.retail;
  }

  return industryExamples.generic;
}

/**
 * Get formatted few-shot examples in XML format for the prompt
 * Following Anthropic Best Practices for structured examples
 *
 * @param {string|null} businessType - The business type from user profile
 * @returns {string} XML-formatted examples string for direct inclusion in prompt
 */
function getFewShotExamplesXML(businessType) {
  const matched = getIndustryExamples(businessType);
  const industry = businessType || 'generic';

  return `<examples>
<example type="positive" industry="${industry}">
<review rating="5">${matched.positive.review}</review>
<response>${matched.positive.response}</response>
</example>

<example type="negative" industry="${industry}">
<review rating="2">${matched.negative.review}</review>
<response>${matched.negative.response}</response>
</example>
</examples>`;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getFewShotExamplesXML for new implementations
 */
function getFewShotExamples(businessType) {
  const matched = getIndustryExamples(businessType);
  return {
    positive: {
      review: matched.positive.review,
      goodResponse: matched.positive.response,
    },
    negative: {
      review: matched.negative.review,
      goodResponse: matched.negative.response,
    },
  };
}

/**
 * Check AI response for "slop" patterns
 * @param {string} response - The generated AI response
 * @returns {Object} { slopCount, phraseCount, startsWithSlop, passed, issues }
 */
function checkAISlop(response) {
  const lowerResponse = response.toLowerCase();

  // Check for slop words
  const foundWords = AI_SLOP_WORDS.filter(word => lowerResponse.includes(word.toLowerCase()));

  // Check for slop phrases
  const foundPhrases = AI_SLOP_PHRASES.filter(phrase =>
    lowerResponse.includes(phrase.toLowerCase())
  );

  // Check for slop starts
  const startsWithSlop = AI_SLOP_STARTS.some(start =>
    response.trim().toLowerCase().startsWith(start.toLowerCase())
  );

  const issues = [];
  if (foundWords.length > 0) issues.push(`Words: ${foundWords.join(', ')}`);
  if (foundPhrases.length > 0) issues.push(`Phrases: ${foundPhrases.join(', ')}`);
  if (startsWithSlop) issues.push('Starts with AI-typical opening');

  return {
    slopCount: foundWords.length,
    phraseCount: foundPhrases.length,
    startsWithSlop,
    passed: foundPhrases.length === 0 && foundWords.length <= 1 && !startsWithSlop,
    issues,
  };
}

module.exports = {
  industryExamples,
  getIndustryExamples,
  getFewShotExamples,
  getFewShotExamplesXML,
  checkAISlop,
  AI_SLOP_WORDS,
  AI_SLOP_PHRASES,
  AI_SLOP_STARTS,
};
