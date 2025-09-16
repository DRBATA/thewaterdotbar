import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RecognizedItem {
  name: string;
  quantity: string;
  confidence: number;
  matched_id?: string;
  nutritionals?: any;
}

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, '');

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Identify all food and drink items in this image. For each item, provide:
1. Name of the item
2. Estimated quantity/portion size
3. Your confidence level (0-1)

Format your response as a JSON array like:
[
  {"name": "Apple", "quantity": "1 medium (150g)", "confidence": 0.95},
  {"name": "Water", "quantity": "250ml", "confidence": 0.90}
]

Be specific about preparation methods (raw, cooked, fried) and include all visible ingredients.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ]
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Vision API');
    }

    // Extract JSON from response (handle potential markdown formatting)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse response as JSON');
    }

    const recognizedItems: RecognizedItem[] = JSON.parse(jsonMatch[0]);

    // Match items to hydration_options table
    const supabase = await createClient();
    const enrichedItems = await Promise.all(
      recognizedItems.map(async (item) => {
        // Fuzzy match against hydration_options
        const { data: matches } = await supabase
          .from('hydration_options')
          .select('*')
          .textSearch('name', item.name.split(' ').join(' | '))
          .limit(1);

        if (matches && matches.length > 0) {
          const match = matches[0];
          return {
            ...item,
            matched_id: match.id,
            nutritionals: {
              water_ml: match.h2o_ml || 0,
              sodium_mg: Number(match.na_mg) || 0,
              potassium_mg: Number(match.k_mg) || 0,
              magnesium_mg: Number(match.mg_mg) || 0,
              soluble_fiber_g: Number(match.soluble_fiber_g) || 0,
              insoluble_fiber_g: Number(match.insoluble_fiber_g) || 0,
              probiotic_cfu: Number(match.probiotic_cfu) || 0,
              omega3_mg: Number(match.omega3_mg) || 0,
              polyphenols_mg: Number(match.polyphenols_mg) || 0,
            }
          };
        }

        // Return item without match for manual correction
        return {
          ...item,
          matched_id: null,
          nutritionals: null
        };
      })
    );

    return NextResponse.json({
      success: true,
      items: enrichedItems,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vision API error:', error);
    
    // Return mock data for testing if API fails
    return NextResponse.json({
      success: false,
      items: [
        {
          name: 'Unable to process image',
          quantity: 'Unknown',
          confidence: 0,
          nutritionals: null
        }
      ],
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
