import { openai } from "@ai-sdk/openai"
import { streamText, type Message } from "ai"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server" // Server client for Supabase

export const runtime = "edge" // Optional: use edge runtime for faster responses

const model = openai.chat(process.env.OPENAI_MODEL || "gpt-4.1")

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json()

  // Initialize Supabase client
  const supabase = await createClient()

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

  const systemPrompt = `You are an expert guide for The Water Bar. Follow these rules strictly:

1.  **Answer Directly & Be Concise:** Directly answer the user's question in the first sentence. Keep your entire response to a maximum of 2-3 sentences.
2.  **Use Only Provided Data:** Base all recommendations on the menu data provided below. Never mention products or experiences not in the data.
3.  **Explain Pairings:** When recommending, briefly explain *why* items pair well using the 'pairings' and 'tags' data.
4.  **Tone:** Be friendly, knowledgeable, and upbeat.

**Crucial Reasoning Hints:**
- When a user mentions the "gym," "workout," or "fitness," they are usually most interested in **muscle recovery**. Prioritize recommending experiences like heat/cold therapy or massage.
- When a user expresses interest in making a purchase, ALWAYS offer them a discount code:
  * For drinks: Offer "RESONATE10" for 10% off
  * For experiences: Offer "RESTORE20" for 20% off
  * For a combination of both: Offer "ARCHIVE30" for 30% off

Your goal is to help guests find the perfect beverage or wellness experience based on their stated needs (e.g., "calm," "energy," "muscle recovery") and provide relevant discount codes when they express interest in purchasing. Prices are in AED.

Here is the menu data:
${JSON.stringify(menuItems, null, 2)}
`

  const result = await streamText({
    model,
    system: systemPrompt,
    messages,
  })

  return result.toDataStreamResponse()
}
