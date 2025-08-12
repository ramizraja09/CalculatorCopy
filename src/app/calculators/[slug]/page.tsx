
import { calculators } from '@/lib/calculators';
import { notFound } from 'next/navigation';
import CalculatorClientPage from './calculator-client-page';
import type { Metadata } from 'next';
import Script from 'next/script';

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

export async function generateMetadata({ params }: CalculatorPageProps): Promise<Metadata> {
  const calculator = calculators.find((c) => c.slug === params.slug);
  if (!calculator) {
    return {
      title: 'Calculator Not Found',
    };
  }
  return {
    title: `${calculator.name} — Free Online ${calculator.category} Calculator | My Genius Calculator`,
    description: calculator.description,
  };
}

export default function CalculatorPage({ params }: CalculatorPageProps) {
  const calculator = calculators.find((c) => c.slug === params.slug);

  if (!calculator) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { icon, ...calculatorData } = calculator;

  const getJsonLd = () => {
    const url = `https://my-genius-calculator.web.app/calculators/${calculator.slug}`;
    const baseSchema = {
      "@context": "https://schema.org",
      "name": calculator.name,
      "description": calculator.description,
      "url": url,
      "operatingSystem": "All",
      "applicationCategory": "Utilities",
    };

    if (calculator.category === 'Math') {
      return {
        ...baseSchema,
        "@type": "MathSolver",
        "mathExpression": "f(x)" // Generic placeholder
      };
    }

    return {
      ...baseSchema,
      "@type": "WebApplication",
    };
  }

  return (
    <>
      <Script
        id="calculator-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getJsonLd()) }}
      />
      <CalculatorClientPage calculator={calculatorData} />
    </>
  );
}
