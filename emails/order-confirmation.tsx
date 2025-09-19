import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';

interface OrderConfirmationEmailProps {
  userFirstName?: string;
  orderId?: string;
  orderItems?: { name: string; quantity: number; image_url?: string; price?: number }[];
  total?: number;
  hydrationPlan?: {
    profile: {
      age: number;
      weight: number;
      height: number;
      gender: string;
      bodyFat: number;
    };
    dailyTargets: {
      water: number;
      sodium: number;
      potassium: number;
      protein: number;
      fiber: number;
    };
    deficits: {
      water: number;
      sodium: number;
      potassium: number;
      protein: number;
      fiber: number;
    };
    recommendedDrinks?: Array<{
      name: string;
      nutrients: any;
      reason: string;
    }>;
    recommendedMeals?: Array<{
      name: string;
      foods: string[];
      nutrients: any;
      explanation: string;
    }>;
  };
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const OrderConfirmationEmail = ({ userFirstName = 'Valued Customer', orderId, orderItems = [], total = 0, hydrationPlan }: OrderConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Water Bar Order Confirmation</Preview>
    <Body style={main}>
      <Container>
        <Section style={logo}>
          <Link href="https://thewater.bar">
            <Img src="https://www.thewater.bar/logo.png" width="150" alt="The Water Bar Logo" />
          </Link>
        </Section>

        <Section style={content}>
          <Heading style={heading}>Your Order is Confirmed!</Heading>
          <Text style={paragraph}>Hi {userFirstName},</Text>
          <Text style={paragraph}>
            Thank you for your order! We're excited to see you at the venue. Your items are ready for collection - simply show this confirmation to our staff.
          </Text>
          
          {orderId && (
            <Section style={{ marginBottom: '20px' }}>
              <Row>
                <Column><strong>Order ID:</strong> #{orderId.substring(0, 8)}</Column>
                <Column style={{ textAlign: 'right' }}><strong>Date:</strong> {new Date().toLocaleDateString()}</Column>
              </Row>
            </Section>
          )}

          {orderItems.map((item, index) => (
            <Section key={index} style={itemSection}>
              <Row>
                {item.image_url && (
                  <Column style={{ width: '80px' }}>
                    <Img src={`${baseUrl}${item.image_url}`} width="64" height="64" alt={item.name} style={{ borderRadius: '4px' }} />
                  </Column>
                )}
                <Column>
                  <Text style={itemText}><strong>{item.name}</strong></Text>
                  <Text style={itemText}>Qty: {item.quantity}{item.price && ` | Price: AED ${item.price.toFixed(2)}`}</Text>
                </Column>
              </Row>
            </Section>
          ))}

          <Section style={totalsSection}>
            <Row>
              <Column style={{ textAlign: 'right' }}>
                <Text style={totalsText}><strong>Total: AED {total.toFixed(2)}</strong></Text>
              </Column>
            </Row>
          </Section>

          <Section style={{ textAlign: 'center' }}>
            <Button 
              style={whatsappButton} 
              href="https://api.whatsapp.com/send?phone=442081336235&text=Hi%20Water%20Bar!%20I%27d%20love%20to%20share%20some%20feedback%20about%20my%20experience."
            >
              💬 Share Feedback on WhatsApp
            </Button>
            <Text style={paragraph}>
              We love all feedback so we can make the service better meet your requirements.
            </Text>
          </Section>

          {hydrationPlan && (
            <>
              <Hr style={hr} />
              <Section style={hydrationSection}>
                <Heading style={hydrationHeading}>🎯 Your Personalized Hydration Plan</Heading>
                
                <Text style={paragraph}>
                  Based on your assessment, here's what your body needs today:
                </Text>

                {/* Profile Summary */}
                <Section style={profileSection}>
                  <Text style={profileText}>
                    <strong>Your Profile:</strong> {hydrationPlan.profile.age}y, {hydrationPlan.profile.weight}kg, {hydrationPlan.profile.height}cm, {hydrationPlan.profile.gender}
                  </Text>
                </Section>

                {/* Key Deficits */}
                <Section style={deficitSection}>
                  <Heading style={subHeading}>📊 What You Still Need Today</Heading>
                  <Row>
                    <Column style={deficitColumn}>
                      <Text style={deficitText}>
                        💧 <strong>Water:</strong> {Math.round(hydrationPlan.deficits.water)}ml
                      </Text>
                      <Text style={deficitText}>
                        🧂 <strong>Sodium:</strong> {Math.round(hydrationPlan.deficits.sodium)}mg
                      </Text>
                    </Column>
                    <Column style={deficitColumn}>
                      <Text style={deficitText}>
                        🍌 <strong>Potassium:</strong> {Math.round(hydrationPlan.deficits.potassium)}mg
                      </Text>
                      <Text style={deficitText}>
                        🥩 <strong>Protein:</strong> {Math.round(hydrationPlan.deficits.protein)}g
                      </Text>
                    </Column>
                  </Row>
                </Section>

                {/* Recommended Drinks */}
                {hydrationPlan.recommendedDrinks && hydrationPlan.recommendedDrinks.length > 0 && (
                  <Section style={recommendationSection}>
                    <Heading style={subHeading}>🥤 Recommended Drinks</Heading>
                    {hydrationPlan.recommendedDrinks.map((drink, index) => (
                      <Section key={index} style={recommendationItem}>
                        <Text style={recommendationTitle}><strong>{drink.name}</strong></Text>
                        <Text style={recommendationReason}>{drink.reason}</Text>
                      </Section>
                    ))}
                  </Section>
                )}

                {/* Recommended Meals */}
                {hydrationPlan.recommendedMeals && hydrationPlan.recommendedMeals.length > 0 && (
                  <Section style={recommendationSection}>
                    <Heading style={subHeading}>🍽️ Recommended Meals</Heading>
                    {hydrationPlan.recommendedMeals.map((meal, index) => (
                      <Section key={index} style={recommendationItem}>
                        <Text style={recommendationTitle}><strong>{meal.name}</strong></Text>
                        <Text style={mealFoods}>Includes: {meal.foods.join(', ')}</Text>
                        <Text style={recommendationReason}>{meal.explanation}</Text>
                      </Section>
                    ))}
                  </Section>
                )}

                <Section style={planFooter}>
                  <Text style={planFooterText}>
                    💡 <strong>Pro Tip:</strong> Complete your hydration goals throughout the day for optimal performance and wellness.
                  </Text>
                </Section>
              </Section>
            </>
          )}

          <Hr style={hr} />
        </Section>

        <Text style={footerText}>
          Thank you for your purchase! If you have any questions, please contact us.
        </Text>
        <Link href="https://www.instagram.com/thewaterbarglobal/" style={{ color: '#007ee6', textDecoration: 'underline', fontSize: '12px', textAlign: 'center' }}>
          Follow us on Instagram
        </Link>
        <Text style={footerText}>
          &copy; 2024 | The Water Bar | Dubai, UAE
        </Text>
      </Container>
    </Body>
  </Html>
);

export default OrderConfirmationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const logo = {
  padding: '30px 20px',
  textAlign: 'center' as const,
};

const content = {
  border: '1px solid #e0e0e0',
  borderRadius: '5px',
  backgroundColor: '#ffffff',
  padding: '20px',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  marginTop: '20px',
  textAlign: 'center' as const,
  color: '#484848',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'left' as const,
  color: '#525f7f',
};

const itemSection = {
  borderBottom: '1px solid #e0e0e0',
  padding: '16px 0',
};

const itemText = {
  margin: 0,
  fontSize: '14px',
  lineHeight: '22px',
};

const pinContainer = {
  display: 'inline-block',
  padding: '12px',
  margin: '0 5px',
  borderRadius: '8px',
  backgroundColor: '#e0f2fe',
  border: '2px solid #7dd3fc',
  textAlign: 'center' as const,
};

const pinLabel = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#0c4a6e',
  margin: 0,
};

const pinCode = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0369a1',
  margin: '4px 0 0 0',
  letterSpacing: '0.1em',
};

const pinInfo = {
  marginTop: '8px',
  fontSize: '12px',
  color: '#075985',
};

const totalsSection = {
  paddingTop: '16px',
};

const totalsText = {
  fontSize: '18px',
  margin: 0,
};

const whatsappButton = {
  backgroundColor: '#25D366',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
  margin: '20px auto',
  width: '200px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footerText = {
  textAlign: 'center' as const,
  fontSize: '12px',
  color: '#6b7280',
  padding: '20px',
};

// Hydration Plan Styles
const hydrationSection = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '24px',
  margin: '20px 0',
};

const hydrationHeading = {
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  color: '#1e40af',
  marginBottom: '16px',
};

const subHeading = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#374151',
  marginBottom: '12px',
};

const profileSection = {
  backgroundColor: '#eff6ff',
  padding: '12px',
  borderRadius: '6px',
  marginBottom: '16px',
};

const profileText = {
  fontSize: '14px',
  color: '#1e40af',
  margin: 0,
};

const deficitSection = {
  backgroundColor: '#fef3c7',
  padding: '16px',
  borderRadius: '6px',
  marginBottom: '16px',
};

const deficitColumn = {
  width: '50%',
  paddingRight: '8px',
};

const deficitText = {
  fontSize: '14px',
  margin: '4px 0',
  color: '#92400e',
};

const recommendationSection = {
  marginBottom: '16px',
};

const recommendationItem = {
  backgroundColor: '#f0fdf4',
  padding: '12px',
  borderRadius: '6px',
  marginBottom: '8px',
  border: '1px solid #bbf7d0',
};

const recommendationTitle = {
  fontSize: '16px',
  color: '#166534',
  margin: '0 0 4px 0',
};

const recommendationReason = {
  fontSize: '14px',
  color: '#15803d',
  margin: 0,
  fontStyle: 'italic',
};

const mealFoods = {
  fontSize: '12px',
  color: '#059669',
  margin: '2px 0 4px 0',
};

const planFooter = {
  backgroundColor: '#ddd6fe',
  padding: '12px',
  borderRadius: '6px',
  textAlign: 'center' as const,
  marginTop: '16px',
};

const planFooterText = {
  fontSize: '14px',
  color: '#5b21b6',
  margin: 0,
};
