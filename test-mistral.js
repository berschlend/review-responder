// Quick test script to compare Mistral Small Creative vs GPT-4o-mini
// Run: node test-mistral.js

const testReviews = [
  {
    name: '5-Star Positive (English)',
    text: 'The margherita pizza was perfect! Fresh basil, amazing mozzarella, and the wood-fired crust had just the right char. Best Italian food I have had in years. Staff was super friendly too!',
    rating: 5,
  },
  {
    name: '2-Star Negative (English)',
    text: 'Ordered delivery and waited over an hour. When the food finally arrived, my pasta was lukewarm and the garlic bread was soggy. Very disappointing for the price we paid.',
    rating: 2,
  },
  {
    name: '4-Star German',
    text: 'Leckere Pizza und nettes Personal. Die Wartezeit war etwas lang, aber das Essen hat sich gelohnt. Beim nächsten Mal probiere ich die Pasta!',
    rating: 4,
  },
];

const systemPrompt = `You own Marco's Pizzeria (Restaurant). You're responding to a review on Google.

OUTPUT FORMAT:
Write the response directly. No quotes around it. No "Response:" prefix. Just the text.

VOICE:
You are the business owner. Not customer service. The actual owner who built this place.
Write like you talk. Warm but not gushing. Confident but not arrogant.

BANNED (instant AI detection):
Words: thrilled, delighted, excited, absolutely, incredibly, amazing, wonderful, commendable
Corporate: embark, delve, foster, leverage, journey, beacon, tapestry, vital, crucial
Phrases: "Thank you for your feedback" | "We appreciate you taking the time" | "means the world"
         "Your satisfaction is our priority" | "Sorry for any inconvenience" | "Please don't hesitate"

STYLE RULES:
- Contractions always (we're, you'll, it's, that's, don't)
- Short sentences. Some fragments. Vary rhythm.
- Zero or one exclamation mark total
- Reference specific details they mentioned
- No em-dashes. Use periods or commas instead.
- 2-3 sentences for positive reviews. 3-4 for negative.

LANGUAGE: Respond in the SAME language as the review.`;

async function testMistral() {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    console.log('\n❌ MISTRAL_API_KEY not set!');
    console.log('\nTo test Mistral, get a free API key from: https://console.mistral.ai');
    console.log('Then run: MISTRAL_API_KEY=your_key node test-mistral.js\n');
    return;
  }

  const { Mistral } = await import('@mistralai/mistralai');
  const client = new Mistral({ apiKey });

  console.log('\n🧪 Testing Mistral Small Creative\n');
  console.log('='.repeat(60));

  for (const review of testReviews) {
    console.log(`\n📝 ${review.name}`);
    console.log(`Review: "${review.text.substring(0, 80)}..."`);
    console.log(`Rating: ${review.rating} ⭐`);

    try {
      const response = await client.chat.complete({
        model: 'mistral-small-latest', // or 'mistral-small-creative' if available
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `[${review.rating} stars] ${review.text}` },
        ],
        maxTokens: 350,
        temperature: 0.6,
      });

      const output = response.choices[0].message.content.trim();
      console.log(`\n✅ Response:\n"${output}"`);

      // Check for banned words
      const bannedWords = [
        'thrilled',
        'delighted',
        'excited',
        'absolutely',
        'incredibly',
        'amazing',
      ];
      const found = bannedWords.filter(w => output.toLowerCase().includes(w));
      if (found.length > 0) {
        console.log(`⚠️  Found banned words: ${found.join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n' + '-'.repeat(60));
  }
}

testMistral().catch(console.error);
