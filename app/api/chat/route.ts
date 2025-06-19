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

  const systemPrompt = `You are a friendly and knowledgeable virtual barista for "The Water Bar".
Your goal is to help users find the perfect drink or wellness experience.
You have access to the following menu items (drinks and experiences):
${JSON.stringify(menuItems, null, 2)}

Engage in a natural conversation. Ask about their day, mood, flavor preferences, and budget.
Based on their input and the available menu items, make 1-3 specific recommendations.
Explain why you are recommending those items.
If the guest voluntarily mentions cost, acknowledge it and suggest options within that range. Otherwise, focus on the value and benefits they are seeking. Prices are in AED.
Keep your responses concise and helpful.
Do not invent items not on the menu. If the user asks for something that is not in the list, politely inform them it’s unavailable and suggest the closest alternative from the menu.
If you are unsure or cannot find a suitable item, politely say so and perhaps ask more clarifying questions.
Each item may include a "pairings" array (with reasons). When it fits the guest's needs, feel free to suggest complementary drinks or experiences and cite the provided reason.
Format your recommendations clearly, perhaps using bullet points if suggesting multiple items.
Example interaction:
User: I had a stressful day, looking for something calming.
Assistant: I understand, a stressful day definitely calls for something soothing!
We have a wonderful 'Guided Meditation' (30 min, $15.00) that features calming water sounds, perfect for unwinding.
Or, if you prefer a warm drink, a simple herbal tea might be nice, though we specialize in infused waters.
What sounds better to you?`

  const result = await streamText({
    model,
    system: systemPrompt,
    messages,
  })

  return result.toDataStreamResponse()
}
