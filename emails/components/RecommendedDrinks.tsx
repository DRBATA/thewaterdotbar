import { Section, Text, Heading } from '@react-email/components';

interface Drink {
  name: string;
  reason: string;
}

interface RecommendedDrinksProps {
  drinks: Drink[];
  primaryColor: string;
}

export function RecommendedDrinks({ drinks, primaryColor }: RecommendedDrinksProps) {
  if (!drinks || drinks.length === 0) return null;

  return (
    <Section style={content}>
      <Heading as="h2" style={{ ...h2, color: primaryColor }}>
        🥤 Recommended Drinks
      </Heading>
      
      <Text style={intro}>
        Based on your micronutrient analysis, these drinks will help fill your nutritional gaps:
      </Text>
      
      {drinks.map((drink, index) => (
        <Section key={index} style={drinkBox}>
          <Text style={drinkName}>• {drink.name}</Text>
          <Text style={drinkReason}>{drink.reason}</Text>
        </Section>
      ))}
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

const intro = {
  fontSize: '14px',
  color: '#666666',
  margin: '0 0 16px',
  lineHeight: '1.6',
};

const drinkBox = {
  backgroundColor: '#F0F9FF',
  borderLeft: '4px solid #0EA5E9',
  padding: '12px',
  marginBottom: '12px',
  borderRadius: '4px',
};

const drinkName = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#333333',
  margin: '0 0 4px',
};

const drinkReason = {
  fontSize: '14px',
  color: '#555555',
  margin: '0',
  fontStyle: 'italic',
  lineHeight: '1.5',
};
