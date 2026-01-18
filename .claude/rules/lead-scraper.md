# Lead Scraper Rules (Auto-loaded for: Chrome MCP Scraping)

> **Zweck:** Chain Detection, Business Type Validation, Email Classification
> **Genutzt von:** /scrape-leads-chrome, /find-email-chrome, Burst-1

---

## CHAIN DETECTION PATTERNS

### Global Restaurant/Fast Food Chains (IMMER SKIP)

```javascript
const GLOBAL_CHAINS = [
  // Fast Food
  "McDonald's", "Burger King", "KFC", "Subway", "Wendy's",
  "Taco Bell", "Pizza Hut", "Domino's", "Papa John's",
  "Five Guys", "Shake Shack", "Chipotle", "Chick-fil-A",

  // Coffee
  "Starbucks", "Costa Coffee", "Dunkin", "Tim Hortons",
  "Pret A Manger", "Caffe Nero",

  // Casual Dining
  "TGI Friday's", "Applebee's", "Olive Garden", "Outback",
  "Buffalo Wild Wings", "Chili's", "Denny's", "IHOP",

  // German/European Chains
  "Vapiano", "L'Osteria", "Hans im Glueck", "Block House",
  "Nordsee", "Wienerwald", "Schweinske", "Maredo",

  // Asian Chains
  "Wagamama", "Yo! Sushi", "Itsu", "Panda Express"
];
```

### Hotel Chains (IMMER SKIP)

```javascript
const HOTEL_CHAINS = [
  // Major Groups
  "Marriott", "Hilton", "Hyatt", "IHG", "Accor",
  "Wyndham", "Best Western", "Choice Hotels",

  // Luxury
  "Four Seasons", "Ritz-Carlton", "St. Regis", "W Hotels",
  "Waldorf Astoria", "Conrad", "JW Marriott",

  // Accor Brands
  "Novotel", "Ibis", "Mercure", "Sofitel", "Pullman",
  "Adagio", "Mövenpick",

  // IHG Brands
  "Holiday Inn", "Crowne Plaza", "InterContinental",
  "Kimpton", "Staybridge",

  // Hilton Brands
  "DoubleTree", "Hampton", "Embassy Suites",
  "Homewood Suites", "Tru by Hilton"
];
```

### Corporate Email Patterns (CHAIN INDIKATOR)

```javascript
const CORPORATE_EMAIL_PATTERNS = [
  // Accor Pattern: H####@accor.com
  /^[A-Z]\d{4,}@accor\./i,

  // Hotel Chain Generic
  /@(marriott|hilton|hyatt|ihg|wyndham)\./i,

  // Corporate Numbering
  /^(emp|employee|staff|loc|location)\d+@/i,

  // Franchise Pattern
  /franchise\d*@/i,
  /store\d+@/i,
  /unit\d+@/i
];
```

### Chain Detection via Google Maps Data

```javascript
function detectChainFromGoogleData(businessData) {
  const indicators = [];

  // 1. Name Match
  if (GLOBAL_CHAINS.some(chain =>
    businessData.name.toLowerCase().includes(chain.toLowerCase())
  )) {
    indicators.push({ type: 'name_match', confidence: 0.95 });
  }

  // 2. Multiple Locations
  if (businessData.description?.includes('location') ||
      businessData.description?.includes('franchise')) {
    indicators.push({ type: 'multiple_locations', confidence: 0.80 });
  }

  // 3. "Part of" Statement
  if (businessData.description?.match(/part of|owned by|managed by/i)) {
    indicators.push({ type: 'parent_company', confidence: 0.85 });
  }

  // 4. Chain Category
  if (businessData.categories?.includes('Chain restaurant') ||
      businessData.categories?.includes('Fast food')) {
    indicators.push({ type: 'chain_category', confidence: 0.90 });
  }

  // Calculate overall likelihood
  const maxConfidence = Math.max(...indicators.map(i => i.confidence), 0);
  return {
    isChain: maxConfidence > 0.5,
    chain_likelihood: maxConfidence,
    indicators
  };
}
```

---

## TARGET BUSINESS TYPES

### Restaurants (Default)

```javascript
const RESTAURANT_KEYWORDS = {
  include: [
    "restaurant", "ristorante", "trattoria", "osteria",
    "bistro", "brasserie", "café", "cafe", "gasthaus",
    "wirtshaus", "pizzeria", "steakhouse", "brauhaus",
    "sushi", "ramen", "thai", "indian", "mexican",
    "taverna", "cantina", "diner", "grill"
  ],
  exclude: [
    "catering", "delivery only", "ghost kitchen",
    "food truck", "takeaway only"
  ]
};
```

### Hotels

```javascript
const HOTEL_KEYWORDS = {
  include: [
    "hotel", "pension", "gasthof", "boutique hotel",
    "bed and breakfast", "b&b", "inn", "lodge",
    "resort", "aparthotel", "gaestehaus"
  ],
  exclude: [
    "hostel", "airbnb", "vacation rental",
    "apartment complex"
  ]
};
```

### Dental Practices

```javascript
const DENTAL_KEYWORDS = {
  include: [
    "zahnarzt", "dentist", "dental clinic", "dental practice",
    "zahnklinik", "kieferorthopaedie", "orthodontist",
    "implantologie"
  ],
  exclude: [
    "dental lab", "dental supply", "dental equipment"
  ]
};
```

### Medical Practices

```javascript
const MEDICAL_KEYWORDS = {
  include: [
    "arzt", "praxis", "doctor", "medical center",
    "klinik", "facharzt", "hausarzt", "orthopaedie",
    "dermatologie", "kardiologie", "physiotherapie"
  ],
  exclude: [
    "hospital", "krankenhaus", "pharmacy", "apotheke",
    "medical supply", "optiker"
  ]
};
```

### Real Estate

```javascript
const REAL_ESTATE_KEYWORDS = {
  include: [
    "immobilien", "real estate", "makler", "realtor",
    "property management", "hausverwaltung",
    "immobilienmakler"
  ],
  exclude: [
    "construction", "bau", "renovation"
  ]
};
```

### Home Services

```javascript
const HOME_SERVICES_KEYWORDS = {
  include: [
    "handwerker", "elektriker", "plumber", "klempner",
    "heizung", "hvac", "roofing", "dachdecker",
    "painter", "maler", "landscaping", "gaertner",
    "cleaning", "reinigung", "moving", "umzug"
  ],
  exclude: [
    "supply store", "equipment rental"
  ]
};
```

### Pet Services

```javascript
const PET_SERVICES_KEYWORDS = {
  include: [
    "tierarzt", "veterinarian", "vet clinic",
    "hundesalon", "dog grooming", "pet grooming",
    "tierpension", "pet boarding", "dog training",
    "hundeschule"
  ],
  exclude: [
    "pet store", "pet supply", "zoo"
  ]
};
```

---

## EMAIL CLASSIFICATION

### Classification Function

```javascript
function classifyEmail(email, domain) {
  const localPart = email.split('@')[0].toLowerCase();

  // Personal Firstname (BEST)
  // Pattern: max@, marco@, hans@
  if (/^[a-z]{2,15}$/.test(localPart) &&
      !GENERIC_WORDS.includes(localPart)) {
    return { type: 'personal_firstname', score_impact: +20 };
  }

  // Personal Fullname (GREAT)
  // Pattern: max.mueller@, marco-rossi@
  if (/^[a-z]+[._-][a-z]+$/.test(localPart)) {
    return { type: 'personal_fullname', score_impact: +20 };
  }

  // Creative Personal (GOOD)
  // Pattern: chef@, prost@, der@, hello@team-member-name
  const CREATIVE_PATTERNS = ['chef', 'prost', 'der', 'die', 'owner', 'boss'];
  if (CREATIVE_PATTERNS.some(p => localPart.includes(p))) {
    return { type: 'creative_personal', score_impact: +15 };
  }

  // Gmail/Personal Domain (GOOD - often owner)
  if (email.endsWith('@gmail.com') ||
      email.endsWith('@gmx.de') ||
      email.endsWith('@web.de') ||
      email.endsWith('@outlook.com')) {
    return { type: 'personal_gmail', score_impact: +10 };
  }

  // Corporate Pattern (BAD - chain indicator)
  if (CORPORATE_EMAIL_PATTERNS.some(p => p.test(email))) {
    return { type: 'corporate', score_impact: -30 };
  }

  // Generic (POOR)
  const GENERIC_WORDS = [
    'info', 'contact', 'office', 'admin', 'support',
    'hello', 'mail', 'email', 'service', 'kontakt',
    'anfrage', 'buchung', 'reservation', 'booking'
  ];
  if (GENERIC_WORDS.includes(localPart)) {
    return { type: 'generic', score_impact: -20 };
  }

  // Unknown (NEUTRAL)
  return { type: 'unknown', score_impact: 0 };
}
```

### Email Priority (bei mehreren gefunden)

```javascript
const EMAIL_PRIORITY = [
  'personal_firstname',   // 1st choice
  'personal_fullname',    // 2nd choice
  'creative_personal',    // 3rd choice
  'personal_gmail',       // 4th choice
  'unknown',              // 5th choice
  'generic',              // 6th choice (nur wenn nichts anderes)
  'corporate'             // NEVER use - skip lead
];
```

---

## SCORE CALCULATION (VOLLSTAENDIG)

```javascript
function calculateLeadScore(lead) {
  let score = 0;
  let reasons = [];

  // === REVIEW COUNT SCORING ===
  if (lead.reviews >= 2000 && lead.reviews < 5000) {
    score += 50;
    reasons.push('+50: Big SMB (2k-5k reviews) = SERIOUS PAIN');
  } else if (lead.reviews >= 500 && lead.reviews < 2000) {
    score += 40;
    reasons.push('+40: Established SMB (500-2k reviews) = PAIN');
  } else if (lead.reviews >= 5000 && !lead.isChain) {
    score += 30;
    reasons.push('+30: Very Large SMB (5k+ reviews)');
  } else if (lead.reviews >= 50 && lead.reviews < 500) {
    score += 10;
    reasons.push('+10: Small SMB (50-500 reviews)');
  }

  // === EMAIL QUALITY SCORING ===
  const emailClassification = classifyEmail(lead.email, lead.website);
  score += emailClassification.score_impact;
  reasons.push(`${emailClassification.score_impact >= 0 ? '+' : ''}${emailClassification.score_impact}: Email type ${emailClassification.type}`);

  // === OWNER IDENTIFICATION BONUS ===
  if (lead.owner_name) {
    score += 10;
    reasons.push('+10: Owner name identified');
  }

  // === PAIN INDICATORS ===
  if (lead.unreplied_negatives > 10) {
    score += 10;
    reasons.push('+10: Many unreplied negatives (>10)');
  } else if (lead.unreplied_negatives > 5) {
    score += 5;
    reasons.push('+5: Some unreplied negatives (>5)');
  }

  // === CHAIN PENALTY ===
  if (lead.chain_likelihood > 0.5) {
    score -= 50;
    reasons.push('-50: Likely a chain');
  } else if (lead.chain_likelihood > 0.3) {
    score -= 20;
    reasons.push('-20: Possible chain');
  }

  // === MINIMUM THRESHOLD ===
  return {
    score,
    reasons,
    recommendation: score >= 40 ? 'IMPORT' : 'SKIP'
  };
}
```

---

## QUALITY THRESHOLDS

| Score Range | Action | Reason |
|-------------|--------|--------|
| 80+ | PRIORITY IMPORT | Super High Lead - Personal Email + High Review Pain |
| 60-79 | IMPORT | High Lead - Good for Outreach |
| 40-59 | IMPORT (Low Priority) | Medium Lead - Consider for Batch |
| 20-39 | SKIP | Low Quality - Generic Email or Low Reviews |
| <20 | SKIP | Very Low Quality - Chain or No Email |

---

## WEBSITE PAGE PATTERNS (DACH Region)

### German Sites

| Page Type | URL Patterns |
|-----------|--------------|
| Team | /team, /unser-team, /ueber-uns/team |
| Impressum | /impressum, /rechtliches, /legal |
| About | /ueber-uns, /about, /wir |
| Contact | /kontakt, /contact, /anfahrt |

### Austrian Sites

| Page Type | URL Patterns |
|-----------|--------------|
| Team | /team, /unser-team |
| Impressum | /impressum (PFLICHT!) |
| About | /ueber-uns |
| Contact | /kontakt |

### Swiss Sites (DE)

| Page Type | URL Patterns |
|-----------|--------------|
| Team | /team, /ueber-uns |
| Impressum | /impressum (PFLICHT!) |
| About | /ueber-uns |
| Contact | /kontakt |

---

## OWNER TITLE PATTERNS

### German Titles (Owner/Decision Maker)

```javascript
const OWNER_TITLES_DE = [
  'inhaber', 'inhaberin',
  'geschaeftsfuehrer', 'geschaeftsfuehrerin',
  'eigentuemer', 'eigentümerin',
  'gruender', 'gruenderin',
  'chef', 'chefin',
  'patron', 'patronin'
];
```

### English Titles

```javascript
const OWNER_TITLES_EN = [
  'owner', 'co-owner',
  'founder', 'co-founder',
  'ceo', 'managing director',
  'general manager', 'gm',
  'proprietor'
];
```

### Skip Titles (NOT Decision Makers)

```javascript
const SKIP_TITLES = [
  'marketing', 'sales', 'hr',
  'intern', 'assistant', 'associate',
  'trainee', 'student', 'praktikant',
  'social media', 'content'
];
```

---

## INTEGRATION

**Genutzt von:**
- `/scrape-leads-chrome` - Alle Rules
- `/find-email-chrome` - Email Classification
- `/generate-demo-chrome` - Business Type Validation
- Burst-1 (lead-finder) - Chain Detection

**Updates:**
- Chain-Listen monatlich aktualisieren
- Neue Business Types bei Bedarf hinzufuegen
- Email Patterns basierend auf Bounce-Daten anpassen

---

*Loaded by: Chrome MCP Scraping Commands*
