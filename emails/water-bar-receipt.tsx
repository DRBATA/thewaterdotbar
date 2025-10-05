import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Button,
} from '@react-email/components';
import { OrderItemsList } from './components/OrderItemsList';
import { MicronutrientBreakdown } from './components/MicronutrientBreakdown';
import { RecommendedDrinks } from './components/RecommendedDrinks';
import { RecommendedMeals } from './components/RecommendedMeals';

interface WaterBarReceiptProps {
  customerName?: string;
  customerEmail?: string;
  orderId: string;
  orderDate: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
  total: number;
  
  // Assessment data (conditional)
  assessment?: {
    deficits?: {
      water_ml?: number;
      sodium_mg?: number;
      potassium_mg?: number;
      magnesium_mg?: number;
      fiber_g?: number;
    };
    recommended_drinks?: Array<{
      name: string;
      reason: string;
    }>;
    recommended_meals?: Array<{
      name: string;
      description: string;
      imageUrl?: string;
      nutritional_benefits?: string;
    }>;
  };
  
  // Dynamic colors (from products or default)
  colors?: {
    primary: string;
    accent: string;
    background: string;
  };
  
  // Update tracker URL
  updateTrackerUrl?: string;
}

// Helper to get colors
function getColors(colors?: { primary: string; accent: string; background: string }) {
  if (colors) return colors;
  
  // Default Water Bar blue theme
  return {
    primary: '#00C9B7',
    accent: '#0EA5E9',
    background: '#F0F9FF',
  };
}

export default function WaterBarReceipt({
  customerName = 'Valued Customer',
  customerEmail,
  orderId,
  orderDate,
  orderItems,
  total,
  assessment,
  colors: colorsProp,
  updateTrackerUrl,
}: WaterBarReceiptProps) {
  const colors = getColors(colorsProp);
  const hasAssessment = !!(assessment && (assessment.deficits || assessment.recommended_drinks || assessment.recommended_meals));

  return (
    <Html>
      <Head />
      <Preview>
        {hasAssessment 
          ? `Your Personalized Hydration Plan + Receipt #${orderId.substring(0, 8)}`
          : `Your Water Bar Receipt #${orderId.substring(0, 8)}`
        }
      </Preview>
      <Body style={{ ...main, backgroundColor: colors.background }}>
        <Container style={container}>
          {/* Dynamic Header */}
          <Section style={{ 
            ...header, 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)` 
          }}>
            <Img
              src="https://thewater.bar/logo.png"
              width="120"
              alt="The Water Bar"
              style={{ margin: '0 auto 16px' }}
            />
            <Heading style={h1}>
              {hasAssessment ? '💧 Your Hydration Plan' : '🎉 Order Confirmed!'}
            </Heading>
            <Text style={subtitle}>
              Order #{orderId.substring(0, 8)} • {new Date(orderDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </Section>

          {/* Greeting */}
          <Section style={content}>
            <Text style={paragraph}>
              Hi <strong>{customerName}</strong>,
            </Text>
            <Text style={paragraph}>
              {hasAssessment 
                ? "Thank you for your order! Here's your personalized hydration plan and receipt."
                : "Thank you for your order! Your items are ready for collection."
              }
            </Text>
          </Section>

          {/* Order Items */}
          <Section style={content}>
            <Heading as="h2" style={{ ...h2, color: colors.primary }}>
              📋 Your Order
            </Heading>
            <OrderItemsList items={orderItems} total={total} primaryColor={colors.primary} />
          </Section>

          {/* Assessment Sections (Conditional) */}
          {hasAssessment && assessment && (
            <>
              <Hr style={sectionDivider} />
              
              {/* Micronutrient Breakdown */}
              {assessment.deficits && (
                <MicronutrientBreakdown 
                  deficits={assessment.deficits} 
                  primaryColor={colors.primary} 
                />
              )}
              
              {/* Recommended Drinks */}
              {assessment.recommended_drinks && assessment.recommended_drinks.length > 0 && (
                <RecommendedDrinks 
                  drinks={assessment.recommended_drinks} 
                  primaryColor={colors.primary} 
                />
              )}
              
              {/* Recommended Meals */}
              {assessment.recommended_meals && assessment.recommended_meals.length > 0 && (
                <RecommendedMeals 
                  meals={assessment.recommended_meals} 
                  primaryColor={colors.primary} 
                />
              )}
              
              {/* Update Tracker Button */}
              {updateTrackerUrl && (
                <Section style={ctaSection}>
                  <Button 
                    href={updateTrackerUrl}
                    style={{ ...button, backgroundColor: colors.primary }}
                  >
                    📱 Update My Tracker
                  </Button>
                  <Text style={ctaHelper}>
                    Log this purchase to your personal hydration timeline
                  </Text>
                </Section>
              )}
            </>
          )}

          <Hr style={sectionDivider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Visit us at any of our partner venues or WhatsApp us.
            </Text>
            <Text style={footerText}>
              <Link href="https://thewater.bar" style={link}>
                thewater.bar
              </Link>{' '}
              |{' '}
              <Link href="https://www.instagram.com/thewaterbarglobal/" style={link}>
                @thewaterbarglobal
              </Link>
            </Text>
            <Text style={footerDisclaimer}>
              © {new Date().getFullYear()} The Water Bar | Dubai, UAE
            </Text>
            {customerEmail && (
              <Text style={footerDisclaimer}>
                <Link href={`https://thewater.bar/unsubscribe?email=${encodeURIComponent(customerEmail)}`} style={unsubscribeLink}>
                  Unsubscribe
                </Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  padding: '40px 20px',
  borderRadius: '12px 12px 0 0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1.2',
};

const subtitle = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '400',
  margin: '8px 0 0',
  opacity: '0.9',
};

const content = {
  padding: '24px 20px',
  backgroundColor: '#ffffff',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0 0 12px',
};

const h2 = {
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const sectionDivider = {
  borderColor: '#E5E7EB',
  margin: '0',
};

const ctaSection = {
  padding: '24px 20px',
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
};

const button = {
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '0 0 12px',
};

const ctaHelper = {
  fontSize: '13px',
  color: '#666666',
  margin: '0',
};

const footer = {
  padding: '24px 20px',
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
  borderRadius: '0 0 12px 12px',
};

const footerText = {
  fontSize: '14px',
  color: '#666666',
  margin: '0 0 8px',
  lineHeight: '1.5',
};

const link = {
  color: '#00C9B7',
  textDecoration: 'underline',
};

const footerDisclaimer = {
  fontSize: '12px',
  color: '#999999',
  margin: '12px 0 0',
};

const unsubscribeLink = {
  color: '#999999',
  textDecoration: 'underline',
};
