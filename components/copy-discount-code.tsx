import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

interface CopyDiscountCodeProps {
  tier: {
    code: string;
  } | null;
}

export function CopyDiscountCode({ tier }: CopyDiscountCodeProps) {
  const [copied, setCopied] = useState(false);

  if (!tier) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(tier.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <Button
      variant="outline"
      className="w-full mt-4 border-lime-400 text-lime-300 hover:bg-lime-400/20 hover:text-lime-200"
      onClick={handleCopy}
      data-copy-discount-trigger
    >
      {copied ? (
        <><Check className="mr-2 h-4 w-4" /> COPIED!</>
      ) : (
        <><Copy className="mr-2 h-4 w-4" /> COPY DISCOUNT CODE</>
      )}
    </Button>
  );
}
