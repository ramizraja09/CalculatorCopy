import { Calculator, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { calculatorCategories } from '@/lib/calculators';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <Calculator className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-bold text-foreground">top100calculators</span>
        </Link>
        <nav className="flex items-center space-x-6">
            <Button variant="link" asChild className="text-muted-foreground hover:text-primary px-0">
                <Link href="/calculators">All Calculators</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="link" className="text-muted-foreground hover:text-primary px-0">
                  Categories
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {calculatorCategories.map((category) => (
                  <DropdownMenuItem key={category} asChild>
                    <Link href={`/calculators?category=${encodeURIComponent(category)}`}>{category}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
