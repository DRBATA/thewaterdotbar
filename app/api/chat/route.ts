import { createClient } from '@/lib/supabase/server'
import { type CoreMessage, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export const maxDuration = 30

const systemPromptTemplate = `
You are the "Bar Guy," a friendly, warm, and conversational AI bartender at The Water Bar. Your persona is like a real bartender—approachable, relaxed, knowledgeable, and zero-pressure. You deliver sophisticated hydration science through effortless, casual conversation, with a gentle Aussie "mate" charm.

**IMPORTANT: NEVER show debug information to the user. NEVER include the words "TIMELINE HISTORY" or "USER MESSAGE" in your responses. NEVER repeat raw hydration data back to the user. Respond naturally as a character, not showing any of your internal thought process.**

**Your Job: A 5-Step Process**

Follow this sequence precisely in every conversation. Do not skip steps.

**Step 1: General Chat & Welcome**
- Greet the user with your "Bar Guy" persona.

**Step 2: Build the User's Profile & Calculate Daily Goals**
- If you are missing any of the user's profile data (nickname, weight, body type, sex, weekly activity level), you MUST casually ask for it.
- Once you have this info, you will calculate their personalized daily hydration and nutrition targets. (This logic is built-in for you).
- Save any new info using the directives: \`[[nickname:]]\`, \`[[weight:]]\`, etc.

**Step 3: Log Today's Consumption**
- Ask the user what they've eaten or drunk *so far today*. Confirm the timing conceptually and consider the ingredients that could make up the meals e.g. burger and fries vs carrot soup (look up carrots) or snacks e.g. pear and almonds
- For each item, use the \`search_hydration_options\` tool to find its nutritional data.
- If an item isn't in the database, use the \`search_web_for_nutrition\` and \`add_hydration_option\` tools to find and save it.
- Once you have the data for all items, log it to their timeline as a single entry using the \`[[log:]]\` directive.

**Step 4: Needs Analysis & Solution Finding (Using the Genetic Algorithm Tool)**
- **This is your core analysis step.**
- First, calculate the "nutritional gap." To do this, you MUST sum up the nutritional values from ALL events in the user's timeline (provided below) and subtract this cumulative total from their daily goals (from Step 2).
- Second, you MUST call the \`find_hydration_baskets\` tool. Pass the calculated nutritional gap and constraints (e.g., max 2 drinks, max 1 ingredient) to this tool.
- This tool will return two competing "baskets" of generic items that satisfy the user's needs.

**Step 5: Recommend Specific Products from the Menu**
- **Now, and only now, do you look at the menu.**
- Take the two baskets returned by the tool in Step 4.
- For each basket, use the \`search_products\` tool to find specific items from The Water Bar menu that match the generic items in the baskets.
- Present these two competing options to the user, tied to their goals.
- Example: "Alright mate, I've got two ideas for you. We could go with a 'Morning Elixir' to sort out your electrolytes, or, if you're feeling peckish, a 'Chaga Smoothie' would hit the spot and help with your muscle-building goal. What sounds better?"

---
**Your Data:**
- The user's profile and timeline are provided below.

**Directives Cheatsheet (for your use only):**
- \`[[log:{"type":"consumption", ...}]]\`, \`[[nickname:]]\`, \`[[weight:]]\`, \`[[activityLevel:]]\`, \`[[bodyType:]]\`
`

export async function POST(req: Request) {
  try {
    const { messages, userProfile, timelineEvents } = await req.json()
    
    // Extract just the content from the last user message (which is what we care about)
    const userMessages = messages.filter(m => m.role === 'user');
    const userContent = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';

    // Create the system prompt with user context
    const finalSystemPrompt = `${systemPromptTemplate}
  
  ---
  HERE IS THE USER'S PROFILE:
  ${JSON.stringify(userProfile, null, 2)}
  ---
  HERE IS THE USER'S TIMELINE FOR TODAY:
  ${JSON.stringify(timelineEvents, null, 2)}
  `

    // Process the user message separately from the debugging info
    const processedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.role === 'user' ? userContent : msg.content
    }));

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      system: finalSystemPrompt,
      messages: processedMessages as CoreMessage[],
      tools: {
        find_hydration_baskets: {
          description: 'Step 4: Takes a nutritional gap and constraints, and returns two competing "baskets" of generic items from the hydration_options table that would fill the gap.',
          parameters: z.object({
            target_water_ml: z.number(),
            target_sodium_mg: z.number(),
            target_potassium_mg: z.number(),
            target_protein_g: z.number(),
            max_drinks: z.number().describe('Max number of items classified as "drinks" to include in the basket.'),
            max_foods: z.number().describe('Max number of items classified as "food" to include.'),
          }),
          execute: async (args) => {
            const supabase = await createClient()
            const { data, error } = await supabase.rpc('find_hydration_baskets', {
              target_water: args.target_water_ml,
              target_sodium: args.target_sodium_mg,
              target_potassium: args.target_potassium_mg,
              target_protein: args.target_protein_g,
              max_drinks: args.max_drinks,
              max_foods: args.max_foods,
            })
            if (error) return { error: `Database function error: ${error.message}` }
            return data
          },
        },
        search_hydration_options: {
          description: 'Step 3: Searches the database for generic, non-menu food items (e.g., "apple", "coffee") to find their nutritional values.',
          parameters: z.object({ query: z.string() }),
          execute: async ({ query }) => {
            const supabase = await createClient()
            const { data } = await supabase.from('hydration_options').select('name, h2o_ml, na_mg, k_mg, protein_g').ilike('name', `%${query}%`).limit(5)
            return data
          },
        },
        search_products: {
          description: 'Step 5: Searches the menu of The Water Bar for specific products. Used only after you have baskets from the find_hydration_baskets tool.',
          parameters: z.object({ query: z.string() }),
          execute: async ({ query }) => {
            const supabase = await createClient()
            const { data } = await supabase.from('products').select('name, benefits, price_aed, kpi_water_ml, kpi_sodium_mg, kpi_potassium_mg, kpi_protein_g').ilike('name', `%${query}%`).limit(5)
            return data
          },
        },
        search_web_for_nutrition: {
          description: 'Fallback for Step 3. If a generic food is not in the database, searches the web.',
          parameters: z.object({ query: z.string() }),
          execute: async ({ query }) => {
            const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${process.env.USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=1`;
            try {
              const response = await fetch(url);
              const data = await response.json();
              if (data.foods && data.foods.length > 0) {
                const food = data.foods[0];
                const nutrients = food.foodNutrients;
                const water = nutrients.find((n: any) => n.nutrientId === 1051)?.value || 0;
                const sodium = nutrients.find((n: any) => n.nutrientId === 1093)?.value || 0;
                const potassium = nutrients.find((n: any) => n.nutrientId === 1092)?.value || 0;
                const protein = nutrients.find((n: any) => n.nutrientId === 1003)?.value || 0;
                return { name: food.description, h2o_ml: water, na_mg: sodium, k_mg: potassium, protein_g: protein };
              }
              return { error: 'Food not found.' };
            } catch (error) {
              return { error: 'Failed to fetch data from USDA API.' };
            }
          },
        },
        add_hydration_option: {
          description: 'Used in Step 3 after a successful web search to save a new food item.',
          parameters: z.object({ name: z.string(), h2o_ml: z.number(), protein_g: z.number(), na_mg: z.number(), k_mg: z.number() }),
          execute: async (args) => {
              const supabase = await createClient();
              const { data, error } = await supabase.from('hydration_options').insert([args]).select();
              if (error) return { success: false, error: error.message };
              return { success: true, added: data };
          },
        },
      },
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}