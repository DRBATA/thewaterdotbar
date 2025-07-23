import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';

interface OrderConfirmationEmailProps {
  userFirstName?: string;
  orderId?: string;
  orderItems?: { name: string; quantity: number; pin_code: string | string[]; image_url?: string; price?: number }[];
  total?: number;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const OrderConfirmationEmail = ({ userFirstName = 'Valued Customer', orderId, orderItems = [], total = 0 }: OrderConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Water Bar Order Confirmation & Tickets</Preview>
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
            Thank you for your order! We're excited to see you. Below are your digital tickets with PIN codes. Please present these at the venue to claim your items.
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
              
              {item.pin_code && (
                <Section style={{ textAlign: 'center', marginTop: '16px' }}>
                  {Array.isArray(item.pin_code) ? (
                    <div style={{ display: 'inline-block' }}>
                      {item.pin_code.map((pin: string, pinIndex: number) => {
                        const pinLabels = ['Entry', 'Drink', 'Wellness'];
                        return (
                          <div key={pin} style={pinContainer}>
                            <Text style={pinLabel}>{pinLabels[pinIndex] || 'Your'} PIN</Text>
                            <Text style={pinCode}>{pin}</Text>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={pinContainer}>
                      <Text style={pinLabel}>Your PIN</Text>
                      <Text style={pinCode}>{item.pin_code}</Text>
                    </div>
                  )}
                  <Text style={pinInfo}>You'll need these PINs to claim your purchases.</Text>
                </Section>
              )}
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
