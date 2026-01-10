// ReviewResponder - Template Library
// 50+ Professional Response Templates organized by Industry and Issue

const TEMPLATE_LIBRARY = {
  restaurant: [
    {
      id: 'r1',
      name: 'Cold Food Apology',
      tone: 'apologetic',
      issues: ['cold_food', 'food_quality'],
      template: 'We sincerely apologize that your food arrived cold. This is not the standard we hold ourselves to. We\'ve addressed this with our kitchen team to ensure proper timing. We\'d love the chance to make this right - please reach out for a complimentary meal on your next visit.'
    },
    {
      id: 'r2',
      name: 'Slow Service Response',
      tone: 'apologetic',
      issues: ['slow_service', 'wait_time'],
      template: 'Thank you for your patience, and we apologize for the extended wait time. We were busier than anticipated, but that\'s no excuse. We\'re working on staffing improvements to prevent this. We hope you\'ll give us another chance to show you the experience we\'re known for.'
    },
    {
      id: 'r3',
      name: 'Great Experience Thanks',
      tone: 'friendly',
      issues: ['positive', 'praise'],
      template: 'Thank you so much for the wonderful review! We\'re thrilled you enjoyed your experience with us. Our team works hard to create memorable dining moments, and feedback like yours makes it all worthwhile. We can\'t wait to welcome you back!'
    },
    {
      id: 'r4',
      name: 'Wrong Order Apology',
      tone: 'apologetic',
      issues: ['wrong_order', 'mistake'],
      template: 'We\'re truly sorry about the mix-up with your order. Accuracy is crucial to us, and we clearly fell short. We\'ve reviewed our processes to prevent this from happening again. Please contact us directly - we\'d like to make this right.'
    },
    {
      id: 'r5',
      name: 'Rude Staff Apology',
      tone: 'apologetic',
      issues: ['rude_staff', 'service'],
      template: 'We\'re deeply sorry about your experience with our staff. This is absolutely unacceptable behavior that doesn\'t reflect our values. We\'ve addressed this matter seriously with our team. Please give us another chance to show you the warm hospitality we\'re committed to.'
    },
    {
      id: 'r6',
      name: 'Portion Size Concern',
      tone: 'professional',
      issues: ['portion_size', 'value'],
      template: 'Thank you for sharing your feedback about our portion sizes. We strive to balance quality ingredients with fair value. We appreciate hearing customer perspectives as we continuously evaluate our offerings. We hope to see you again soon.'
    },
    {
      id: 'r7',
      name: 'Cleanliness Issue',
      tone: 'apologetic',
      issues: ['cleanliness', 'hygiene'],
      template: 'We take cleanliness extremely seriously and apologize for falling short of our standards. We\'ve immediately addressed this with our team and implemented additional checks. Your feedback helps us improve. We hope you\'ll give us another opportunity.'
    },
    {
      id: 'r8',
      name: 'Price Complaint',
      tone: 'professional',
      issues: ['price', 'expensive'],
      template: 'Thank you for your feedback regarding our pricing. We source high-quality, fresh ingredients and take pride in our preparation. We understand value is important, and we have options at various price points. We hope to serve you again.'
    },
    {
      id: 'r9',
      name: 'Noise Level',
      tone: 'professional',
      issues: ['noise', 'atmosphere'],
      template: 'Thank you for your feedback about the noise level. We understand a peaceful dining experience is important. We\'re looking into acoustic solutions to improve comfort. For a quieter experience, consider visiting during off-peak hours.'
    },
    {
      id: 'r10',
      name: 'Reservation Issue',
      tone: 'apologetic',
      issues: ['reservation', 'booking'],
      template: 'We sincerely apologize for the confusion with your reservation. This should never happen, and we\'re reviewing our booking system to prevent future issues. Please reach out directly for your next reservation - we\'ll ensure everything goes smoothly.'
    },
    {
      id: 'r11',
      name: 'Food Allergy Concern',
      tone: 'apologetic',
      issues: ['allergy', 'dietary'],
      template: 'We take food allergies extremely seriously, and we\'re sorry for any concern this caused. We\'re reinforcing our protocols with the kitchen team. Please always inform us of allergies so we can take proper precautions. Your safety is our priority.'
    },
    {
      id: 'r12',
      name: 'Takeout/Delivery Issue',
      tone: 'apologetic',
      issues: ['delivery', 'takeout'],
      template: 'We apologize that your takeout order didn\'t meet expectations. We\'re working with our delivery process to ensure food arrives in perfect condition. Please contact us directly for a resolution - we want to make this right.'
    },
    {
      id: 'r13',
      name: 'Birthday/Special Occasion',
      tone: 'friendly',
      issues: ['celebration', 'special'],
      template: 'Thank you for choosing us for your special celebration! We\'re honored to be part of your memorable moments. Your kind words mean the world to our team. We look forward to hosting your next celebration!'
    },
    {
      id: 'r14',
      name: 'First Time Visitor',
      tone: 'friendly',
      issues: ['first_visit', 'new_customer'],
      template: 'Welcome to our family! We\'re so glad you chose us for your first visit and that you enjoyed the experience. We hope this is the beginning of many great meals together. See you soon!'
    },
    {
      id: 'r15',
      name: 'Regular Customer Thanks',
      tone: 'friendly',
      issues: ['loyal', 'regular'],
      template: 'Thank you for being such a wonderful regular! Your continued support means everything to us. It\'s customers like you who make what we do so rewarding. We always look forward to seeing you!'
    }
  ],

  hotel: [
    {
      id: 'h1',
      name: 'Room Cleanliness Issue',
      tone: 'apologetic',
      issues: ['cleanliness', 'dirty_room'],
      template: 'We\'re deeply sorry about the cleanliness issues you encountered. This falls far below our standards. We\'ve addressed this with our housekeeping team immediately. Please contact us directly - we\'d like to offer compensation and ensure your next stay is impeccable.'
    },
    {
      id: 'h2',
      name: 'Noise Complaint',
      tone: 'apologetic',
      issues: ['noise', 'loud'],
      template: 'We apologize for the noise disturbance during your stay. A peaceful night\'s rest is essential, and we failed to provide that. We\'re reviewing our policies to prevent future incidents. We\'d appreciate another opportunity to give you the restful stay you deserve.'
    },
    {
      id: 'h3',
      name: 'Check-in Problems',
      tone: 'apologetic',
      issues: ['check_in', 'front_desk'],
      template: 'We sincerely apologize for the difficulties during check-in. First impressions matter, and we let you down. We\'ve addressed this with our front desk team. We hope you\'ll give us another chance to welcome you properly.'
    },
    {
      id: 'h4',
      name: 'Amazing Stay Thanks',
      tone: 'friendly',
      issues: ['positive', 'praise'],
      template: 'Thank you for the wonderful review! We\'re delighted that you had an amazing stay with us. Our team takes great pride in creating memorable experiences. We can\'t wait to welcome you back for another fantastic visit!'
    },
    {
      id: 'h5',
      name: 'WiFi/Technical Issues',
      tone: 'apologetic',
      issues: ['wifi', 'technical'],
      template: 'We apologize for the WiFi issues during your stay. We understand connectivity is essential for our guests. Our IT team is working on improvements. Thank you for bringing this to our attention.'
    },
    {
      id: 'h6',
      name: 'Staff Praise',
      tone: 'friendly',
      issues: ['staff', 'service'],
      template: 'Thank you for recognizing our team! We\'ll be sure to share your kind words with them. Having dedicated staff who care about our guests is what makes us special. We look forward to hosting you again!'
    },
    {
      id: 'h7',
      name: 'Breakfast Complaint',
      tone: 'apologetic',
      issues: ['breakfast', 'food'],
      template: 'We\'re sorry the breakfast didn\'t meet your expectations. We\'re always looking to improve our offerings based on guest feedback. We\'ve shared your comments with our culinary team. We hope to impress you on your next visit.'
    },
    {
      id: 'h8',
      name: 'Pool/Gym Issue',
      tone: 'apologetic',
      issues: ['amenities', 'pool', 'gym'],
      template: 'We apologize for the issues with our amenities. We\'re working on improvements to better serve our guests. Thank you for your patience and feedback. We hope to provide a better experience next time.'
    },
    {
      id: 'h9',
      name: 'Location Praise',
      tone: 'friendly',
      issues: ['location', 'convenience'],
      template: 'We\'re so glad you loved our location! It\'s one of our biggest assets. Thank you for choosing to stay with us. We hope to welcome you back on your next trip to the area!'
    },
    {
      id: 'h10',
      name: 'Value for Money',
      tone: 'professional',
      issues: ['price', 'value'],
      template: 'Thank you for your feedback regarding value. We strive to provide quality experiences at fair prices. We offer various room types and rates, and we\'d be happy to help you find the best option for your next stay.'
    },
    {
      id: 'h11',
      name: 'Special Occasion Stay',
      tone: 'friendly',
      issues: ['anniversary', 'honeymoon', 'birthday'],
      template: 'We were honored to be part of your special celebration! Creating memorable moments for our guests is what we love most. Congratulations again, and we hope to help you celebrate many more milestones!'
    },
    {
      id: 'h12',
      name: 'Business Traveler',
      tone: 'professional',
      issues: ['business', 'work'],
      template: 'Thank you for choosing us for your business travel. We understand the needs of business travelers and strive to make your stay productive and comfortable. We look forward to hosting you on your next trip.'
    },
    {
      id: 'h13',
      name: 'Late Checkout Request',
      tone: 'professional',
      issues: ['checkout', 'timing'],
      template: 'Thank you for your feedback about checkout timing. We try to accommodate late checkouts when possible based on availability. Please contact us directly for your next stay, and we\'ll do our best to arrange this for you.'
    },
    {
      id: 'h14',
      name: 'Parking Issue',
      tone: 'apologetic',
      issues: ['parking', 'valet'],
      template: 'We apologize for the parking difficulties you experienced. We understand how frustrating this can be. We\'re reviewing our parking procedures to improve the experience. Thank you for your patience.'
    },
    {
      id: 'h15',
      name: 'Room Upgrade Thanks',
      tone: 'friendly',
      issues: ['upgrade', 'generous'],
      template: 'We\'re delighted you enjoyed the upgrade! It\'s always a pleasure to surprise our guests when we can. Thank you for your kind words, and we hope to see you again soon!'
    }
  ],

  local_business: [
    {
      id: 'l1',
      name: 'General Positive Thanks',
      tone: 'friendly',
      issues: ['positive', 'praise'],
      template: 'Thank you so much for the wonderful review! We\'re thrilled to hear about your positive experience. Your support means everything to our small business. We look forward to serving you again!'
    },
    {
      id: 'l2',
      name: 'Service Complaint',
      tone: 'apologetic',
      issues: ['service', 'poor_service'],
      template: 'We sincerely apologize for falling short of your expectations. This isn\'t the level of service we strive for. We\'ve taken your feedback to heart and made improvements. We hope you\'ll give us another chance.'
    },
    {
      id: 'l3',
      name: 'Wait Time Issue',
      tone: 'apologetic',
      issues: ['wait_time', 'slow'],
      template: 'We apologize for the long wait. We understand your time is valuable, and we should have done better. We\'re working on improving our efficiency. Thank you for your patience and feedback.'
    },
    {
      id: 'l4',
      name: 'Quality Concern',
      tone: 'apologetic',
      issues: ['quality', 'product'],
      template: 'We\'re sorry our product/service didn\'t meet your expectations. Quality is our priority, and we take this feedback seriously. Please reach out directly so we can make this right for you.'
    },
    {
      id: 'l5',
      name: 'Price Feedback',
      tone: 'professional',
      issues: ['price', 'expensive'],
      template: 'Thank you for your feedback on pricing. We strive to provide value through quality and service. We understand budget is important and offer various options. We appreciate your business.'
    },
    {
      id: 'l6',
      name: 'Staff Compliment',
      tone: 'friendly',
      issues: ['staff', 'helpful'],
      template: 'Thank you for the kind words about our team! We\'ll make sure to share this with them. Having great staff is something we\'re proud of. Thanks for brightening their day!'
    },
    {
      id: 'l7',
      name: 'First Visit Welcome',
      tone: 'friendly',
      issues: ['new_customer', 'first_time'],
      template: 'Welcome! We\'re so happy your first experience with us was a great one. We hope this is the start of a long relationship. See you again soon!'
    },
    {
      id: 'l8',
      name: 'Communication Issue',
      tone: 'apologetic',
      issues: ['communication', 'response_time'],
      template: 'We apologize for any communication delays. We\'re working on being more responsive to our customers. Your time and business are important to us. Thank you for your patience.'
    },
    {
      id: 'l9',
      name: 'Scheduling Problem',
      tone: 'apologetic',
      issues: ['appointment', 'schedule'],
      template: 'We\'re sorry for the scheduling difficulties you experienced. We\'re improving our booking system to prevent this. Please reach out directly for your next appointment - we\'ll ensure it goes smoothly.'
    },
    {
      id: 'l10',
      name: 'Referral Thanks',
      tone: 'friendly',
      issues: ['referral', 'recommend'],
      template: 'Thank you so much for recommending us! Word-of-mouth from happy customers means the world to our business. We\'re grateful for your trust and support!'
    }
  ],

  generic: [
    {
      id: 'g1',
      name: '5-Star Thank You',
      tone: 'friendly',
      issues: ['five_star', 'excellent'],
      template: 'Thank you for the amazing 5-star review! Your kind words mean so much to our team. We\'re committed to maintaining this level of excellence. We look forward to serving you again!'
    },
    {
      id: 'g2',
      name: 'Constructive Feedback Response',
      tone: 'professional',
      issues: ['feedback', 'suggestion'],
      template: 'Thank you for taking the time to share your thoughts. We value constructive feedback as it helps us improve. We\'ve noted your suggestions and will work on implementing changes. Your input matters to us.'
    },
    {
      id: 'g3',
      name: 'General Apology',
      tone: 'apologetic',
      issues: ['complaint', 'negative'],
      template: 'We\'re truly sorry to hear about your experience. This doesn\'t reflect the standards we hold ourselves to. We\'d like the opportunity to make things right. Please contact us directly so we can address your concerns.'
    },
    {
      id: 'g4',
      name: '1-Star Recovery',
      tone: 'apologetic',
      issues: ['one_star', 'very_negative'],
      template: 'We\'re deeply sorry for this disappointing experience. We take your feedback very seriously. We\'d really appreciate the chance to understand what happened and make it right. Please reach out to us directly.'
    },
    {
      id: 'g5',
      name: 'Neutral Review Response',
      tone: 'professional',
      issues: ['neutral', 'mixed'],
      template: 'Thank you for sharing your experience with us. We appreciate both the positive aspects you mentioned and the areas for improvement. We\'re always working to enhance our service. We hope to exceed your expectations next time.'
    },
    {
      id: 'g6',
      name: 'Request for More Info',
      tone: 'professional',
      issues: ['vague', 'unclear'],
      template: 'Thank you for your review. We\'d like to better understand your experience so we can improve. Could you please reach out to us directly with more details? We\'re committed to making things right.'
    },
    {
      id: 'g7',
      name: 'Long-time Customer Thanks',
      tone: 'friendly',
      issues: ['loyal', 'repeat'],
      template: 'Thank you for being such a valued customer over the years! Your loyalty means the world to us. We\'re honored to have earned your trust, and we\'ll continue working hard to deserve it!'
    },
    {
      id: 'g8',
      name: 'Short & Sweet Thanks',
      tone: 'friendly',
      issues: ['brief', 'simple'],
      template: 'Thank you for the great review! We really appreciate you taking the time. See you again soon!'
    },
    {
      id: 'g9',
      name: 'Detailed Positive Response',
      tone: 'professional',
      issues: ['detailed', 'thorough'],
      template: 'Thank you for such a detailed and thoughtful review! It\'s feedback like yours that helps us understand what we\'re doing right. We\'re committed to maintaining these high standards. We truly appreciate your support.'
    },
    {
      id: 'g10',
      name: 'Recovery with Offer',
      tone: 'apologetic',
      issues: ['compensation', 'make_right'],
      template: 'We sincerely apologize for your experience. This is not what we stand for. We\'d like to make it up to you with a special offer on your next visit. Please contact us directly to arrange this. We hope to earn back your trust.'
    }
  ]
};

// Get all templates as flat array
function getAllTemplates() {
  const all = [];
  Object.keys(TEMPLATE_LIBRARY).forEach(category => {
    TEMPLATE_LIBRARY[category].forEach(template => {
      all.push({ ...template, category });
    });
  });
  return all;
}

// Filter templates by category and/or issue
function filterTemplates(category = 'all', issue = 'all') {
  let templates = getAllTemplates();

  if (category !== 'all') {
    templates = templates.filter(t => t.category === category);
  }

  if (issue !== 'all') {
    templates = templates.filter(t => t.issues.includes(issue));
  }

  return templates;
}

// Get unique issues from all templates
function getAllIssues() {
  const issues = new Set();
  getAllTemplates().forEach(t => {
    t.issues.forEach(issue => issues.add(issue));
  });
  return Array.from(issues).sort();
}

// Export for use in content.js
if (typeof window !== 'undefined') {
  window.TEMPLATE_LIBRARY = TEMPLATE_LIBRARY;
  window.getAllTemplates = getAllTemplates;
  window.filterTemplates = filterTemplates;
  window.getAllIssues = getAllIssues;
}
