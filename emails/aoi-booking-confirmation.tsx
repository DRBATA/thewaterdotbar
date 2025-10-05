import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
  Img,
} from '@react-email/components';

interface AOIBookingConfirmationProps {
  customerName: string;
  bookings: Array<{
    time: string;
    experience: string;
    duration: number;
    preDrink?: string;
    duringDrink?: string;
    afterDrink?: string;
    explanation?: string;
  }>;
  venue: string;
  totalAmount?: string;
  paymentUrl?: string;
  bookingDate: string;
}

export default function AOIBookingConfirmation({
  customerName = 'Guest',
  bookings = [],
  venue = 'AOI - Al Quoz, Dubai',
  totalAmount = 'AED 180.00',
  paymentUrl = '',
  bookingDate = '2025-07-06',
}: AOIBookingConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Your AOI experience is confirmed - prepare for transformation</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>✨ Your Journey Awaits</Heading>
            <Text style={subtitle}>Art of Implosion Experience Confirmed</Text>
          </Section>

          {/* Greeting */}
          <Section style={content}>
            <Text style={paragraph}>
              Hi <strong>{customerName}</strong>,
            </Text>
            <Text style={paragraph}>
              Your transformative experience at AOI has been confirmed. Here's your personalized journey timeline:
            </Text>
          </Section>

          {/* Timeline */}
          <Section style={timelineSection}>
            <Heading as="h2" style={h2}>
              🕐 Your Experience Timeline
            </Heading>
            <Text style={dateText}>{new Date(bookingDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</Text>
            
            {bookings.map((booking, index) => (
              <Section key={index} style={timelineItem}>
                <div style={timelineBadge}>
                  <Text style={timeText}>{booking.time}</Text>
                </div>
                <div style={timelineContent}>
                  <Text style={experienceTitle}>{booking.experience}</Text>
                  <Text style={durationText}>{booking.duration} minutes</Text>
                  
                  {/* Paired Drinks */}
                  {(booking.preDrink || booking.duringDrink || booking.afterDrink) && (
                    <Section style={drinksBox}>
                      <Text style={drinksLabel}>🥤 Paired Drinks:</Text>
                      {booking.preDrink && (
                        <Text style={drinkItem}>• Pre: {booking.preDrink}</Text>
                      )}
                      {booking.duringDrink && (
                        <Text style={drinkItem}>• During: {booking.duringDrink}</Text>
                      )}
                      {booking.afterDrink && (
                        <Text style={drinkItem}>• After: {booking.afterDrink}</Text>
                      )}
                    </Section>
                  )}
                  
                  {/* AI Explanation */}
                  {booking.explanation && (
                    <Text style={explanation}>
                      💡 <em>{booking.explanation}</em>
                    </Text>
                  )}
                </div>
              </Section>
            ))}
          </Section>

          <Hr style={hr} />

          {/* Venue Info */}
          <Section style={venueSection}>
            <Text style={venueLabel}>📍 Location</Text>
            <Text style={venueText}>{venue}</Text>
          </Section>

          {/* Note: Payment happens at venue after consumption */}
          <Section style={noteSection}>
            <Text style={noteText}>
              💳 Payment will be processed at the venue based on your actual consumption.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Reply to this email or WhatsApp us at +971 XX XXX XXXX
            </Text>
            <Text style={footerText}>
              <Link href="https://artofimplosion.com" style={link}>
                artofimplosion.com
              </Link>
            </Text>
            <Text style={footerDisclaimer}>
              Art of Implosion © 2025 | Al Quoz, Dubai, UAE
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#FAF7FF',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  padding: '40px 20px 20px',
  background: 'linear-gradient(135deg, #6F3BD2 0%, #FF4FD8 100%)',
  borderRadius: '12px 12px 0 0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 8px',
  lineHeight: '1.2',
};

const subtitle = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '400',
  margin: '0',
  opacity: '0.9',
};

const content = {
  padding: '30px 20px 20px',
  backgroundColor: '#ffffff',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0 0 16px',
};

const h2 = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#6F3BD2',
  margin: '0 0 12px',
};

const timelineSection = {
  padding: '0 20px 20px',
  backgroundColor: '#ffffff',
};

const dateText = {
  fontSize: '14px',
  color: '#666666',
  margin: '0 0 24px',
  fontWeight: '500',
};

const timelineItem = {
  display: 'flex' as const,
  marginBottom: '24px',
  position: 'relative' as const,
};

const timelineBadge = {
  backgroundColor: '#6F3BD2',
  borderRadius: '8px',
  padding: '8px 12px',
  marginRight: '16px',
  minWidth: '70px',
  textAlign: 'center' as const,
};

const timeText = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const timelineContent = {
  flex: '1',
};

const experienceTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#333333',
  margin: '0 0 4px',
};

const durationText = {
  fontSize: '14px',
  color: '#666666',
  margin: '0 0 12px',
};

const drinksBox = {
  backgroundColor: '#FFF6EA',
  border: '2px solid #FF4FD8',
  borderRadius: '8px',
  padding: '12px',
  marginTop: '12px',
};

const drinksLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#333333',
  margin: '0 0 8px',
};

const drinkItem = {
  fontSize: '14px',
  color: '#555555',
  margin: '4px 0',
  lineHeight: '1.4',
};

const explanation = {
  fontSize: '13px',
  color: '#666666',
  lineHeight: '1.5',
  marginTop: '12px',
  fontStyle: 'italic',
  padding: '12px',
  backgroundColor: '#F5F0FF',
  borderLeft: '3px solid #6F3BD2',
  borderRadius: '4px',
};

const hr = {
  borderColor: '#E5E7EB',
  margin: '24px 20px',
};

const venueSection = {
  padding: '0 20px',
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
};

const venueLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#999999',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
};

const venueText = {
  fontSize: '16px',
  fontWeight: '500',
  color: '#333333',
  margin: '0 0 20px',
};

const ctaSection = {
  padding: '20px',
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#6F3BD2',
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

const noteSection = {
  padding: '16px 20px',
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
};

const noteText = {
  fontSize: '14px',
  color: '#666666',
  margin: '0',
  fontStyle: 'italic' as const,
};

const footer = {
  padding: '20px',
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
  color: '#6F3BD2',
  textDecoration: 'underline',
};

const footerDisclaimer = {
  fontSize: '12px',
  color: '#999999',
  margin: '16px 0 0',
};
