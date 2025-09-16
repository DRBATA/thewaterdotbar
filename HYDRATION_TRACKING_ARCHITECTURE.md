# Water Bar Hydration Tracking Architecture

## System Overview
Transform Water Bar into a science-based hydration and nutrition tracking platform that:
- Stores user body metrics locally (Dexie) with Supabase sync
- Calculates personalized daily targets from body composition
- Uses photo-based food logging with AI recognition
- Automatically builds shopping baskets to fill nutritional gaps

## Database Structure

### Supabase Tables
- **user_profiles**: Extended with body metrics (weight, LBM, TBW, ICW, ECW)
- **daily_targets**: Calculated nutritional needs per user per day
- **consumption_log**: Tracks everything consumed with photos
- **hydration_options**: 97 items with full nutritional data (already populated)

### Local Storage (Dexie)
```javascript
// Dexie schema for offline-first approach
{
  userMetrics: {
    weight_kg, height_cm, lean_body_mass_kg,
    total_body_water_l, intracellular_water_l, 
    extracellular_water_l
  },
  dailyTargets: {
    date, water_ml, sodium_mg, potassium_mg,
    fiber_g, omega3_mg, polyphenols_mg
  },
  consumptionLog: {
    date, items[], totals{}
  },
  pendingSync: [] // Queue for offline changes
}
```

## Core Calculations

### Daily Water Needs
```javascript
// Base calculation from Total Body Water (TBW)
baseWater = TBW_liters * 1.15 * 1000 // ml/day

// Apply multipliers
heat_factor = 1.3  // Hot climate or sauna
activity_factor = {
  sedentary: 1.0,
  light: 1.2,
  moderate: 1.4,
  active: 1.6,
  very_active: 1.8
}

daily_water_ml = baseWater * heat_factor * activity_factor
```

### Electrolyte Targets
```javascript
// Based on LBM and activity
sodium_mg = LBM_kg * 30 * activity_factor
potassium_mg = LBM_kg * 50  
magnesium_mg = weight_kg * 5
```

### Gut-Brain Axis Targets
```javascript
// Evidence-based daily minimums
soluble_fiber_g = 10-15
insoluble_fiber_g = 15-20
probiotic_cfu = 10_billion
omega3_mg = 1000-2000
polyphenols_mg = 500-1000
```

## Photo Intake Flow

1. **User takes photo** → Upload to Supabase Storage
2. **AI Recognition** → GPT-4 Vision API or similar
3. **Match to hydration_options** → Fuzzy match recognized items
4. **Calculate nutritionals** → Sum all recognized items
5. **Store in consumption_log** → Track with confidence scores

## Gap Analysis & Basket Building

### Daily Gap Calculation
```javascript
function calculateGap(targets, consumed) {
  return {
    water_ml: targets.water_ml - consumed.water_ml,
    sodium_mg: targets.sodium_mg - consumed.sodium_mg,
    potassium_mg: targets.potassium_mg - consumed.potassium_mg,
    fiber_g: targets.fiber_g - consumed.fiber_g,
    omega3_mg: targets.omega3_mg - consumed.omega3_mg,
    polyphenols_mg: targets.polyphenols_mg - consumed.polyphenols_mg
  }
}
```

### Smart Basket Builder
```javascript
function buildBasket(gap, days = 1) {
  const basket = [];
  const products = await getProducts();
  
  // Priority order: hydration → electrolytes → fiber → omega3 → polyphenols
  
  // 1. Fill water gap
  if (gap.water_ml > 0) {
    // Add high-water drinks (kombucha, coconut water)
  }
  
  // 2. Fill electrolyte gaps  
  if (gap.sodium_mg > 0 || gap.potassium_mg > 0) {
    // Add electrolyte drinks or supplements
  }
  
  // 3. Fill fiber gap
  if (gap.fiber_g > 0) {
    // Add chia drinks, psyllium products
  }
  
  // 4. Fill omega3 gap
  if (gap.omega3_mg > 0) {
    // Add omega3 shots or fortified drinks
  }
  
  return optimizeBasket(basket, days);
}
```

## Authentication Flow

### Supabase Auth + Local Storage
```javascript
// Login creates dual state
async function login(email, password) {
  // 1. Supabase auth
  const { user } = await supabase.auth.signIn({ email, password });
  
  // 2. Fetch user profile
  const profile = await getUserProfile(user.id);
  
  // 3. Store locally in Dexie
  await dexie.userMetrics.put(profile.body_metrics);
  await dexie.dailyTargets.put(calculateTargets(profile));
  
  // 4. Enable offline mode
  enableOfflineSync();
}
```

## Agent Migration: Voice → Text

### Current (LiveKit Realtime)
- Voice-based, cross-talk issues
- Slow response times
- Hard to maintain script adherence

### New (GPT-3.5 Text Chat)
```javascript
// Simple text-based chat implementation
async function processMessage(message) {
  const context = await gatherContext();
  
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: HYDRATION_COACH_PROMPT },
      { role: "system", content: `User context: ${JSON.stringify(context)}` },
      { role: "user", content: message }
    ],
    functions: [
      { name: "calculate_targets", ... },
      { name: "log_consumption", ... },
      { name: "build_basket", ... }
    ]
  });
  
  return response.choices[0].message;
}
```

## Navigation Structure

```
/                     → Menu & cart (current)
/profile              → Body metrics input
/dashboard            → Daily tracking view
/library              → Science articles
  /gut-brain          → Microbiome science
  /hydration          → Hydration science
  /supplements        → Supplement guide
/history              → Past consumption logs
/plans                → Generated meal plans
```

## Implementation Phases

### Phase 1: Database & Auth (Week 1)
- Apply Supabase migrations
- Setup auth flow
- Create Dexie schemas

### Phase 2: Profile & Calculations (Week 2)
- Body metrics UI
- Target calculations
- Local storage sync

### Phase 3: Photo Intake (Week 3)
- Camera integration
- AI recognition API
- Consumption logging

### Phase 4: Basket Builder (Week 4)
- Gap analysis
- Smart product selection
- Order generation

### Phase 5: Text Agent (Week 5)
- GPT-3.5 integration
- Context management
- Function calling

## Limitations & Considerations

### Current Limitations
1. **Photo recognition accuracy**: ~70-80% for common foods
2. **Offline sync complexity**: Need conflict resolution
3. **Basket optimization**: NP-hard problem, use heuristics

### Privacy & Security
- Body metrics stored locally (Dexie)
- Photos processed then deleted
- GDPR/HIPAA considerations for health data

### Scientific Backing
- Water needs: Based on EFSA guidelines
- Fiber targets: WHO/FAO recommendations  
- Omega-3: ISSFAL consensus
- Probiotics: ISAPP guidelines

## Success Metrics
- User hydration target achievement: >80%
- Photo recognition accuracy: >75%
- Basket fill rate: >90% of gaps
- User retention: >60% weekly active
