import { Section, Text, Heading } from '@react-email/components';

interface Deficits {
  water_ml?: number;
  sodium_mg?: number;
  potassium_mg?: number;
  magnesium_mg?: number;
  fiber_g?: number;
  [key: string]: number | undefined;
}

interface MicronutrientBreakdownProps {
  deficits: Deficits;
  primaryColor: string;
}

export function MicronutrientBreakdown({ deficits, primaryColor }: MicronutrientBreakdownProps) {
  const hasDeficits = Object.keys(deficits).some(key => deficits[key] && deficits[key]! > 0);
  
  if (!hasDeficits) return null;

  return (
    <Section style={content}>
      <Heading as="h2" style={{ ...h2, color: primaryColor }}>
        📊 Your Micronutrient Breakdown
      </Heading>
      
      <Section style={deficitsBox}>
        <Text style={deficitsLabel}>What Your Body Needs:</Text>
        
        {deficits.water_ml && deficits.water_ml > 0 && (
          <Text style={deficitItem}>
            💧 <strong>Water:</strong> {deficits.water_ml}ml to reach optimal hydration
          </Text>
        )}
        
        {deficits.sodium_mg && deficits.sodium_mg > 0 && (
          <Text style={deficitItem}>
            🧂 <strong>Sodium:</strong> {deficits.sodium_mg}mg for electrolyte balance
          </Text>
        )}
        
        {deficits.potassium_mg && deficits.potassium_mg > 0 && (
          <Text style={deficitItem}>
            🍌 <strong>Potassium:</strong> {deficits.potassium_mg}mg for muscle function
          </Text>
        )}
        
        {deficits.magnesium_mg && deficits.magnesium_mg > 0 && (
          <Text style={deficitItem}>
            ⚡ <strong>Magnesium:</strong> {deficits.magnesium_mg}mg for energy production
          </Text>
        )}
        
        {deficits.fiber_g && deficits.fiber_g > 0 && (
          <Text style={deficitItem}>
            🌾 <strong>Fiber:</strong> {deficits.fiber_g}g for digestive health
          </Text>
        )}
      </Section>
    </Section>
  );
}

const content = {
  padding: '20px',
  backgroundColor: '#ffffff',
};

const h2 = {
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const deficitsBox = {
  backgroundColor: '#FFF6EA',
  border: '2px solid #FFA500',
  borderRadius: '8px',
  padding: '16px',
  marginTop: '12px',
};

const deficitsLabel = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#333333',
  margin: '0 0 12px',
};

const deficitItem = {
  fontSize: '14px',
  color: '#555555',
  margin: '8px 0',
  lineHeight: '1.6',
};
