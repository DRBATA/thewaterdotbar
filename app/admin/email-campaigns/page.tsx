'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface CampaignResult {
  success?: boolean;
  total?: number;
  sent?: number;
  failed?: number;
  error?: string;
}

export default function EmailCampaignsPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [testEmail, setTestEmail] = useState<string>('');

  const sendCampaign = async (audience: 'attendees' | 'no-shows', testMode: boolean = false) => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/email/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          audience, 
          testMode,
          testEmail: testMode ? testEmail : undefined // Only send test email when in test mode
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails');
      }
      
      setResult({
        success: true,
        total: data.total,
        sent: data.sent,
        failed: data.failed,
      });
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      setResult({
        success: false,
        error: error.message || 'An unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Email Campaigns</h1>
      
      <div className="mb-6 p-4 border rounded-md bg-gray-50">
        <h2 className="text-lg font-medium mb-2">Test Configuration</h2>
        <div className="flex items-center gap-4">
          <div className="flex-grow">
            <Input
              type="email"
              placeholder="Your test email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="text-sm text-gray-500">
            Using a test email will override database recipients
          </div>
        </div>
      </div>
      
      {result && (
        <Alert className={`mb-6 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertTitle>
            {result.success ? 'Campaign Sent Successfully' : 'Campaign Failed'}
          </AlertTitle>
          <AlertDescription>
            {result.success ? (
              <>
                Sent {result.sent || 0} emails successfully out of {result.total || 0} recipients.
                {(result.failed || 0) > 0 && ` (${result.failed} failed)`}
              </>
            ) : (
              result.error
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="attendees">
        <TabsList className="mb-6">
          <TabsTrigger value="attendees">Attendees Campaign</TabsTrigger>
          <TabsTrigger value="no-shows">No-Shows Campaign</TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendees">
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Campaign</CardTitle>
              <CardDescription>
                Send a thank you email to all attendees who claimed their tickets at the event.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                This will send the &quot;Thank You&quot; email to all users who have claimed their tickets
                (order items with claimed_at not null). The email includes details about the next event on July 6th.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => sendCampaign('attendees', true)}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Test (3 recipients)
              </Button>
              <Button 
                onClick={() => sendCampaign('attendees')}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send to All Attendees
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="no-shows">
          <Card>
            <CardHeader>
              <CardTitle>Missed You Campaign</CardTitle>
              <CardDescription>
                Send a &quot;We missed you&quot; email to customers who purchased but didn&apos;t attend.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                This will send the &quot;We Missed You&quot; email to all users who purchased tickets but
                did not claim them (order items with claimed_at null). The email includes details about 
                the next event on July 6th.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => sendCampaign('no-shows', true)}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Test (3 recipients)
              </Button>
              <Button 
                onClick={() => sendCampaign('no-shows')}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send to All No-Shows
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
