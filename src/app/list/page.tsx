import { calculators, calculatorCategories } from '@/lib/calculators';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Full List of Calculators | My Genius Calculator',
    description: 'A complete, categorized list of all 167 free online calculators available on My Genius Calculator for finance, health, math, and more.',
};

export default function ListPage() {
    const groupedCalculators = calculatorCategories.map(category => ({
        name: category,
        calculators: calculators.filter(c => c.category === category)
    }));

    return (
        <div className="container max-w-5xl mx-auto p-4 md:p-8">
            <div className="space-y-2 mb-8">
                <h1 className="text-4xl font-bold font-headline text-foreground">Full Calculator List</h1>
                <p className="text-lg text-muted-foreground">
                    Browse all {calculators.length} calculators available on the site, organized by category.
                </p>
            </div>

            <div className="space-y-8">
                {groupedCalculators.map(group => (
                    <Card key={group.name}>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">{group.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                                {group.calculators.map(calculator => (
                                    <li key={calculator.slug}>
                                        <Link href={`/calculators/${calculator.slug}`} className="text-primary hover:underline underline-offset-4 decoration-dotted">
                                            {calculator.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
