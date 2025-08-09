import type { ComponentType } from 'react';
import { PiggyBank, Car, Utensils, HeartPulse, Percent, Home, BrainCircuit, GraduationCap, TrendingUp, Footprints } from 'lucide-react';

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
    name: 'BMI Calculator',
    slug: 'bmi-calculator',
    description: 'Calculate your Body Mass Index to assess your weight category.',
    category: 'Health',
    icon: HeartPulse,
  },
  {
    name: 'Tip Calculator',
    slug: 'tip-calculator',
    description: 'Quickly calculate the tip for a bill for any number of people.',
    category: 'Lifestyle',
    icon: Utensils,
  },
  {
    name: 'Loan Calculator',
    slug: 'loan-calculator',
    description: 'Determine the repayment schedule for any type of fixed-rate loan.',
    category: 'Finance',
    icon: PiggyBank,
  },
  {
    name: 'Percentage Calculator',
    slug: 'percentage-calculator',
    description: 'Solve various percentage problems with ease.',
    category: 'Math',
    icon: Percent,
  },
  {
    name: 'Fuel Cost Calculator',
    slug: 'fuel-cost-calculator',
    description: 'Estimate the total fuel cost for a road trip based on distance and MPG.',
    category: 'Travel',
    icon: Car,
  },
  {
    name: 'Retirement Savings',
    slug: 'retirement-savings-calculator',
    description: 'Project your retirement savings growth and see if you are on track.',
    category: 'Finance',
    icon: TrendingUp,
  },
  {
    name: 'Calorie Calculator',
    slug: 'calorie-calculator',
    description: 'Estimate your daily calorie needs for maintaining, losing, or gaining weight.',
    category: 'Health',
    icon: Utensils,
  },
  {
    name: 'GPA Calculator',
    slug: 'gpa-calculator',
    description: 'Calculate your Grade Point Average based on grades and credit hours.',
    category: 'Education',
    icon: GraduationCap,
  },
  {
    name: 'Car Loan Calculator',
    slug: 'car-loan-calculator',
    description: 'Estimate your monthly car loan payments and total interest cost.',
    category: 'Finance',
    icon: Car,
  },
  {
    name: 'Investment Calculator',
    slug: 'investment-calculator',
    description: 'See how your investments can grow over time with compound interest.',
    category: 'Finance',
    icon: BrainCircuit
  },
  {
    name: 'Pace Calculator',
    slug: 'pace-calculator',
    description: 'Calculate your running pace, finish time, or distance for your runs.',
    category: 'Health',
    icon: Footprints
  }
];

export const calculatorCategories = [...new Set(calculators.map(c => c.category))];
export const calculatorNames = calculators.map(c => c.name);
