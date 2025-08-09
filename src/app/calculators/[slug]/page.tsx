import { calculators } from '@/lib/calculators';
import { notFound } from 'next/navigation';
import CalculatorClientPage from './calculator-client-page';
import type { Metadata } from 'next';

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
    title: `${calculator.name} — Free Online ${calculator.category} Calculator | top100calculators`,
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

  return <CalculatorClientPage calculator={calculatorData} />;
}
