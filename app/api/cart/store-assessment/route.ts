import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { sessionId, assessmentData } = await req.json();
    
    if (!sessionId || !assessmentData) {
      return NextResponse.json(
        { error: "Missing sessionId or assessmentData" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Store assessment data in database for email integration
    const { data, error } = await supabase
      .from('hydration_assessments')
      .upsert({
        session_id: sessionId,
        profile: assessmentData.profile,
        daily_targets: assessmentData.dailyTargets,
        total_intake: assessmentData.totalIntake,
        activity_level: assessmentData.activityLevel,
        deficits: assessmentData.deficits,
        recommended_drinks: assessmentData.recommendedDrinks || [],
        recommended_meals: assessmentData.recommendedMeals || []
      }, {
        onConflict: 'session_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing assessment:', error);
      return NextResponse.json(
        { error: "Failed to store assessment data" },
        { status: 500 }
      );
    }

    console.log('✅ Stored hydration assessment for session:', sessionId);
    return NextResponse.json({ success: true, id: data.id });

  } catch (error) {
    console.error('Error in store-assessment API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
