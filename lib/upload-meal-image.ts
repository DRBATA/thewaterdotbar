import { createClient } from '@/lib/supabase/client';

/**
 * Uploads an AI-generated meal image to Supabase Storage
 * @param imageUrl - URL of the generated image (from OpenAI DALL-E, etc.)
 * @param mealName - Descriptive name for the meal
 * @returns Public URL of the uploaded image
 */
export async function uploadMealImage(
  imageUrl: string,
  mealName: string
): Promise<string | null> {
  try {
    // Fetch the image from the AI provider
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Generate unique filename: meal-name-timestamp-random.jpg
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const sanitizedName = mealName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const filename = `${sanitizedName}-${timestamp}-${random}.jpg`;

    // Upload to Supabase Storage
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('meal-images')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      });

    if (error) {
      console.error('Error uploading meal image:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('meal-images')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadMealImage:', error);
    return null;
  }
}

/**
 * Uploads multiple meal images in parallel
 * @param meals - Array of meals with imageUrl and name
 * @returns Array of meals with updated imageUrl (Supabase URLs)
 */
export async function uploadMealImages(
  meals: Array<{ name: string; imageUrl?: string; [key: string]: any }>
): Promise<Array<{ name: string; imageUrl?: string; [key: string]: any }>> {
  const uploadPromises = meals.map(async (meal) => {
    if (!meal.imageUrl) {
      return meal;
    }

    // If already a Supabase URL, skip
    if (meal.imageUrl.includes('supabase.co/storage')) {
      return meal;
    }

    const uploadedUrl = await uploadMealImage(meal.imageUrl, meal.name);
    
    return {
      ...meal,
      imageUrl: uploadedUrl || meal.imageUrl, // Fallback to original if upload fails
    };
  });

  return Promise.all(uploadPromises);
}
