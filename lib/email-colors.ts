/**
 * Calculate dynamic email colors based on products in cart
 */

interface ProductColor {
  color_primary: string;
  color_accent: string;
  color_mood: string;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join('');
}

/**
 * Calculate mean (average) of multiple colors
 */
function calculateMeanColor(colors: string[]): string {
  if (colors.length === 0) return '#00C9B7'; // Default Water Bar blue
  
  const rgbColors = colors.map(hexToRgb).filter(c => c !== null) as Array<{ r: number; g: number; b: number }>;
  
  if (rgbColors.length === 0) return '#00C9B7';
  
  const avgR = rgbColors.reduce((sum, c) => sum + c.r, 0) / rgbColors.length;
  const avgG = rgbColors.reduce((sum, c) => sum + c.g, 0) / rgbColors.length;
  const avgB = rgbColors.reduce((sum, c) => sum + c.b, 0) / rgbColors.length;
  
  return rgbToHex(avgR, avgG, avgB);
}

/**
 * Find mode (most common) color
 */
function findModeColor(colors: string[]): string {
  if (colors.length === 0) return '#0EA5E9'; // Default accent
  
  const frequency: Record<string, number> = {};
  
  colors.forEach(color => {
    frequency[color] = (frequency[color] || 0) + 1;
  });
  
  let maxCount = 0;
  let modeColor = colors[0];
  
  Object.entries(frequency).forEach(([color, count]) => {
    if (count > maxCount) {
      maxCount = count;
      modeColor = color;
    }
  });
  
  return modeColor;
}

/**
 * Find mode (most common) mood
 */
function findModeMood(moods: string[]): string {
  if (moods.length === 0) return 'energetic';
  
  const frequency: Record<string, number> = {};
  
  moods.forEach(mood => {
    frequency[mood] = (frequency[mood] || 0) + 1;
  });
  
  let maxCount = 0;
  let modeMood = moods[0];
  
  Object.entries(frequency).forEach(([mood, count]) => {
    if (count > maxCount) {
      maxCount = count;
      modeMood = mood;
    }
  });
  
  return modeMood;
}

/**
 * Lighten a color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const r = Math.min(255, rgb.r + (255 - rgb.r) * percent);
  const g = Math.min(255, rgb.g + (255 - rgb.g) * percent);
  const b = Math.min(255, rgb.b + (255 - rgb.b) * percent);
  
  return rgbToHex(r, g, b);
}

/**
 * Calculate email colors from product list
 */
export function calculateEmailColors(products: ProductColor[]) {
  // If no products with colors, return default Water Bar theme
  if (!products || products.length === 0) {
    return {
      primary: '#00C9B7',
      accent: '#0EA5E9',
      background: '#F0F9FF',
      mood: 'energetic',
    };
  }
  
  // Extract all primary colors
  const primaryColors = products
    .filter(p => p.color_primary)
    .map(p => p.color_primary);
  
  // Extract all accent colors
  const accentColors = products
    .filter(p => p.color_accent)
    .map(p => p.color_accent);
  
  // Extract all moods
  const moods = products
    .filter(p => p.color_mood)
    .map(p => p.color_mood);
  
  // Calculate mean (primary color)
  const primary = calculateMeanColor(primaryColors);
  
  // Calculate mode (accent color - most common)
  const accent = findModeColor(accentColors);
  
  // Find most common mood
  const mood = findModeMood(moods);
  
  // Calculate background (lighten primary by 95%)
  const background = lightenColor(primary, 0.95);
  
  return {
    primary,
    accent,
    background,
    mood,
  };
}
