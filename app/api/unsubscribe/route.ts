import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const { error } = await supabase.from('unsubscribes').insert({ email });

    if (error && error.code !== '23505') { // 23505 is unique_violation, ignore if they already unsubscribed
      throw error;
    }

    return NextResponse.json({ message: 'Successfully unsubscribed' }, { status: 200 });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
