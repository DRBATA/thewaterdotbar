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

interface WaterBarFollowupEmailProps {
  userEmail?: string;
  userFirstName?: string;
  whatsAppLink?: string;
}

const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://thewater.bar'
  : 'http://localhost:3000';

export const WaterBarFollowupEmail = ({
  userEmail = 'guest@example.com',
  userFirstName = 'Guest',
  whatsAppLink = 'https://api.whatsapp.com/send?phone=442081336235&text=Hi%20Water%20Bar!%20I%27d%20love%20to%20share%20some%20feedback%20about%20the%20event.',
}: WaterBarFollowupEmailProps) => {
  const unsubscribeLink = `${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`;
  return (
    <Html>
      <Head />
      <Preview>A message from The Water Bar</Preview>
      <Body style={main}>
        <Container>
          <Section style={logo}>
            <Img src={`${baseUrl}/drinks/logo.png`} width="150" alt="The Water Bar Logo" />
          </Section>

          <Section style={content}>
            <Row>
              <Img
                src={`${baseUrl}/drinks/insta3.png`}
                width="600"
                height="400"
                alt="Choose Your Champion - Kyoto Kooler vs The Alchemist"
                className="mx-auto rounded-t-lg"
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
                  Hi {userFirstName},
                </Heading>
                <Heading
                  as="h2"
                  style={{
                    fontSize: 26,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  Thank you for being part of our event!
                </Heading>

                <Text style={paragraph}>
                  We hope you had an amazing time at The Morning Party x Johny Dar Experience. Your presence made it special and we'd love to stay in touch.
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  P.S. We've just launched two new champion mocktails: the serene <strong>Kyoto Kooler</strong> (a sparkling matcha fusion) and the energizing <strong>The Alchemist</strong> (a zesty cold-brew creation). Come find your new favorite!
                </Text>
                <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
                  <Button
                    pX={20}
                    pY={12}
                    style={{ backgroundColor: '#5E6AD2', color: 'white', borderRadius: '4px', marginRight: '10px', textDecoration: 'none', display: 'inline-block' }}
                    href={`https://thewater.bar/concierge?utm_campaign=thankyou-attendee`}
                  >
                    Chat with our Wellness Concierge
                  </Button>
                  <Button
                    pX={20}
                    pY={12}
                    style={{ backgroundColor: '#0095ff', color: 'white', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}
                    href={`https://thewater.bar/menu?utm_campaign=thankyou-attendee`}
                  >
                    Get the Triple Threat Pass (Entry+Mocktail+Experience) (135 DHS)
                  </Button>
                </Section>
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
              <Row style={{ marginTop: '10px' }}>
                <Column align="center" style={imageColumn}>
                  <Img src={`${baseUrl}/event/dj2.jpg`} style={imageStyle} alt="DJ at the event" />
                </Column>
                <Column align="center" style={imageColumn}>
                  <Img src={`${baseUrl}/event/chaga.jpg`} style={imageStyle} alt="Guest enjoying a drink" />
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

export default WaterBarFollowupEmail;

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
