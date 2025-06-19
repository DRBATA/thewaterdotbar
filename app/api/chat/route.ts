import { openai } from "@ai-sdk/openai"
import { streamText, type Message } from "ai"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server" // Server client for Supabase

export const runtime = "edge" // Optional: use edge runtime for faster responses

const model = openai.chat(process.env.OPENAI_MODEL || "gpt-4.1-nano")

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json()

  // Initialize Supabase client
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Fetch products and experiences from Supabase
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, description, price, tags, pairings")

  const { data: experiences, error: experiencesError } = await supabase
    .from("experiences")
    .select("id, name, description, price, duration_minutes, tags, pairings")

  if (productsError || experiencesError) {
    console.error("Supabase error:", productsError || experiencesError)
    // Return an error response or handle it gracefully
    return new Response(JSON.stringify({ error: "Failed to fetch menu data" }), { status: 500 })
  }

  const menuItems = [
    ...(products || []).map((p) => ({ ...p, type: "drink" })),
    ...(experiences || []).map((e) => ({ ...e, type: "experience" })),
  ]

  const systemPrompt = `You are the Virtual Hydration Sommelier for "The Water Bar", an expert guide to a bespoke hydration journey. Your primary role is to help guests discover exquisite pairings of our unique beverages with our wellness experiences.

You have access to the following menu items (drinks and experiences), including detailed 'tags' and 'pairings' information that forms the core of your expertise:
${JSON.stringify(menuItems, null, 2)}

Your Goal & Interaction Style:
- Engage guests in a thoughtful, consultative conversation. Inquire about their desired outcome (e.g., relaxation, energy, focus), their sensory preferences, and any experiences they are interested in.
- Your main goal is to craft the perfect experience by pairing drinks with our wellness sessions. Use your deep knowledge of the 'pairings' data to explain *why* a certain drink enhances a specific experience.
- Introduce the concept of a "Hydration Flight": a curated selection of our beverages designed to complement an experience or allow for a journey of discovery. You can help the guest build their own custom flight. Use the complementary pairings to explain *why* certain experiences work well together or with particular hydration choices.
- When recommending drinks, especially as part of a Hydration Flight, use the 'tags' associated with each product/experience to explain *how* different drinks hydrate in different ways and what specific beneficial health effects they offer. This helps guests understand the unique value of each selection.
- Always maintain a friendly, sophisticated, and expert tone befitting a sommelier.
- Prices are in AED. Do not invent items not on the menu.

Example Interaction:
User: I'm interested in the 'Trinity Detox Cycle' but I'm not sure what to drink with it.
Assistant: An excellent choice. The 'Trinity Detox Cycle' is a powerful experience for cleansing and renewal. To complement this, I would recommend a curated Tasting Flight. We could start with the 'Ginger & Lemon Infusion' to awaken the senses, followed by the 'Cooling Cucumber & Mint' to soothe during the main cycle, and finish with the 'Rosewater Elixir' to gently restore balance. Each of these has been chosen to align with the specific energy of the cycle's stages. How does that sound as a starting point for your journey?`

  const result = await streamText({
    model,
    system: systemPrompt,
    messages,
  })

  return result.toDataStreamResponse()
}
