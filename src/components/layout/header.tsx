import { Calculator } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { calculatorCategories } from '@/lib/calculators';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <Calculator className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-bold text-foreground">top100calculators</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 text-sm">
            <Button variant="link" asChild className="text-muted-foreground hover:text-primary px-0">
                <Link href="/calculators">All Calculators</Link>
            </Button>
            {calculatorCategories.map((category) => (
               <Button variant="link" asChild key={category} className="text-muted-foreground hover:text-primary px-0">
                    <Link href={`/calculators?category=${encodeURIComponent(category)}`}>{category}</Link>
                </Button>
            ))}
        </nav>
      </div>
    </header>
  );
}
