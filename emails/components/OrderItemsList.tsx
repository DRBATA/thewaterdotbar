import { Section, Text, Img, Hr } from '@react-email/components';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface OrderItemsListProps {
  items: OrderItem[];
  total: number;
  primaryColor: string;
}

export function OrderItemsList({ items, total, primaryColor }: OrderItemsListProps) {
  return (
    <>
      {items.map((item, index) => (
        <Section key={index} style={orderItemStyle}>
          <table width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              {item.image_url && (
                <td width="80" valign="top">
                  <Img
                    src={item.image_url}
                    width="64"
                    height="64"
                    alt={item.name}
                    style={{ borderRadius: '8px' }}
                  />
                </td>
              )}
              <td valign="top">
                <Text style={itemName}>{item.name}</Text>
                <Text style={itemDetails}>
                  Qty: {item.quantity} × AED {item.price.toFixed(2)}
                </Text>
              </td>
              <td width="100" align="right" valign="top">
                <Text style={itemPrice}>AED {(item.quantity * item.price).toFixed(2)}</Text>
              </td>
            </tr>
          </table>
        </Section>
      ))}
      
      <Hr style={hr} />
      
      <Section style={totalSection}>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td>
              <Text style={totalLabel}>Total:</Text>
            </td>
            <td align="right">
              <Text style={{ ...totalAmount, color: primaryColor }}>AED {total.toFixed(2)}</Text>
            </td>
          </tr>
        </table>
      </Section>
    </>
  );
}

const orderItemStyle = {
  borderBottom: '1px solid #E5E7EB',
  padding: '16px 0',
};

const itemName = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#333333',
  margin: '0 0 4px',
};

const itemDetails = {
  fontSize: '14px',
  color: '#666666',
  margin: '0',
};

const itemPrice = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#333333',
  margin: '0',
};

const hr = {
  borderColor: '#E5E7EB',
  margin: '16px 0',
};

const totalSection = {
  padding: '16px 0',
};

const totalLabel = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#333333',
  margin: '0',
};

const totalAmount = {
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
};
