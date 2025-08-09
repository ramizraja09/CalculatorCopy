import type { ComponentType } from 'react';
import { PiggyBank, Car, Utensils, HeartPulse, Percent, Home, BrainCircuit, GraduationCap, TrendingUp, Footprints, Scale, Calculator, Calendar, Repeat, Atom, FlaskConical, Beaker, Ruler, Clock, Landmark, FileText, Wallet, Receipt, CreditCard, Recycle, Banknote, CandlestickChart, Briefcase } from 'lucide-react';

export type Calculator = {
  name: string;
  slug: string;
  description: string;
  category: string;
  icon?: ComponentType<{ className?: string }>;
};

export const calculators: Calculator[] = [
  {
    name: 'Mortgage Calculator',
    slug: 'mortgage-calculator',
    description: 'Estimate your monthly mortgage payments, principal, and interest.',
    category: 'Finance',
    icon: Home,
  },
  {
    name: 'Loan Calculator',
    slug: 'loan-calculator',
    description: 'Determine the repayment schedule for any type of fixed-rate loan.',
    category: 'Finance',
    icon: PiggyBank,
  },
  {
    name: 'Car Loan Calculator',
    slug: 'car-loan-calculator',
    description: 'Estimate your monthly car loan payments and total interest cost.',
    category: 'Finance',
    icon: Car,
  },
   {
    name: 'Amortization Calculator',
    slug: 'amortization-calculator',
    description: 'See how your loan payments are applied to principal and interest over time.',
    category: 'Finance',
    icon: FileText,
  },
  {
    name: 'Interest Calculator',
    slug: 'interest-calculator',
    description: 'Calculate simple and compound interest for a loan or investment.',
    category: 'Finance',
    icon: Percent,
  },
  {
    name: 'Compound Interest Calculator',
    slug: 'compound-interest-calculator',
    description: 'Calculate how much your investments will grow over time.',
    category: 'Finance',
    icon: TrendingUp,
  },
  {
    name: 'Investment Return Calculator',
    slug: 'investment-return-calculator',
    description: 'Evaluate the performance of an investment and see its growth.',
    category: 'Finance',
    icon: CandlestickChart,
  },
  {
    name: 'Retirement Savings Calculator',
    slug: 'retirement-savings-calculator',
    description: 'Project your retirement savings growth and see if you are on track.',
    category: 'Finance',
    icon: Landmark,
  },
  {
    name: 'Inflation Calculator',
    slug: 'inflation-calculator',
    description: 'See how the value of money changes over time due to inflation.',
    category: 'Finance',
    icon: TrendingUp,
  },
  {
    name: 'Income Tax Calculator',
    slug: 'income-tax-calculator',
    description: 'Estimate your federal income tax liability based on your filing status and income.',
    category: 'Finance',
    icon: Receipt,
  },
  {
    name: 'Salary (Take-Home Pay) Calculator',
    slug: 'salary-calculator',
    description: 'Calculate your net pay by subtracting taxes and other deductions from your gross salary.',
    category: 'Finance',
    icon: Wallet,
  },
  {
    name: 'Sales Tax Calculator',
    slug: 'sales-tax-calculator',
    description: 'Quickly calculate sales tax for any amount and tax rate.',
    category: 'Finance',
    icon: Receipt,
  },
  {
    name: 'Credit Card Payoff Calculator',
    slug: 'credit-card-payoff-calculator',
    description: 'Find out how long it will take to pay off your credit card balance.',
    category: 'Finance',
    icon: CreditCard,
  },
  {
    name: 'Debt Payoff/Snowball Calculator',
    slug: 'debt-snowball-calculator',
    description: 'Create a plan to pay off multiple debts using the debt snowball method.',
    category: 'Finance',
    icon: Recycle,
  },
  {
    name: 'Refinance Calculator',
    slug: 'refinance-calculator',
    description: 'Determine if refinancing your mortgage could save you money.',
    category: 'Finance',
    icon: Home,
  },
  {
    name: 'APR/APY Calculator',
    slug: 'apr-apy-calculator',
    description: 'Convert between Annual Percentage Rate (APR) and Annual Percentage Yield (APY).',
    category: 'Finance',
    icon: Percent,
  },
  {
    name: 'ROI (Return on Investment) Calculator',
    slug: 'roi-calculator',
    description: 'Calculate the profitability of an investment as a percentage.',
    category: 'Finance',
    icon: Briefcase,
  },
  {
    name: 'Time Value of Money (TVM) Calculator',
    slug: 'tvm-calculator',
    description: 'Solve for present value, future value, rate, or periods in financial calculations.',
    category: 'Finance',
    icon: Clock,
  },
  {
    name: 'Savings Goal Calculator',
    slug: 'savings-goal-calculator',
    description: 'Determine how much you need to save regularly to reach a financial goal.',
    category: 'Finance',
    icon: PiggyBank,
  },
  {
    name: 'Investment Calculator',
    slug: 'investment-calculator',
    description: 'See how your investments can grow over time with compound interest.',
    category: 'Finance',
    icon: BrainCircuit
  },
  {
    name: 'BMI Calculator',
    slug: 'bmi-calculator',
    description: 'Calculate your Body Mass Index to assess your weight category.',
    category: 'Health & Fitness',
    icon: HeartPulse,
  },
  {
    name: 'Calorie Calculator',
    slug: 'calorie-calculator',
    description: 'Estimate your daily calorie needs for maintaining, losing, or gaining weight.',
    category: 'Health & Fitness',
    icon: Utensils,
  },
  {
    name: 'Pace Calculator',
    slug: 'pace-calculator',
    description: 'Calculate your running pace, finish time, or distance for your runs.',
    category: 'Health & Fitness',
    icon: Footprints
  },
  {
    name: 'BMR Calculator',
    slug: 'bmr-calculator',
    description: 'Calculate your Basal Metabolic Rate, the number of calories your body needs at rest.',
    category: 'Health & Fitness',
    icon: HeartPulse,
  },
  {
    name: 'Body Fat Calculator',
    slug: 'body-fat-calculator',
    description: 'Estimate your body fat percentage using the U.S. Navy method.',
    category: 'Health & Fitness',
    icon: Scale,
  },
  {
    name: 'Basic Calculator',
    slug: 'basic-calculator',
    description: 'A simple calculator for everyday arithmetic operations.',
    category: 'Math',
    icon: Calculator,
  },
  {
    name: 'Percentage Calculator',
    slug: 'percentage-calculator',
    description: 'Solve various percentage problems with ease.',
    category: 'Math',
    icon: Percent,
  },
  {
    name: 'Fraction Calculator',
    slug: 'fraction-calculator',
    description: 'Add, subtract, multiply, and divide fractions.',
    category: 'Math',
    icon: Beaker,
  },
  {
    name: 'Scientific Calculator',
    slug: 'scientific-calculator',
    description: 'Perform advanced calculations with trigonometric, logarithmic, and exponential functions.',
    category: 'Math',
    icon: Atom,
  },
  {
    name: 'Unit Converter',
    slug: 'unit-converter',
    description: 'Convert between various units of measurement for length, mass, temperature, and more.',
    category: 'Conversions',
    icon: Repeat,
  },
  {
    name: 'Cooking Conversion Calculator',
    slug: 'cooking-conversion-calculator',
    description: 'Convert cooking units like cups, tablespoons, and ounces.',
    category: 'Conversions',
    icon: Utensils,
  },
  {
    name: 'Temperature Converter',
    slug: 'temperature-converter',
    description: 'Convert temperatures between Celsius, Fahrenheit, and Kelvin.',
    category: 'Conversions',
    icon: FlaskConical,
  },
  {
    name: 'Length Converter',
    slug: 'length-converter',
    description: 'Convert between different units of length (e.g., meters, feet, miles).',
    category: 'Conversions',
    icon: Ruler,
  },
  {
    name: 'Age Calculator',
    slug: 'age-calculator',
    description: 'Find out your exact age in years, months, and days.',
    category: 'Time & Date',
    icon: Calendar,
  },
  {
    name: 'Date Difference Calculator',
    slug: 'date-difference-calculator',
    description: 'Calculate the number of days, months, and years between two dates.',
    category: 'Time & Date',
    icon: Calendar,
  },
  {
    name: 'Time Calculator',
    slug: 'time-calculator',
    description: 'Add or subtract time values in hours, minutes, and seconds.',
    category: 'Time & Date',
    icon: Clock,
  },
  {
    name: 'Tip Calculator',
    slug: 'tip-calculator',
    description: 'Quickly calculate the tip for a bill for any number of people.',
    category: 'Everyday Utilities',
    icon: Utensils,
  },
  {
    name: 'Fuel Cost Calculator',
    slug: 'fuel-cost-calculator',
    description: 'Estimate the total fuel cost for a road trip based on distance and MPG.',
    category: 'Everyday Utilities',
    icon: Car,
  },
  {
    name: 'GPA Calculator',
    slug: 'gpa-calculator',
    description: 'Calculate your Grade Point Average based on grades and credit hours.',
    category: 'Everyday Utilities',
    icon: GraduationCap,
  },
];

export const calculatorCategories = [...new Set(calculators.map(c => c.category))].sort();
export const calculatorNames = calculators.map(c => c.name);
