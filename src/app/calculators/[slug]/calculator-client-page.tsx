
"use client";

import { useState, useEffect, useRef } from 'react';
import type { Calculator } from '@/lib/calculators';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import FavoriteButton from '@/components/favorite-button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Copy } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"
import BmiWeightLossCalculator from '@/components/calculators/bmi-weight-loss-calculator';
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
import BmiCalculator from '@/components/calculators/bmi-calculator';
import CalorieCalculator from '@/components/calculators/calorie-calculator';
import PaceCalculator from '@/components/calculators/pace-calculator';
import BmrCalculator from '@/components/calculators/bmr-calculator';
import BodyFatCalculator from '@/components/calculators/body-fat-calculator';
import IdealWeightCalculator from '@/components/calculators/ideal-weight-calculator';
import TdeeCalculator from '@/components/calculators/tdee-calculator';
import MacroCalculator from '@/components/calculators/macro-calculator';
import OneRepMaxCalculator from '@/components/calculators/one-rep-max-calculator';
import PregnancyDueDateCalculator from '@/components/calculators/pregnancy-due-date-calculator';
import OvulationCalculator from '@/components/calculators/ovulation-calculator';
import BacCalculator from '@/components/calculators/bac-calculator';
import SmokingCostCalculator from '@/components/calculators/smoking-cost-calculator';
import WaterIntakeCalculator from '@/components/calculators/water-intake-calculator';
import HeartRateZoneCalculator from '@/components/calculators/heart-rate-zone-calculator';
import RunningTimePredictor from '@/components/calculators/running-time-predictor';
import WilksScoreCalculator from '@/components/calculators/wilks-score-calculator';
import ApftCalculator from '@/components/calculators/apft-calculator';
import BsaCalculator from '@/components/calculators/bsa-calculator';
import ChildHeightPredictor from '@/components/calculators/child-height-predictor';
import BasicCalculator from '@/components/calculators/basic-calculator';
import PercentageCalculator from '@/components/calculators/percentage-calculator';
import FractionCalculator from '@/components/calculators/fraction-calculator';
import ScientificCalculator from '@/components/calculators/scientific-calculator';
import RandomNumberGenerator from '@/components/calculators/random-number-generator';
import StandardDeviationCalculator from '@/components/calculators/standard-deviation-calculator';
import AreaCalculator from '@/components/calculators/area-calculator';
import VolumeCalculator from '@/components/calculators/volume-calculator';
import PrimeNumberCalculator from '@/components/calculators/prime-number-calculator';
import GcdCalculator from '@/components/calculators/gcd-calculator';
import LcmCalculator from '@/components/calculators/lcm-calculator';
import LogarithmCalculator from '@/components/calculators/logarithm-calculator';
import PythagoreanTheoremCalculator from '@/components/calculators/pythagorean-theorem-calculator';
import QuadraticEquationSolver from '@/components/calculators/quadratic-equation-solver';
import FactorialCalculator from '@/components/calculators/factorial-calculator';
import MatrixCalculator from '@/components/calculators/matrix-calculator';
import MeanMedianModeCalculator from '@/components/calculators/mean-median-mode-calculator';
import NumberSequenceCalculator from '@/components/calculators/number-sequence-calculator';
import RootCalculator from '@/components/calculators/root-calculator';
import CombinationsPermutationsCalculator from '@/components/calculators/combinations-permutations-calculator';
import AgeCalculator from '@/components/calculators/age-calculator';
import DateDifferenceCalculator from '@/components/calculators/date-difference-calculator';
import TimeCalculator from '@/components/calculators/time-calculator';
import BirthdayCalculator from '@/components/calculators/birthday-calculator';
import DateToDayCalculator from '@/components/calculators/date-to-day-calculator';
import WorkingDaysCalculator from '@/components/calculators/working-days-calculator';
import TimeDurationCalculator from '@/components/calculators/time-duration-calculator';
import CountdownTimer from '@/components/calculators/countdown-timer';
import StopwatchCalculator from '@/components/calculators/stopwatch-calculator';
import TimeCardCalculator from '@/components/calculators/time-card-calculator';
import SalaryNegotiationCalculator from '@/components/calculators/salary-negotiation-calculator';
import JobOfferComparisonCalculator from '@/components/calculators/job-offer-comparison-calculator';
import FreelanceRateCalculator from '@/components/calculators/freelance-rate-calculator';
import WallpaperCalculator from '@/components/calculators/wallpaper-calculator';
import DilutionCalculator from '@/components/calculators/dilution-calculator';
import OhmsLawCalculator from '@/components/calculators/ohms-law-calculator';
import Vo2MaxEstimator from '@/components/calculators/vo2-max-estimator';
import FfmiCalculator from '@/components/calculators/ffmi-calculator';
import SleepCalculator from '@/components/calculators/sleep-calculator';
import HydrationCalculator from '@/components/calculators/hydration-calculator';
import HealthyWeightGainCalculator from '@/components/calculators/healthy-weight-gain-calculator';
import CardiovascularRiskCalculator from '@/components/calculators/cardiovascular-risk-calculator';
import MarinePftCalculator from '@/components/calculators/marine-pft-calculator';
import NavyPrtCalculator from '@/components/calculators/navy-prt-calculator';
import GraphingCalculator from '@/components/calculators/graphing-calculator';
import DerivativeCalculator from '@/components/calculators/derivative-calculator';
import IntegralCalculator from '@/components/calculators/integral-calculator';
import LimitsCalculator from '@/components/calculators/limits-calculator';
import EquationSolver from '@/components/calculators/equation-solver';
import RatioCalculator from '@/components/calculators/ratio-calculator';
import UnitConverter from '@/components/calculators/unit-converter';
import SigFigCalculator from '@/components/calculators/sig-fig-calculator';
import DataStorageConverter from '@/components/calculators/data-storage-converter';
import DataTransferSpeedConverter from '@/components/calculators/data-transfer-speed-converter';
import PressureConverter from '@/components/calculators/pressure-converter';
import EnergyPowerConverter from '@/components/calculators/energy-power-converter';
import ForceConverter from '@/components/calculators/force-converter';
import SpeedConverter from '@/components/calculators/speed-converter';
import BandwidthCalculator from '@/components/calculators/bandwidth-calculator';
import AcreageCalculator from '@/components/calculators/acreage-calculator';
import AreaConverter from '@/components/calculators/area-converter';
import AstronomicalUnitConverter from '@/components/calculators/astronomical-unit-converter';
import FeetAndInchesCalculator from '@/components/calculators/feet-and-inches-calculator';
import HeightInInchesCalculator from '@/components/calculators/height-in-inches-calculator';
import InchesToFractionCalculator from '@/components/calculators/inches-to-fraction-calculator';
import LengthConverter from '@/components/calculators/length-converter';
import MeshToMicronConverter from '@/components/calculators/mesh-to-micron-converter';
import PixelsToInchesConverter from '@/components/calculators/pixels-to-inches-converter';
import AresToHectaresConverter from '@/components/calculators/ares-to-hectares-converter';
import DecimeterToMeterConverter from '@/components/calculators/decimeter-to-meter-converter';
import LightYearConverter from '@/components/calculators/light-year-converter';
import CommuteCostCalculator from '@/components/calculators/commute-cost-calculator';
import HourlyToSalaryConverter from '@/components/calculators/hourly-to-salary-converter';
import ShouldIGoFreelanceCalculator from '@/components/calculators/should-i-go-freelance-calculator';
import WorkHoursCalculator from '@/components/calculators/work-hours-calculator';
import RaisePercentageCalculator from '@/components/calculators/raise-percentage-calculator';
import BloodSugarConverter from '@/components/calculators/blood-sugar-converter';
import CarbCalculator from '@/components/calculators/carb-calculator';
import WeightWatchersPointsCalculator from '@/components/calculators/weight-watchers-points-calculator';
import OvertimePayCalculator from '@/components/calculators/overtime-pay-calculator';
import InterviewPrepCostCalculator from '@/components/calculators/interview-prep-cost-calculator';
import ProteinIntakeCalculator from '@/components/calculators/protein-intake-calculator';
import StudentLoanCalculator from '@/components/calculators/student-loan-calculator';
import PensionCalculator from '@/components/calculators/pension-calculator';
import MortgageCalculatorUK from '@/components/calculators/mortgage-calculator-uk';
import PValueCalculator from '@/components/calculators/p-value-calculator';


type CalculatorClientPageProps = {
  calculator: Omit<Calculator, 'icon'>;
};

const calculatorComponents: { [key: string]: React.ComponentType<any> } = {
  'mortgage-calculator': MortgageCalculator,
  'mortgage-calculator-uk': MortgageCalculatorUK,
  'loan-calculator': LoanCalculator,
  'student-loan-calculator': StudentLoanCalculator,
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
  'pension-calculator': PensionCalculator,
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
  'bmi-calculator': BmiCalculator,
  'calorie-calculator': CalorieCalculator,
  'pace-calculator': PaceCalculator,
  'bmr-calculator': BmrCalculator,
  'body-fat-calculator': BodyFatCalculator,
  'ideal-weight-calculator': IdealWeightCalculator,
  'tdee-calculator': TdeeCalculator,
  'macro-calculator': MacroCalculator,
  'one-rep-max-calculator': OneRepMaxCalculator,
  'pregnancy-due-date-calculator': PregnancyDueDateCalculator,
  'ovulation-calculator': OvulationCalculator,
  'bac-calculator': BacCalculator,
  'smoking-cost-calculator': SmokingCostCalculator,
  'water-intake-calculator': WaterIntakeCalculator,
  'heart-rate-zone-calculator': HeartRateZoneCalculator,
  'running-time-predictor': RunningTimePredictor,
  'wilks-score-calculator': WilksScoreCalculator,
  'apft-calculator': ApftCalculator,
  'bsa-calculator': BsaCalculator,
  'child-height-predictor': ChildHeightPredictor,
  'basic-calculator': BasicCalculator,
  'percentage-calculator': PercentageCalculator,
  'fraction-calculator': FractionCalculator,
  'scientific-calculator': ScientificCalculator,
  'random-number-generator': RandomNumberGenerator,
  'standard-deviation-calculator': StandardDeviationCalculator,
  'area-calculator': AreaCalculator,
  'volume-calculator': VolumeCalculator,
  'prime-number-calculator': PrimeNumberCalculator,
  'p-value-calculator': PValueCalculator,
  'gcd-calculator': GcdCalculator,
  'lcm-calculator': LcmCalculator,
  'logarithm-calculator': LogarithmCalculator,
  'pythagorean-theorem-calculator': PythagoreanTheoremCalculator,
  'quadratic-equation-solver': QuadraticEquationSolver,
  'factorial-calculator': FactorialCalculator,
  'matrix-calculator': MatrixCalculator,
  'mean-median-mode-calculator': MeanMedianModeCalculator,
  'number-sequence-calculator': NumberSequenceCalculator,
  'root-calculator': RootCalculator,
  'combinations-permutations-calculator': CombinationsPermutationsCalculator,
  'age-calculator': AgeCalculator,
  'date-difference-calculator': DateDifferenceCalculator,
  'time-calculator': TimeCalculator,
  'birthday-calculator': BirthdayCalculator,
  'date-to-day-calculator': DateToDayCalculator,
  'working-days-calculator': WorkingDaysCalculator,
  'time-duration-calculator': TimeDurationCalculator,
  'countdown-timer': CountdownTimer,
  'stopwatch-calculator': StopwatchCalculator,
  'time-card-calculator': TimeCardCalculator,
  'salary-negotiation-calculator': SalaryNegotiationCalculator,
  'job-offer-comparison-calculator': JobOfferComparisonCalculator,
  'freelance-rate-calculator': FreelanceRateCalculator,
  'wallpaper-calculator': WallpaperCalculator,
  'dilution-calculator': DilutionCalculator,
  'ohms-law-calculator': OhmsLawCalculator,
  'bandwidth-calculator': BandwidthCalculator,
  'vo2-max-estimator': Vo2MaxEstimator,
  'ffmi-calculator': FfmiCalculator,
  'sleep-calculator': SleepCalculator,
  'protein-intake-calculator': ProteinIntakeCalculator,
  'hydration-calculator': HydrationCalculator,
  'healthy-weight-gain-calculator': HealthyWeightGainCalculator,
  'cardiovascular-risk-calculator': CardiovascularRiskCalculator,
  'marine-pft-calculator': MarinePftCalculator,
  'navy-prt-calculator': NavyPrtCalculator,
  'graphing-calculator': GraphingCalculator,
  'derivative-calculator': DerivativeCalculator,
  'integral-calculator': IntegralCalculator,
  'limits-calculator': LimitsCalculator,
  'equation-solver': EquationSolver,
  'ratio-calculator': RatioCalculator,
  'unit-converter': UnitConverter,
  'sig-fig-calculator': SigFigCalculator,
  'data-storage-converter': DataStorageConverter,
  'data-transfer-speed-converter': DataTransferSpeedConverter,
  'pressure-converter': PressureConverter,
  'energy-power-converter': EnergyPowerConverter,
  'force-converter': ForceConverter,
  'speed-converter': SpeedConverter,
  'acreage-calculator': AcreageCalculator,
  'area-converter': AreaConverter,
  'astronomical-unit-converter': AstronomicalUnitConverter,
  'feet-and-inches-calculator': FeetAndInchesCalculator,
  'height-in-inches-calculator': HeightInInchesCalculator,
  'inches-to-fraction-calculator': InchesToFractionCalculator,
  'length-converter': LengthConverter,
  'mesh-to-micron-converter': MeshToMicronConverter,
  'pixels-to-inches-converter': PixelsToInchesConverter,
  'ares-to-hectares-converter': AresToHectaresConverter,
  'decimeter-to-meter-converter': DecimeterToMeterConverter,
  'light-year-converter': LightYearConverter,
  'commute-cost-calculator': CommuteCostCalculator,
  'hourly-to-salary-converter': HourlyToSalaryConverter,
  'should-i-go-freelance-calculator': ShouldIGoFreelanceCalculator,
  'work-hours-calculator': WorkHoursCalculator,
  'raise-percentage-calculator': RaisePercentageCalculator,
  'blood-sugar-converter': BloodSugarConverter,
  'bmi-weight-loss-calculator': BmiWeightLossCalculator,
  'carb-calculator': CarbCalculator,
  'weight-watchers-points-calculator': WeightWatchersPointsCalculator,
  'overtime-pay-calculator': OvertimePayCalculator,
  'interview-prep-cost-calculator': InterviewPrepCostCalculator,
};

const PageSkeleton = ({ calculator }: { calculator: Omit<Calculator, 'icon'> }) => {
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
                            <Copy className="h-5 w-5" />
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
};


function CalculatorPageContent({ calculator }: CalculatorClientPageProps) {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This will only run on the client, after hydration
    setLastUpdated(new Date().toISOString().split('T')[0]);
  }, []);
  
  const CalculatorComponent = calculatorComponents[calculator.slug];

  const handleCopyToClipboard = () => {
    if (!formRef.current) return;

    const inputs = formRef.current.querySelectorAll('input, select, textarea');
    let report = `Calculator: ${calculator.name}\n\n--- Inputs ---\n`;
    
    inputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if(label && input.id) {
          const key = label.textContent || input.id;
          let value = (input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
          if (input.tagName.toLowerCase() === 'select') {
              const select = input as HTMLSelectElement;
              value = select.options[select.selectedIndex].text;
          }
          if (value) {
            report += `${key}: ${value}\n`;
          }
      }
    });

    // Attempt to find results in a more robust way
    const resultsContainer = document.querySelector('[data-results-container]');
    if (resultsContainer) {
        report += "\n--- Results ---\n";
        const textContent = (resultsContainer as HTMLElement).innerText;
        // Clean up the text content a bit
        const cleanedText = textContent.replace(/^Results\s*/, '').replace(/\n+/g, '\n').trim();
        report += cleanedText;
    }
    
    navigator.clipboard.writeText(report);

    toast({
      title: "Copied to Clipboard",
      description: "The calculator inputs and results have been copied.",
    })
  }
  
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
                  <Button variant="outline" size="icon" aria-label="Copy Results" onClick={handleCopyToClipboard}>
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
            </div>
            </CardHeader>
            <CardContent>
              {/* Main calculator UI */}
              <div ref={formRef} className="mt-6 border rounded-lg p-4 md:p-6">
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
                      <div className="space-y-4" data-results-container>
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
                <Accordion type="single" collapsible className="w-full" defaultValue="purpose">
                  <AccordionItem value="purpose">
                    <AccordionTrigger>Why Use This Calculator?</AccordionTrigger>
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
                    <AccordionTrigger>Common Uses & Scenarios</AccordionTrigger>
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
                    <AccordionTrigger>How It Works</AccordionTrigger>
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
                            <div data-results-container>
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
                    <AccordionTrigger>Formulas & Disclaimers</AccordionTrigger>
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
              {lastUpdated ? <p>Last Updated: {lastUpdated} | Formula v1.0</p> : <p>Loading date...</p>}
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

  if (!isClient) {
    return <PageSkeleton calculator={calculator} />;
  }
  
  return <CalculatorPageContent calculator={calculator} />;
}
