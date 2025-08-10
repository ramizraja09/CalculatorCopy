
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

export default function PrivacyPage() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    // This now runs only on the client, after hydration
    setLastUpdated(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl md:text-4xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p><strong>Last Updated:</strong> {lastUpdated || 'Loading...'}</p>

          <p>
            Your privacy is important to us. It is My Genius Calculator's policy to respect your privacy regarding any information we may collect from you across our website.
          </p>

          <h2 className="text-2xl font-headline text-foreground pt-4">Information We Collect</h2>
          <p>
            Our calculators operate entirely on the client-side within your browser. We do not collect, store, or transmit any personal data or financial information that you enter into the calculators.
          </p>
          <p>
            The "Show Favorites" feature uses your browser's local storage to remember which calculators you have favorited. This information is stored only on your device and is not accessible by us.
          </p>
          
          <h2 className="text-2xl font-headline text-foreground pt-4">Analytics</h2>
          <p>
            We may use privacy-respecting analytics services (such as Plausible or Fathom) to understand website traffic and usage. These services do not use cookies and do not collect any personal data. They help us understand which calculators are popular and how we can improve the site, without compromising your privacy.
          </p>

          <h2 className="text-2xl font-headline text-foreground pt-4">Third-Party Services</h2>
          <p>
            Our website may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.
          </p>

          <h2 className="text-2xl font-headline text-foreground pt-4">Changes to This Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
          </p>
          
          <h2 className="text-2xl font-headline text-foreground pt-4">Contact Us</h2>
           <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@mygeniuscalculator.com" className="text-primary hover:underline">privacy@mygeniuscalculator.com</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
