'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';


interface SendResult {
  success?: boolean;
  total?: number;
  sent?: number;
  failed?: number;
  error?: string;
}

export default function ManualSendPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [recipientList, setRecipientList] = useState<string>('');

  const handleSend = async () => {
    setIsLoading(true);
    setResult(null);

    const emails = recipientList.split(/[,\n\s]+/).filter(email => email.trim() !== '');
    if (emails.length === 0) {
      setResult({ success: false, error: 'Recipient list is empty.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/email/bulk-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience: 'no-shows', // This determines the template
          manualRecipients: emails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails');
      }

      setResult({ ...data, success: true });
    } catch (error: any) {
      setResult({ success: false, error: error.message || 'An unknown error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manual Email Send</h1>
          <p className="text-gray-500 mb-6">Send the "We Missed You" email to a specific list of recipients.</p>

          <div className="mb-4">
            <label htmlFor="recipients" className="block text-sm font-medium text-gray-700 mb-2">
              Paste Recipient Emails
            </label>
            <Textarea
              id="recipients"
              placeholder="Paste emails here, separated by commas, spaces, or new lines."
              rows={10}
              value={recipientList}
              onChange={(e) => setRecipientList(e.target.value)}
              className="w-full bg-white"
            />
          </div>

          <Button onClick={handleSend} disabled={isLoading || !recipientList.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send to {recipientList.split(/[,\n\s]+/).filter(e => e.trim()).length} Recipients
          </Button>

          {result && (
            <Alert className={`mt-6 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {result.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
              <AlertTitle>{result.success ? 'Campaign Sent' : 'Campaign Failed'}</AlertTitle>
              <AlertDescription>
                {result.success ? `Sent: ${result.sent}, Failed: ${result.failed}` : result.error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Live Email Preview</h2>
          <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
            <iframe
              src="/api/email/preview?template=missed-you"
              className="w-full h-[700px] border-0"
              title="Email Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
