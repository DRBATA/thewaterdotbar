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
import { MicronutrientBreakdown } from './components/MicronutrientBreakdown';
import { RecommendedDrinks } from './components/RecommendedDrinks';
import { RecommendedMeals } from './components/RecommendedMeals';

interface SharePlanEmailProps {
  customerName: string;
  cartId: string;
  
  // Assessment data
  assessment: {
    deficits: {
      water_ml?: number;
      sodium_mg?: number;
      potassium_mg?: number;
      magnesium_mg?: number;
      fiber_g?: number;
    };
    recommended_drinks: Array<{
      name: string;
      reason: string;
    }>;
    recommended_meals: Array<{
      name: string;
      description: string;
      imageUrl?: string;
      nutritional_benefits?: string;
    }>;
  };
  
  // QR Code for venue scanning
  qrCodeUrl: string;
  
  // Dynamic colors from product selection
  colors: {
    primary: string;
    accent: string;
    background: string;
    mood: string;
  };
  
  // Action URLs
  updatePlanUrl?: string;
  viewCartUrl?: string;
}

export default function SharePlanEmail({
  customerName,
  cartId,
  assessment,
  qrCodeUrl,
  colors,
  updatePlanUrl,
  viewCartUrl,
}: SharePlanEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Personalized Hydration Plan is Ready to Share</Preview>
      <Body style={{ ...main, backgroundColor: colors.background }}>
        <Container style={container}>
          {/* Dynamic Color Header */}
          <Section style={{ 
            ...header, 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)` 
          }}>
            <Heading style={h1}>
              ✨ Your Hydration Plan
            </Heading>
            <Text style={subtitle}>
              Personalized for you • {colors.mood} energy
            </Text>
          </Section>

          {/* Greeting */}
          <Section style={content}>
            <Text style={paragraph}>
              Hi <strong>{customerName}</strong>,
            </Text>
            <Text style={paragraph}>
              Your AI-powered hydration plan is ready! Share this at any of our partner venues using the QR code below.
            </Text>
          </Section>

          {/* Micronutrient Breakdown */}
          <MicronutrientBreakdown 
            deficits={assessment.deficits} 
            primaryColor={colors.primary} 
          />

          <Hr style={sectionDivider} />

          {/* Recommended Drinks */}
          <RecommendedDrinks 
            drinks={assessment.recommended_drinks} 
            primaryColor={colors.primary} 
          />

          <Hr style={sectionDivider} />

          {/* Recommended Meals */}
          <RecommendedMeals 
            meals={assessment.recommended_meals} 
            primaryColor={colors.primary} 
          />

          <Hr style={sectionDivider} />

          {/* QR Code Section */}
          <Section style={qrSection}>
            <Heading as="h2" style={{ ...h2, color: colors.primary }}>
              📱 Share at Venue
            </Heading>
            <Text style={qrInstructions}>
              Show this QR code at any partner venue to access your personalized recommendations:
            </Text>
            
            <div style={qrContainer}>
              <Img
                src={qrCodeUrl}
                width="200"
                height="200"
                alt="Your Plan QR Code"
                style={{ margin: '0 auto' }}
              />
            </div>
            
            <Text style={qrHelper}>
              Staff can scan this to see what drinks best match your nutritional needs
            </Text>
          </Section>

          <Hr style={sectionDivider} />

          {/* Action Buttons */}
          <Section style={ctaSection}>
            {updatePlanUrl && (
              <Button 
                href={updatePlanUrl}
                style={{ ...button, backgroundColor: colors.primary, marginBottom: '12px' }}
              >
                📱 Update My Tracker
              </Button>
            )}
            
            {viewCartUrl && (
              <Button 
                href={viewCartUrl}
                style={{ ...buttonSecondary, borderColor: colors.primary, color: colors.primary }}
              >
                🛒 View My Cart
              </Button>
            )}
            
            <Text style={ctaHelper}>
              Keep this email to reference your plan anytime
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <strong>Partner Venues:</strong> Art of Implosion, F45 Training, The Water Bar Pop-Ups
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
  fontSize: '32px',
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
  textTransform: 'capitalize' as const,
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

const qrSection = {
  padding: '24px 20px',
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
};

const qrInstructions = {
  fontSize: '14px',
  color: '#666666',
  margin: '0 0 20px',
  lineHeight: '1.6',
};

const qrContainer = {
  display: 'inline-block',
  padding: '20px',
  backgroundColor: '#ffffff',
  border: '2px solid #E5E7EB',
  borderRadius: '12px',
  margin: '0 0 16px',
};

const qrHelper = {
  fontSize: '12px',
  color: '#999999',
  margin: '0',
  fontStyle: 'italic' as const,
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
  width: '100%',
  maxWidth: '300px',
};

const buttonSecondary = {
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  border: '2px solid',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  width: '100%',
  maxWidth: '300px',
};

const ctaHelper = {
  fontSize: '13px',
  color: '#666666',
  margin: '16px 0 0',
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
