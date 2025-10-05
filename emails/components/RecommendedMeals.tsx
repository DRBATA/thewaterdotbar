import { Section, Text, Heading, Img } from '@react-email/components';

interface Meal {
  name: string;
  description: string;
  imageUrl?: string;
  nutritional_benefits?: string;
}

interface RecommendedMealsProps {
  meals: Meal[];
  primaryColor: string;
}

export function RecommendedMeals({ meals, primaryColor }: RecommendedMealsProps) {
  if (!meals || meals.length === 0) return null;

  return (
    <Section style={content}>
      <Heading as="h2" style={{ ...h2, color: primaryColor }}>
        🍽️ Recommended Meals
      </Heading>
      
      <Text style={intro}>
        AI-generated meal recommendations to support your hydration and nutrition goals:
      </Text>
      
      {meals.map((meal, index) => (
        <Section key={index} style={mealBox}>
          {meal.imageUrl && (
            <Img
              src={meal.imageUrl}
              width="100%"
              alt={meal.name}
              style={{ borderRadius: '8px', marginBottom: '12px' }}
            />
          )}
          
          <Text style={mealName}>{meal.name}</Text>
          <Text style={mealDescription}>{meal.description}</Text>
          
          {meal.nutritional_benefits && (
            <Text style={benefits}>
              💡 <em>{meal.nutritional_benefits}</em>
            </Text>
          )}
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

const mealBox = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
};

const mealName = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#333333',
  margin: '0 0 8px',
};

const mealDescription = {
  fontSize: '14px',
  color: '#555555',
  margin: '0 0 12px',
  lineHeight: '1.6',
};

const benefits = {
  fontSize: '13px',
  color: '#666666',
  margin: '0',
  padding: '12px',
  backgroundColor: '#FFFBEB',
  borderRadius: '4px',
  lineHeight: '1.5',
};
