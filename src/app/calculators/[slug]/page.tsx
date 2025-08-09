import { calculators } from '@/lib/calculators';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import FavoriteButton from '@/components/favorite-button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
    title: `${calculator.name} | CalcHub`,
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
        <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
            <div className="flex justify-between items-start">
                <div>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{calculator.category}</Badge>
                </div>
                <CardTitle className="font-headline text-3xl md:text-4xl">{calculator.name}</CardTitle>
                <CardDescription className="mt-2 text-lg">{calculator.description}</CardDescription>
                </div>
                <FavoriteButton slug={calculator.slug} />
            </div>
            </CardHeader>
            <CardContent>
            <div className="mt-6 border-t pt-6">
                <div className="flex items-center justify-center h-80 bg-muted/50 rounded-lg border border-dashed">
                    <div className="text-center text-muted-foreground">
                        {Icon && <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />}
                        <p className="font-medium text-lg">[ {calculator.name} ]</p>
                        <p className="text-sm">Functionality coming soon!</p>
                    </div>
                </div>
            </div>
            </CardContent>
        </Card>
    </div>
  );
}
