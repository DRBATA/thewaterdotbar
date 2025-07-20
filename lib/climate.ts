// Climate module for hydration calculations
// Based on WHO "Beat the Heat" guidance and US Army/OSHA WBGT tables

export type HeatBand = 'comfort' | 'caution' | 'extremeCaution' | 'danger' | 'extremeDanger';

/**
 * Fetches current temperature and humidity data from OpenWeatherMap API
 * Calculates Heat Index and determines appropriate heat band
 * @param lat Default is Dubai DIFC location
 * @param lon Default is Dubai DIFC location
 * @returns Object with temperature, relative humidity, heat index, and heat band
 */
export async function getHeatContext(
  lat = 25.225, 
  lon = 55.288, // DWTC (Dubai World Trade Centre) default
): Promise<{ temp: number; rh: number; heatIndex: number; band: HeatBand }> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OWM_KEY}&units=metric`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 180 } }); // Cache for 3 minutes
    
    if (!response.ok) {
      console.error(`OpenWeatherMap API error: ${response.status}`);
      // Default to conservative values if API fails
      return { temp: 35, rh: 50, heatIndex: 38, band: 'extremeCaution' };
    }
    
    const data = await response.json();
    const { temp, humidity } = data.main;
    
    // Calculate Heat Index using Rothfusz regression
    const hi = calcHeatIndexC(temp, humidity);
    
    // Determine heat band based on Heat Index
    const band = getHeatBand(hi);
    
    return { 
      temp, 
      rh: humidity, 
      heatIndex: hi, 
      band 
    };
  } catch (error) {
    console.error('Error fetching climate data:', error);
    // Default to conservative values if API fails
    return { temp: 35, rh: 50, heatIndex: 38, band: 'extremeCaution' };
  }
}

/**
 * Calculates Heat Index in Celsius from temperature and relative humidity
 * Uses the Rothfusz regression formula
 * @param t Temperature in Celsius
 * @param rh Relative humidity (0-100)
 * @returns Heat Index in Celsius
 */
export function calcHeatIndexC(t: number, rh: number): number {
  // Convert to F for the canonical formula then back to C
  const T = t * 9/5 + 32;
  const HI_F =
    -42.379 + 2.04901523*T + 10.14333127*rh
    - 0.22475541*T*rh - 6.83783e-3*T*T - 5.481717e-2*rh*rh
    + 1.22874e-3*T*T*rh + 8.5282e-4*T*rh*rh - 1.99e-6*T*T*rh*rh;
  return (HI_F - 32) * 5/9;
}

/**
 * Determines the heat band based on the Heat Index
 * Aligned with WHO's Beat the Heat guidance and US Army/OSHA WBGT tables
 * @param heatIndexC Heat Index in Celsius
 * @returns Heat band category
 */
export function getHeatBand(heatIndexC: number): HeatBand {
  if (heatIndexC < 27) return 'comfort';
  if (heatIndexC < 32) return 'caution';
  if (heatIndexC < 39) return 'extremeCaution';
  if (heatIndexC < 46) return 'danger';
  return 'extremeDanger';
}

/**
 * Gets environmental multipliers based on heat band
 * @param band The current heat band
 * @returns Object with fluid multiplier and additional sodium/potassium values
 */
export function getEnvironmentalMultipliers(band: HeatBand): {
  multiplier: number;
  additionalSodiumMg: number;
  additionalPotassiumMg: number;
  description: string;
} {
  switch (band) {
    case 'comfort':
      return {
        multiplier: 1.0,
        additionalSodiumMg: 0,
        additionalPotassiumMg: 0,
        description: 'Normal conditions'
      };
    case 'caution':
      return {
        multiplier: 1.15,
        additionalSodiumMg: 250,
        additionalPotassiumMg: 0,
        description: 'Warm conditions - increased hydration advised'
      };
    case 'extremeCaution':
      return {
        multiplier: 1.35,
        additionalSodiumMg: 500,
        additionalPotassiumMg: 200,
        description: 'Hot conditions - significantly increased hydration and electrolytes required'
      };
    case 'danger':
      return {
        multiplier: 1.5,
        additionalSodiumMg: 750,
        additionalPotassiumMg: 300,
        description: 'Very hot conditions - high risk of heat stress without proper hydration'
      };
    case 'extremeDanger':
      return {
        multiplier: 1.75,
        additionalSodiumMg: 1000,
        additionalPotassiumMg: 400,
        description: 'Extremely hot conditions - severe heat stress risk, maximum hydration essential'
      };
  }
}
