import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getSessionId } from "@/lib/session"

export async function POST(req: Request) {
  const { itemId, qty = 1, bundle_components, venue_id, ai_recommendation, assessmentData } = await req.json()
  console.log(`🛒 ADD: Received request - itemId=${itemId}, qty=${qty}, venue_id=${venue_id}, hasAI=${!!ai_recommendation}, hasAssessment=${!!assessmentData}`)
  
  if (!itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = await createClient()

  const sessionId = await getSessionId()
  console.log(`🛒 ADD: Using session_id=${sessionId}`)
  
  try {
    // 1. Find or create cart header
    const { data: cartHeader, error: cartHeaderError } = await supabase
      .from("cart_headers")
      .select("id")
      .eq("session_id", sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (cartHeaderError) {
      console.error(`🛒 ADD: Cart header error:`, cartHeaderError)
      throw new Error(`Cart header error: ${cartHeaderError.message}`);
    }
    
    let cartId;
    let isNewCart = false;
    if (!cartHeader) {
      console.log(`🛒 ADD: Creating new cart header for session ${sessionId}`)
      // Create new cart header if not exists
      const insertData: any = {
        session_id: sessionId,
        venue_id: venue_id || null
      };
      
      // If assessment data provided, upload meal images first, then save
      if (assessmentData) {
        // Upload meal images to Supabase Storage and replace base64 with URLs
        const outputData = assessmentData.output || assessmentData;
        if (outputData?.recommended_meals && Array.isArray(outputData.recommended_meals)) {
          console.log(`🛒 ADD: Processing ${outputData.recommended_meals.length} meal images...`);
          
          for (const meal of outputData.recommended_meals) {
            if (meal.imageData && meal.imageData.length > 100) { // Has actual base64 data
              try {
                // Convert base64 to buffer
                const base64Data = meal.imageData.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                
                // Upload to Supabase Storage
                const fileName = `meal-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('meal-images')
                  .upload(fileName, buffer, {
                    contentType: 'image/png',
                    cacheControl: '3600',
                  });
                
                if (!uploadError && uploadData) {
                  // Get public URL
                  const { data: { publicUrl } } = supabase.storage
                    .from('meal-images')
                    .getPublicUrl(fileName);
                  
                  meal.imageUrl = publicUrl;
                  delete meal.imageData; // Remove base64 to keep payload small
                  console.log(`🛒 ADD: Uploaded meal image: ${meal.name} → ${publicUrl}`);
                } else {
                  console.error(`🛒 ADD: Image upload failed for ${meal.name}:`, uploadError);
                  delete meal.imageData; // Remove failed base64
                }
              } catch (uploadError) {
                console.error(`🛒 ADD: Image upload error for ${meal.name}:`, uploadError);
                delete meal.imageData; // Remove failed base64
              }
            }
          }
        }
        
        insertData.assessment_data = assessmentData;
        console.log(`🛒 ADD: Saving assessment data with new cart`);
      }
      
      const { data: newCartHeader, error: newCartError } = await supabase
        .from("cart_headers")
        .insert(insertData)
        .select("id")
        .single();
        
      if (newCartError) {
        console.error(`🛒 ADD: New cart error:`, newCartError)
        throw new Error(`New cart error: ${newCartError.message}`);
      }
      cartId = newCartHeader.id;
      isNewCart = true;
      console.log(`🛒 ADD: Created cart ${cartId}${assessmentData ? ' with assessment data' : ''}`)
    } else {
      cartId = cartHeader.id;
      console.log(`🛒 ADD: Using existing cart ${cartId}`)
      
      // If assessment data provided and cart already exists, update it
      if (assessmentData) {
        // Upload meal images to Supabase Storage and replace base64 with URLs
        const outputData = assessmentData.output || assessmentData;
        if (outputData?.recommended_meals && Array.isArray(outputData.recommended_meals)) {
          console.log(`🛒 ADD: Processing ${outputData.recommended_meals.length} meal images...`);
          
          for (const meal of outputData.recommended_meals) {
            if (meal.imageData && meal.imageData.length > 100) { // Has actual base64 data
              try {
                // Convert base64 to buffer
                const base64Data = meal.imageData.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                
                // Upload to Supabase Storage
                const fileName = `meal-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('meal-images')
                  .upload(fileName, buffer, {
                    contentType: 'image/png',
                    cacheControl: '3600',
                  });
                
                if (!uploadError && uploadData) {
                  // Get public URL
                  const { data: { publicUrl } } = supabase.storage
                    .from('meal-images')
                    .getPublicUrl(fileName);
                  
                  meal.imageUrl = publicUrl;
                  delete meal.imageData; // Remove base64 to keep payload small
                  console.log(`🛒 ADD: Uploaded meal image: ${meal.name} → ${publicUrl}`);
                } else {
                  console.error(`🛒 ADD: Image upload failed for ${meal.name}:`, uploadError);
                  delete meal.imageData; // Remove failed base64
                }
              } catch (uploadError) {
                console.error(`🛒 ADD: Image upload error for ${meal.name}:`, uploadError);
                delete meal.imageData; // Remove failed base64
              }
            }
          }
        }
        
        const { error: updateError } = await supabase
          .from("cart_headers")
          .update({ assessment_data: assessmentData })
          .eq("id", cartId);
          
        if (updateError) {
          console.error(`🛒 ADD: Failed to update assessment data:`, updateError);
        } else {
          console.log(`🛒 ADD: Updated assessment data for existing cart ${cartId}`);
        }
      }
    }
    
    // 2. Add item to cart_items or update quantity if exists
    const { data: existingItem, error: existingItemError } = await supabase
      .from("cart_items")
      .select("id, qty")
      .eq("cart_id", cartId)
      .eq("item_id", itemId)
      .maybeSingle();
      
    if (existingItemError) {
      throw new Error(`Existing item error: ${existingItemError.message}`);
    }
    
    if (existingItem) {
      console.log(`🛒 ADD: Updating existing item ${itemId} from qty ${existingItem.qty} to ${existingItem.qty + qty}`)
      // Update quantity if item already exists
      const updateData: any = { qty: existingItem.qty + qty };
      
      // Update ai_recommendation if provided (replace existing)
      if (ai_recommendation) {
        updateData.ai_recommendation = ai_recommendation;
        console.log(`🛒 ADD: Updating AI recommendation for item ${itemId}`)
      }
      
      const { error: updateError } = await supabase
        .from("cart_items")
        .update(updateData)
        .eq("id", existingItem.id);
        
      if (updateError) {
        console.error(`🛒 ADD: Update error:`, updateError)
        throw new Error(`Update error: ${updateError.message}`);
      }
      console.log(`🛒 ADD: Successfully updated item ${itemId}`)
      return NextResponse.json({ success: true, action: 'updated' });
    } else {
      console.log(`🛒 ADD: Inserting new item ${itemId} with qty ${qty}`)
      // Insert new item
      const insertData: any = {
        cart_id: cartId,
        item_id: itemId,
        qty,
      };
      
      if (bundle_components) {
        insertData.bundle_components = bundle_components;
      }
      
      if (ai_recommendation) {
        insertData.ai_recommendation = ai_recommendation;
        console.log(`🛒 ADD: Storing AI recommendation:`, ai_recommendation.reason)
      }
      
      const { error: insertError } = await supabase
        .from("cart_items")
        .insert(insertData);
        
      if (insertError) {
        console.error(`🛒 ADD: Insert error:`, insertError)
        throw new Error(`Insert error: ${insertError.message}`);
      }
      console.log(`🛒 ADD: Successfully inserted item ${itemId}`)
      return NextResponse.json({ success: true, action: 'inserted' });
    }
  } catch (error: any) {
    console.error("Cart add error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
