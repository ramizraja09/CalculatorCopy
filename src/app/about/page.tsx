import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl md:text-4xl">About My Genius Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Welcome to My Genius Calculator, your go-to source for a wide array of free, user-friendly online calculators. Our mission is to provide clean, fast, and accessible tools for everyone, covering everything from finance and health to math and everyday life.
          </p>
          <h2 className="text-2xl font-headline text-foreground pt-4">Our Methodology</h2>
          <p>
            Each calculator on our site is built with a focus on accuracy, simplicity, and transparency. We adhere to the following principles:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Standard Formulas:</strong> We use industry-standard, widely-accepted formulas and equations to ensure our calculations are reliable and consistent with what you'd find on other reputable resources.</li>
            <li><strong>Clear Explanations:</strong> We believe you should understand how the results are calculated. Every calculator includes a "How it Works" section that breaks down the formulas and the variables used.</li>
            <li><strong>Versioning:</strong> To maintain transparency, each calculator page displays a formula version number and a "Last Updated" date. Any significant changes to our formulas or assumptions are documented.</li>
            <li><strong>Data-Driven Selection:</strong> The calculators were chosen based on extensive research into the most commonly searched and used online calculation tools.</li>
          </ul>

           <h2 className="text-2xl font-headline text-foreground pt-4">Sources</h2>
           <p>
            Where applicable, we base our calculators on data and standards from reputable organizations. For financial calculators, we rely on standard economic formulas. For health and fitness tools, we often refer to guidelines from institutions like the World Health Organization (WHO) and widely-accepted research such as the Mifflin-St Jeor equation for BMR calculation.
           </p>

           <h2 className="text-2xl font-headline text-foreground pt-4">Commitment to Quality</h2>
            <p>
                We are committed to providing a high-quality experience. This includes a distraction-free interface, strong accessibility compliance (WCAG 2.2 AA), and excellent performance across all devices.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
