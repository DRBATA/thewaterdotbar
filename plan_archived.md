## Notes
- Health disclaimer is now conversational and well-placed in recommendations.
- Removed `is_active` filtering from product and experience queries to match new venue-based availability logic.
- Dexie (IndexedDB) user profile storage is not working as expected—profile is not saved after AI attempts to store it.
- Identified root cause: AI was emitting JSON for save-full-profile directive, but code expects [[save-full-profile:key=value,...]] format. Updated prompt to clarify required syntax.
- Upcoming requirement: Integrate live climate data (OpenWeatherMap) and WHO/US Army/OSHA heat guidance into hydration calculations, as discussed.
- Started implementation: climate utility module created and initial API integration begun.
- Next major feature: Implement Ultra-Lean User Request Flow—context window planning, event-based scheduling, and role-driven product slotting as described in latest discussion.
- For Ultra-Lean User Request Flow: AI should extract timing, splitting, and role info flexibly from the entire product row (usage_guidelines, bio_mechanisms, nutrient_profile), not from any single column, to maximize adaptability and avoid over-constraining the prompt logic.
- Time-Window Planning capability is now integrated in the AI system prompt as a flexible, directional framework that guides (but does not rigidly control) the step-by-step process.
- Time-Window Planning should be a proactive, default enhancement: the AI should always suggest planning for the rest of the day and offer multi-day plans, not just when explicitly requested.
- Review and refine integration so time-window planning actively infuses the step-by-step process, not just as a directional concept.
- Weather API integration currently fetches climate data for a default location (e.g., Dubai); review if GPS/user-location-based weather is required.
- User feedback: AI chat output is currently too verbose; users are experiencing information overload. Review output strategy for conciseness and user-friendliness.
- Repeated nickname/profile consent prompts: Consider dual-mode (chat vs. assistant) output or alternative UX for profile storage messaging to avoid user confusion.
- Assistant is reviewing homepage, menu display, menu item card, and filter bar components to implement UI/UX changes.
- Add AI guardrail: AI must not claim to sell items, offer PINs, or handle transactions; always redirect users to the shop/store UI for purchases.
- Map pin marker should always be visible next to venue; on click, it should turn red (active state).
- Remove the three top buttons (performance, electrolytes, recovery) from the homepage permanently.
- Move the filter bar to the top of the menu, in place of the removed buttons, and ensure it is open by default on landing.
- PLAN ARCHIVED: All tasks completed or migrated; ready for new major phase.

## Task List
- [x] Integrate health disclaimer into AI recommendations (Step 4.5)
- [x] Remove `is_active` filter from chat API product/experience queries
- [x] Update AI system prompt to require correct save-full-profile directive format
- [x] Verify Dexie user profile storage works with correct directive
- [x] Investigate and fix Dexie user profile storage bug
- [x] Integrate live climate data and environmental multipliers into hydration logic (archived)
  - [x] Create climate utility module
  - [x] Import and call climate utility in chat API route
  - [x] Inject environmental factors into system prompt for hydration calculation
- [x] Implement Ultra-Lean User Request Flow: context window, event-based scheduling, role-driven product slotting (archived)
- [x] Review and optimize AI chat output for conciseness and user experience (archived)
- [x] Add AI guardrail: prohibit sales language/PIN offers in chat; redirect to shop/store UI
- [x] Update landing page UI/UX:
  - [x] Change GPS button text to "GPS inactive - click to activate to find distance to venue with available stock"
  - [x] Replace chevron with map pin marker next to items
  - [x] Remove performance/electrolytes/recovery buttons at top
  - [x] Reduce filters to kombucha, electrolytes, water, perrier, chaga, gut health, greens
- [x] Make map pin marker always visible and turn red on click
- [x] Remove the three top buttons from homepage
- [x] Move filter bar to top of menu and open by default

## Current Goal
Plan archived; ready for new phase