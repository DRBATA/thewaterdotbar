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
  Hr,
} from '@react-email/components';

interface CleanOrderConfirmationEmailProps {
  order?: any;
  userEmail?: string;
}

const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://thewater.bar'
  : 'http://localhost:3000';

export const CleanOrderConfirmationEmail = ({
  order,
  userEmail = 'guest@example.com',
}: CleanOrderConfirmationEmailProps) => {
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
                  <Column>
                    <Text style={itemText}><strong>{item.name}</strong></Text>
                    <Text style={itemText}>Qty: {item.qty} | Price: {item.price ? `${item.price} AED` : 'N/A'}</Text>
                  </Column>
                </Row>
                {item.pin_code && (
                  <Section style={{ textAlign: 'center', marginTop: '16px' }}>
                    <div style={pinContainer}>
                      <Text style={pinLabel}>Your PIN</Text>
                      <Text style={pinCode}>{item.pin_code}</Text>
                    </div>
                    <Text style={pinInfo}>You'll need these PINs to claim your purchases.</Text>
                  </Section>
                )}
              </Section>
            ))}

            <Section style={{ marginTop: '20px', textAlign: 'right' }}>
              <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>
                Total: {order.total} AED
              </Text>
            </Section>

            <Section style={{ textAlign: 'center', marginTop: '30px' }}>
              <Text style={paragraph}>
                Thank you for choosing The Water Bar! If you have any questions, please contact us.
              </Text>
            </Section>
          </Section>

          <Hr style={{ margin: '20px 0', borderColor: '#cccccc' }} />
          
          <Text style={footerText}>
            &copy; 2024 The Water Bar | Dubai, UAE
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CleanOrderConfirmationEmail;

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const logo = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 20px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#333333',
};

const itemSection = {
  padding: '20px 0',
  borderBottom: '1px solid #eaeaea',
};

const itemText = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#333333',
  margin: '0',
};

const pinContainer = {
  display: 'inline-block',
  padding: '16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '2px solid #007ee6',
  margin: '8px',
};

const pinLabel = {
  fontSize: '12px',
  color: '#666666',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 4px 0',
};

const pinCode = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#007ee6',
  margin: '0',
};

const pinInfo = {
  fontSize: '12px',
  color: '#666666',
  marginTop: '12px',
};

const footerText = {
  fontSize: '12px',
  color: '#666666',
  textAlign: 'center' as const,
  margin: '20px 0',
};
