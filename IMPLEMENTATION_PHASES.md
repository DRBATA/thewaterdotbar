# Water Bar Hydration Platform - Phased Implementation Plan

## Overview
Build and validate UI components first, test vision AI, then implement database and authentication.

---

## Phase 1: Library Pages (Educational Foundation)
**Goal**: Create science-backed content pages to explain the system

### Pages to Create:
1. `/library/gut-brain` - Microbiome & SCFA science
2. `/library/hydration` - Body water calculations
3. `/library/supplements` - When/why supplements needed
4. `/library/science-refs` - Citations and studies

### Content Structure:
- Gut-Brain Axis: Serotonin synthesis, vagal signaling, SCFA production
- Hydration Science: TBW/ICW/ECW, activity multipliers, climate factors
- Supplement Logic: Rite Gut Health (soluble fiber gap), Rite Greens (micronutrient gaps), Humantra (electrolyte gaps)

---

## Phase 2: Profile Page (Body Metrics & Targets)
**Goal**: Input body composition, calculate personalized daily targets

### `/profile` Component:
```typescript
// Input Fields:
- Weight (kg)
- Height (cm)
- Body Fat % (optional, for LBM calculation)
- Activity Level (sedentary/light/moderate/active/very_active)
- Climate (temperate/hot_dry/hot_humid/cold)
- Special Conditions (sauna_user/athlete/muscle_building)

// Calculated Outputs (displayed real-time):
- Lean Body Mass (kg)
- Total Body Water (L)
- Daily Water Target (mL)
- Sodium Target (mg)
- Potassium Target (mg)
- Magnesium Target (mg)
- Fiber Targets (soluble/insoluble g)
- Omega-3 Target (mg)
- Probiotic Target (CFU)
```

### Target Calculations:
```javascript
// Water: TBW × 1.15 × activity × climate
// Sodium: LBM × 30 × activity_factor
// Potassium: LBM × 50
// Magnesium: weight × 5
// Soluble Fiber: 15-18g base
// Insoluble Fiber: 12-15g base
// Omega-3: 1000-2000mg
// Probiotics: 10 billion CFU
```

---

## Phase 3: Logging Page (Photo Intake)
**Goal**: Test photo upload → AI recognition → nutritional calculation

### `/log` Component:
```typescript
// UI Elements:
- Camera/Upload button
- Photo preview
- AI Recognition results (with confidence %)
- Manual correction interface
- "Add to Today's Log" button

// Flow:
1. Take/upload photo
2. Send to Vision AI (GPT-4V or similar)
3. Display recognized items
4. Match to hydration_options table
5. Calculate nutritionals
6. Show running daily totals
```

### Vision AI Integration:
```javascript
// Test with OpenAI Vision API
const recognizeFood = async (imageBase64) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "List all food and drink items with estimated quantities" },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` }}
      ]
    }]
  });
  return parseRecognizedItems(response);
};
```

---

## Phase 4: Main Chat Update (Gap Analysis)
**Goal**: Text chat calculates nutritional gaps and adds items to cart

### Enhanced Chat Features:
```typescript
// Context Awareness:
- Pulls daily targets from profile
- Pulls consumption from log
- Calculates real-time gaps

// Smart Responses:
"You're at 60% hydration, 40% fiber. 
 Add 1 kombucha + 1 Rite Gut Health to close gaps"

// Direct Cart Actions:
- "Add suggested items" button in chat
- Automatic quantity calculation
- Explains why each item selected
```

### Gap-Filling Logic:
```javascript
// Priority order:
1. Water deficit → high-water drinks
2. Electrolyte deficit → Humantra or coconut water  
3. Fiber deficit → Rite Gut Health or chia drinks
4. Probiotic deficit → kefir or kombucha
5. Omega-3 deficit → omega shots
6. Polyphenol deficit → green tea, berry drinks
```

---

## Phase 5: Navigation System
**Goal**: Connect all pages with consistent navigation

### Navigation Bar:
```
[Water Bar Logo] | Menu | Profile | Log | Dashboard | Library | Cart
```

### Routes:
- `/` - Current menu with chat
- `/profile` - Body metrics
- `/log` - Photo intake  
- `/dashboard` - Daily progress view
- `/library/*` - Science pages
- `/cart` - Current cart

---

## Phase 6: Vision AI Validation
**Goal**: Confirm photo recognition accuracy before proceeding

### Test Cases:
1. Simple meals (sandwich, salad, soup)
2. Complex plates (multiple items)
3. Packaged products (labels visible)
4. Drinks (glasses, bottles, cups)

### Success Criteria:
- 70%+ recognition accuracy
- Correct quantity estimation (±20%)
- Handles poor lighting/angles
- Falls back gracefully on failures

---

## Phase 7: Authentication Implementation
**Goal**: Connect Supabase auth with local profile

### Auth Flow:
1. Sign up → Create user_profile
2. Login → Load profile to local state
3. Logout → Clear local state
4. Password reset via Supabase

### Protected Routes:
- `/profile` - Requires auth
- `/log` - Requires auth
- `/dashboard` - Requires auth
- Public: Menu, Library, Cart

---

## Phase 8: Dexie Local Storage
**Goal**: Enable offline functionality

### Dexie Schema:
```javascript
db.version(1).stores({
  userMetrics: 'id, weight_kg, lean_body_mass_kg, total_body_water_l',
  dailyTargets: 'date, water_ml, sodium_mg, potassium_mg',
  consumptionLog: 'id, date, item_name, water_ml, sodium_mg',
  pendingSync: '++id, type, data, timestamp'
});
```

### Sync Strategy:
- Write to Dexie first (instant UI)
- Queue for Supabase sync
- Handle conflicts by timestamp
- Show sync status indicator

---

## Phase 9: Database Migrations
**Goal**: Apply schema changes after UI validation

### Migrations to Apply:
1. `001_user_body_metrics.sql` - Add body composition fields
2. `002_daily_targets.sql` - Create targets table
3. `003_consumption_log.sql` - Create consumption tracking

### Rollout Strategy:
- Test on development database first
- Run migrations during low-traffic period
- Have rollback plan ready
- Monitor for errors

---

## Timeline Estimate

**Week 1-2**: Phases 1-3 (Library, Profile, Logging pages)
**Week 3**: Phases 4-5 (Chat update, Navigation)
**Week 4**: Phase 6 (Vision AI validation)
**Week 5**: Phases 7-8 (Auth, Dexie)
**Week 6**: Phase 9 (Database migrations)

---

## Success Metrics

### Technical:
- Photo recognition: >70% accuracy
- Page load time: <2 seconds
- Offline capability: Full CRUD operations

### User:
- Profile completion: >80%
- Daily logging: >50% active users
- Gap closure: >70% of recommendations accepted

### Business:
- Cart value increase: +30%
- Supplement attach rate: +40%
- User retention: 60% weekly active
