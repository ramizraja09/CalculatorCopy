import { Calculator } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { calculatorCategories } from '@/lib/calculators';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from 'lucide-react';


export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2 mr-6">
            <Calculator className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl font-bold text-foreground">My Genius Calculator</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 text-sm font-medium">
              <Link href="/calculators" className="text-muted-foreground transition-colors hover:text-foreground">
                  All Calculators
              </Link>
              {calculatorCategories.map((category) => (
                  <Link href={`/calculators?category=${encodeURIComponent(category)}`} key={category} className="text-muted-foreground transition-colors hover:text-foreground">
                      {category}
                  </Link>
              ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="sr-only">Main Menu</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <SheetClose asChild>
                  <Link
                    href="/calculators"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    All Calculators
                  </Link>
                </SheetClose>
                 {calculatorCategories.map((category) => (
                    <SheetClose asChild key={category}>
                      <Link
                        href={`/calculators?category=${encodeURIComponent(category)}`}
                        className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {category}
                      </Link>
                    </SheetClose>
                  ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
