import { calculators } from '@/lib/calculators';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import FavoriteButton from '@/components/favorite-button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

type CalculatorPageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  return calculators.map((calculator) => ({
    slug: calculator.slug,
  }));
}

export async function generateMetadata({ params }: CalculatorPageProps) {
  const calculator = calculators.find((c) => c.slug === params.slug);
  if (!calculator) {
    return {
      title: 'Calculator Not Found',
    };
  }
  return {
    title: `${calculator.name} | top100calculators`,
    description: calculator.description,
  };
}

export default function CalculatorPage({ params }: CalculatorPageProps) {
  const calculator = calculators.find((c) => c.slug === params.slug);

  if (!calculator) {
    notFound();
  }
  
  const Icon = calculator.icon;

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to all calculators
        </Link>
        
        <Card>
            <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{calculator.category}</Badge>
                  </div>
                  <CardTitle className="font-headline text-3xl md:text-4xl">{calculator.name}</CardTitle>
                  <CardDescription className="mt-2 text-lg">{calculator.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <FavoriteButton slug={calculator.slug} />
                  <Button variant="outline" size="icon" aria-label="Share">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
            </div>
            </CardHeader>
            <CardContent>
              {/* Main calculator UI */}
              <div className="mt-6 border rounded-lg p-4 md:p-6">
                  <div className="grid md:grid-cols-2 gap-8">
                      {/* Inputs */}
                      <div className="space-y-4">
                          <h3 className="text-xl font-semibold">Inputs</h3>
                          <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                            <p className="text-sm text-muted-foreground">Input fields coming soon</p>
                          </div>
                      </div>
                      {/* Results */}
                      <div className="space-y-4">
                          <h3 className="text-xl font-semibold">Results</h3>
                           <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                            <p className="text-sm text-muted-foreground">Results display coming soon</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Accordion for additional details */}
              <div className="mt-8">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="how-it-works">
                    <AccordionTrigger>How It Works</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">
                        Detailed explanation of the formulas and variables used in the calculation will be provided here.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="assumptions">
                    <AccordionTrigger>Assumptions & Limitations</AccordionTrigger>
                    <AccordionContent>
                       <p className="text-muted-foreground">
                        Any assumptions or limitations of this calculator will be clearly listed here.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="examples">
                    <AccordionTrigger>Examples</AccordionTrigger>
                    <AccordionContent>
                       <p className="text-muted-foreground">
                        Practical examples demonstrating how to use the calculator will be shown here.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="faq">
                    <AccordionTrigger>FAQs</AccordionTrigger>
                    <AccordionContent>
                       <p className="text-muted-foreground">
                        Frequently asked questions related to this calculator will be answered here.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

            </CardContent>
            <CardFooter className="text-xs text-muted-foreground justify-end">
              <p>Last Updated: {new Date().toISOString().split('T')[0]} | Formula v1.0</p>
            </CardFooter>
        </Card>
    </div>
  );
}
