import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { formatCurrency } from '../lib/utils';

interface OrderConfirmationEmailProps {
  order?: any; // A more specific type should be used in a real app
  userEmail?: string;
}

const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://thewater.bar'
  : 'http://localhost:3000';

export const WaterBarOrderConfirmationEmail = ({
  order,
  userEmail = 'guest@example.com',
}: OrderConfirmationEmailProps) => {
  const unsubscribeLink = `${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`;

  if (!order) {
    return <Html><Body><Text>Order information is missing.</Text></Body></Html>;
  }

  return (
    <Html>
      <Head />
      <Preview>Your Water Bar Order Confirmation #{order.id.toString().substring(0, 8)}</Preview>
      <Body style={main}>
        <Container>
          <Section style={logo}>
            <Img src={`${baseUrl}/drinks/logo.png`} width="150" alt="The Water Bar Logo" />
          </Section>

          <Section style={content}>
            <Heading style={{ textAlign: 'center' }}>Thank you for your order!</Heading>
            <Text style={paragraph}>Hi {order.email},</Text>
            <Text style={paragraph}>We're getting your order ready. Here are the details:</Text>

            <Section style={{ marginBottom: '20px' }}>
              <Row>
                <Column><strong>Order ID:</strong> #{order.id.toString().substring(0, 8)}</Column>
                <Column style={{ textAlign: 'right' }}><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</Column>
              </Row>
            </Section>

            {order.order_items.map((item: any, index: number) => (
              <Section key={index} style={itemSection}>
                <Row>
                  <Column style={{ width: '80px' }}><Img src={`${baseUrl}${item.image_url}`} width="64" height="64" alt={item.name} style={{ borderRadius: '4px' }} /></Column>
                  <Column>
                    <Text style={itemText}><strong>{item.name}</strong></Text>
                    <Text style={itemText}>Qty: {item.qty} | Price: {formatCurrency(item.price)}</Text>
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
                <Column style={{ textAlign: 'right' }}><Text style={totalsText}><strong>Total: {formatCurrency(order.total)}</strong></Text></Column>
              </Row>
            </Section>
          </Section>

          <Text style={footerText}>
            © 2024 | The Water Bar | Dubai, UAE
            <br />
            <Link href={unsubscribeLink} style={unsubscribeLinkStyle}>
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WaterBarOrderConfirmationEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const paragraph = {
  fontSize: 16,
  lineHeight: '26px',
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

const footerText = {
  textAlign: 'center' as const,
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '20px',
};

const unsubscribeLinkStyle = {
  color: '#4b5563',
  textDecoration: 'underline',
};
