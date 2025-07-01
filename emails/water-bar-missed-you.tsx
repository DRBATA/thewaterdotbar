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

interface WaterBarMissedYouEmailProps {
  userEmail?: string;
  whatsAppLink?: string;
}

const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://thewater.bar'
  : 'http://localhost:3000';

export const WaterBarMissedYouEmail = ({
  userEmail = 'guest@example.com',
  whatsAppLink = 'https://api.whatsapp.com/send?phone=442081336235&text=Hi%20Water%20Bar!',
}: WaterBarMissedYouEmailProps) => {
  const unsubscribeLink = `${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`;

  return (
    <Html>
      <Head />
      <Preview>We missed you at The Water Bar event!</Preview>
      <Body style={main}>
        <Container>
          <Section style={logo}>
            <Img src={`${baseUrl}/drinks/logo.png`} width="150" alt="The Water Bar Logo" />
          </Section>

          <Section style={content}>
            <Row>
              <Img
                src={`${baseUrl}/drinks/instareelCOVER.png`}
                width="560"
                alt="The Water Bar Event"
                style={{ maxWidth: '100%', margin: '20px 0' }}
              />
            </Row>
            <Row style={{ paddingBottom: '0' }}>
              <Column>
                <Heading
                  style={{
                    fontSize: 32,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  We missed you!
                </Heading>
                <Heading
                  as="h2"
                  style={{
                    fontSize: 26,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  You were missed at The Morning Party x Johny Dar Experience.
                </Heading>

                <Text style={paragraph}>
                  We hope everything is okay. Here's a little glimpse of what you missed.
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  We'd love to see you at our next event!
                </Text>
              </Column>
            </Row>
            <Row style={{ paddingTop: '20px' }}>
              <Column style={buttonContainer} colSpan={2}>
                <Section style={{ marginTop: '32px' }}>
                  <Row>
                    <Column>
                      <Heading as="h2" style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
                        Moments from the Event
                      </Heading>
                    </Column>
                  </Row>
                  <Row style={{ marginTop: '20px' }}>
                    <Column align="center" style={imageColumn}>
                      <Img src={`${baseUrl}/event/dance1.jpg`} style={imageStyle} alt="Guests dancing" />
                    </Column>
                    <Column align="center" style={imageColumn}>
                      <Img src={`${baseUrl}/event/chat.jpg`} style={imageStyle} alt="Guests chatting" />
                    </Column>
                  </Row>
                </Section>

                <Button style={button} href={whatsAppLink}>
                  Connect on WhatsApp
                </Button>
              </Column>
            </Row>
          </Section>

          <Text
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: 'rgb(0,0,0, 0.7)',
              marginTop: '20px'
            }}
          >
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

export default WaterBarMissedYouEmail;

const main = {
  backgroundColor: '#fff0f5',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const paragraph = {
  fontSize: 16,
  textAlign: 'center' as const,
};

const logo = {
  padding: '30px 20px',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#D94A8C',
  borderRadius: 3,
  color: '#FFF',
  fontWeight: 'bold',
  border: '1px solid rgb(0,0,0, 0.1)',
  cursor: 'pointer',
  display: 'inline-block',
  padding: '12px 30px',
  textDecoration: 'none',
};

const content = {
  border: '1px solid rgb(0,0,0, 0.1)',
  borderRadius: '3px',
  overflow: 'hidden',
  padding: '20px'
};

const imageColumn = {
  padding: '0 5px',
};

const imageStyle = {
  width: '100%',
  borderRadius: '8px',
};

const unsubscribeLinkStyle = {
  color: '#999',
  textDecoration: 'underline',
};
