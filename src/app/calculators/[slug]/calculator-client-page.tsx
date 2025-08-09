

"use client";

import { useState, useEffect, Suspense } from 'react';
import type { Calculator } from '@/lib/calculators';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import FavoriteButton from '@/components/favorite-button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import MortgageCalculator from '@/components/calculators/mortgage-calculator';
import LoanCalculator from '@/components/calculators/loan-calculator';
import CarLoanCalculator from '@/components/calculators/car-loan-calculator';
import AmortizationCalculator from '@/components/calculators/amortization-calculator';
import InterestCalculator from '@/components/calculators/interest-calculator';
import CompoundInterestCalculator from '@/components/calculators/compound-interest-calculator';
import InvestmentReturnCalculator from '@/components/calculators/investment-return-calculator';
import TipCalculator from '@/components/calculators/tip-calculator';
import FuelCostCalculator from '@/components/calculators/fuel-cost-calculator';
import GpaCalculator from '@/components/calculators/gpa-calculator';
import ConcreteCalculator from '@/components/calculators/concrete-calculator';
import PaintCalculator from '@/components/calculators/paint-calculator';
import PlantSpacingCalculator from '@/components/calculators/plant-spacing-calculator';
import SunAngleCalculator from '@/components/calculators/sun-angle-calculator';
import TravelTimeCalculator from '@/components/calculators/travel-time-calculator';
import DistanceCalculator from '@/components/calculators/distance-calculator';
import CostOfLivingCalculator from '@/components/calculators/cost-of-living-calculator';
import RetirementSavingsCalculator from '@/components/calculators/retirement-savings-calculator';
import InflationCalculator from '@/components/calculators/inflation-calculator';
import IncomeTaxCalculator from '@/components/calculators/income-tax-calculator';
import SalaryCalculator from '@/components/calculators/salary-calculator';
import SalesTaxCalculator from '@/components/calculators/sales-tax-calculator';
import CreditCardPayoffCalculator from '@/components/calculators/credit-card-payoff-calculator';
import DebtSnowballCalculator from '@/components/calculators/debt-snowball-calculator';
import RefinanceCalculator from '@/components/calculators/refinance-calculator';
import AprApyCalculator from '@/components/calculators/apr-apy-calculator';
import RoiCalculator from '@/components/calculators/roi-calculator';
import TvmCalculator from '@/components/calculators/tvm-calculator';
import SavingsGoalCalculator from '@/components/calculators/savings-goal-calculator';
import InvestmentCalculator from '@/components/calculators/investment-calculator';
import Four01kCalculator from '@/components/calculators/401k-calculator';
import BudgetCalculator from '@/components/calculators/budget-calculator';
import LeaseCalculator from '@/components/calculators/lease-calculator';
import CurrencyConverter from '@/components/calculators/currency-converter';
import PaycheckCalculator from '@/components/calculators/paycheck-calculator';
import NetWorthCalculator from '@/components/calculators/net-worth-calculator';
import EmergencyFundCalculator from '@/components/calculators/emergency-fund-calculator';
import CollegeSavingsCalculator from '@/components/calculators/college-savings-calculator';
import HomeAffordabilityCalculator from '@/components/calculators/home-affordability-calculator';
import DiscountCalculator from '@/components/calculators/discount-calculator';

type CalculatorClientPageProps = {
  calculator: Omit<Calculator, 'icon'>;
};

const calculatorComponents: { [key: string]: React.ComponentType<any> } = {
  'mortgage-calculator': MortgageCalculator,
  'loan-calculator': LoanCalculator,
  'car-loan-calculator': CarLoanCalculator,
  'amortization-calculator': AmortizationCalculator,
  'interest-calculator': InterestCalculator,
  'compound-interest-calculator': CompoundInterestCalculator,
  'investment-return-calculator': InvestmentReturnCalculator,
  'tip-calculator': TipCalculator,
  'fuel-cost-calculator': FuelCostCalculator,
  'gpa-calculator': GpaCalculator,
  'concrete-calculator': ConcreteCalculator,
  'paint-calculator': PaintCalculator,
  'plant-spacing-calculator': PlantSpacingCalculator,
  'sun-angle-calculator': SunAngleCalculator,
  'travel-time-calculator': TravelTimeCalculator,
  'distance-calculator': DistanceCalculator,
  'cost-of-living-calculator': CostOfLivingCalculator,
  'retirement-savings-calculator': RetirementSavingsCalculator,
  'inflation-calculator': InflationCalculator,
  'income-tax-calculator': IncomeTaxCalculator,
  'salary-calculator': SalaryCalculator,
  'sales-tax-calculator': SalesTaxCalculator,
  'credit-card-payoff-calculator': CreditCardPayoffCalculator,
  'debt-snowball-calculator': DebtSnowballCalculator,
  'refinance-calculator': RefinanceCalculator,
  'apr-apy-calculator': AprApyCalculator,
  'roi-calculator': RoiCalculator,
  'tvm-calculator': TvmCalculator,
  'savings-goal-calculator': SavingsGoalCalculator,
  'investment-calculator': InvestmentCalculator,
  '401k-calculator': Four01kCalculator,
  'budget-calculator': BudgetCalculator,
  'lease-calculator': LeaseCalculator,
  'currency-converter': CurrencyConverter,
  'paycheck-calculator': PaycheckCalculator,
  'net-worth-calculator': NetWorthCalculator,
  'emergency-fund-calculator': EmergencyFundCalculator,
  'college-savings-calculator': CollegeSavingsCalculator,
  'home-affordability-calculator': HomeAffordabilityCalculator,
  'discount-calculator': DiscountCalculator,
};

const PageSkeleton = ({ calculator }: { calculator: Omit<Calculator, 'icon'> }) => (
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
                <div className="mt-6 border rounded-lg p-4 md:p-6">
                    <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">Loading Calculator...</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground justify-end">
              <p>Loading...</p>
            </CardFooter>
        </Card>
    </div>
);


function CalculatorPageContent({ calculator }: CalculatorClientPageProps) {
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    setLastUpdated(new Date().toISOString().split('T')[0]);
  }, []);
  
  const CalculatorComponent = calculatorComponents[calculator.slug];
  
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
                  {CalculatorComponent ? <CalculatorComponent /> : (
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
                  )}
              </div>

              {/* Accordion for additional details */}
              <div className="mt-8">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="purpose">
                    <AccordionTrigger>The Tool's Purpose</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-muted-foreground">
                        <p>
                          The primary purpose of the <strong>{calculator.name}</strong> is to empower users to make informed decisions by providing clear, accurate, and instant calculations. This tool is designed to demystify complex formulas and provide a transparent look into the numbers that affect your life, whether you're planning your finances, managing your health, or working on a home project.
                        </p>
                        <p>
                          Instead of relying on guesswork or performing tedious manual calculations, you can use this calculator to quickly explore different scenarios, understand the impact of various inputs, and gain the confidence to move forward with your plans. Our goal is to make this calculation accessible to everyone, regardless of their background in math or finance.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="who-should-use">
                    <AccordionTrigger>Who Should Use It / What Scenarios It Fits</AccordionTrigger>
                    <AccordionContent>
                       <div className="space-y-4 text-muted-foreground">
                          <p>This calculator is ideal for:</p>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Individuals planning major life events:</strong> Whether you're a prospective homebuyer trying to understand mortgage payments, a student estimating loan repayments, or a future parent planning for college savings, this tool provides the clarity you need.</li>
                            <li><strong>Financial planners and advisors:</strong> Quickly run numbers for clients and illustrate the long-term impact of different financial strategies.</li>
                            <li><strong>Students and educators:</strong> A great educational resource for understanding the real-world application of mathematical and financial concepts in a practical, hands-on way.</li>
                            <li><strong>Anyone seeking quick financial answers:</strong> If you're comparing loan offers, considering a refinance, or simply curious about how interest rates work, this calculator provides instant, reliable answers without any commitment.</li>
                          </ul>
                          <p>It is particularly useful in scenarios like comparing different loan options from banks, budgeting for a new home, or planning a long-term investment strategy.
                          </p>
                       </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="inputs-results">
                    <AccordionTrigger>Summary of Inputs and Results</AccordionTrigger>
                    <AccordionContent>
                       <div className="space-y-4 text-muted-foreground">
                        <p>To get the most out of this tool, you will need to provide a few key pieces of information. The results are then calculated instantly based on your entries.</p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">Key Inputs:</h4>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li><strong>Principal Amount:</strong> The total amount of money you are borrowing or investing.</li>
                                    <li><strong>Interest Rate:</strong> The annual interest rate for the loan or investment.</li>
                                    <li><strong>Term Length:</strong> The duration over which the loan will be repaid or the investment will grow, typically in years or months.</li>
                                    <li><strong>Additional Costs (if applicable):</strong> For calculators like the mortgage tool, this may include property taxes, insurance, and HOA fees.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">Key Outputs:</h4>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li><strong>Scheduled Payment:</strong> The fixed amount you will need to pay on a regular basis (e.g., monthly).</li>
                                    <li><strong>Total Interest Paid:</strong> The cumulative amount of interest you will pay over the full term of the loan.</li>
                                    <li><strong>Total Amount Paid:</strong> The sum of the principal and all interest paid over the life of the loan.</li>
                                    <li><strong>Amortization Schedule:</strong> A detailed, period-by-period breakdown of how each payment is allocated between principal and interest.</li>
                                </ul>
                            </div>
                        </div>
                       </div>
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="context">
                    <AccordionTrigger>Additional Context or Detailed Info</AccordionTrigger>
                    <AccordionContent>
                       <div className="space-y-2 text-muted-foreground">
                        <p>
                          The calculations performed by this tool are based on standard, industry-accepted formulas. For example, loan and mortgage payments are typically calculated using the standard amortization formula, which ensures that payments are equal over the life of the loan.
                        </p>
                        <p>
                          It's important to remember that this calculator provides estimates for planning purposes. The results do not constitute financial advice. The actual figures from a financial institution may vary slightly due to factors like specific lender fees, exact closing dates, or different compounding frequencies. Always consult with a qualified financial professional before making any financial decisions. Our commitment is to transparency, and all formulas used are based on established financial principles.
                        </p>
                       </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

            </CardContent>
            <CardFooter className="text-xs text-muted-foreground justify-end">
              {lastUpdated ? <p>Last Updated: {lastUpdated} | Formula v1.0</p> : <p>Loading...</p>}
            </CardFooter>
        </Card>
    </div>
  );
}

export default function CalculatorClientPage({ calculator }: CalculatorClientPageProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <CalculatorPageContent calculator={calculator} /> : <PageSkeleton calculator={calculator} />;
}
