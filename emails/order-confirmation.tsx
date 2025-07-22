import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

interface OrderConfirmationEmailProps {
  userFirstName?: string;
  orderId?: string;
  orderItems?: { name: string; quantity: number; pin_code: string }[];
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
      <Container style={container}>
        <Img
          src={`${baseUrl}/logo-email.png`}
          width="120"
          height="50"
          alt="The Water Bar"
          style={logo}
        />
        <Heading style={heading}>Your Order is Confirmed!</Heading>
        <Text style={paragraph}>Hi {userFirstName},</Text>
        <Text style={paragraph}>
          Thank you for your order! We're excited to see you. Below are your digital tickets with PIN codes. Please present these at the venue to claim your items.
        </Text>
        
        <Hr style={hr} />

        {orderItems.map((item, index) => (
          <Section key={index} style={itemSection}>
            <Text style={itemTitle}>{item.name} (x{item.quantity})</Text>
            <Text style={pinLabel}>PIN Code:</Text>
            <Text style={pinCode}>{item.pin_code}</Text>
          </Section>
        ))}

        <Hr style={hr} />

        <Section style={totalSection}>
          <Text style={totalText}>Total: AED {total.toFixed(2)}</Text>
        </Section>

        <Text style={paragraph}>
          You can view your full receipt online here:
        </Text>
        <Button style={button} href={`${baseUrl}/receipt/${orderId}`}>
          View Online Receipt
        </Button>
        
        <Hr style={hr} />
        <Text style={footer}>
          The Water Bar | In partnership with AOI Rejuvenation
        </Text>
      </Container>
    </Body>
  </Html>
);

export default OrderConfirmationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const logo = {
  margin: '0 auto',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  marginTop: '48px',
  textAlign: 'center' as const,
  color: '#484848',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 20px',
  color: '#525f7f',
};

const itemSection = {
  padding: '0 20px',
};

const itemTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#484848',
  margin: '10px 0 0 0',
};

const pinLabel = {
  fontSize: '14px',
  color: '#525f7f',
  margin: '5px 0 0 0',
};

const pinCode = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#007bff',
  backgroundColor: '#f0f8ff',
  padding: '8px 12px',
  borderRadius: '4px',
  display: 'inline-block',
  margin: '5px 0 15px 0',
};

const totalSection = {
  padding: '0 20px',
  textAlign: 'right' as const,
};

const totalText = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#484848',
};

const button = {
  backgroundColor: '#007bff',
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

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};
