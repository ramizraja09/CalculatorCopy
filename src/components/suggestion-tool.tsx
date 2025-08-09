"use client";

import { useState, useTransition } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';

import { getSuggestions } from '@/app/actions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { calculators } from '@/lib/calculators';

const FormSchema = z.object({
  prompt: z.string().min(10, {
    message: "Please describe your needs in at least 10 characters.",
  }),
})

export default function SuggestionTool() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: "",
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      setError(null);
      setSuggestions([]);
      
      const result = await getSuggestions(data.prompt);

      if (result.error) {
        setError(result.error);
      } else {
        setSuggestions(result.suggestions);
      }
    });
  }

  const getSlug = (name: string) => {
    return calculators.find(c => c.name === name)?.slug || '#';
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <BrainCircuit className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="font-headline text-2xl">Intelligent Suggestions</CardTitle>
            <CardDescription>Describe what you need to calculate, and we'll suggest the right tools.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your calculation needs:</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'I'm buying a house and need to figure out my monthly payments and total interest.'"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Suggest Calculators
                </>
              )}
            </Button>
          </form>
        </Form>
        
        {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}
        
        {suggestions.length > 0 && (
          <div className="mt-6">
            <h3 className="font-headline text-lg font-medium">Here are some suggested calculators:</h3>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {suggestions.map((name) => (
                <li key={name}>
                  <Link href={`/calculators/${getSlug(name)}`} className="text-primary hover:underline font-medium">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
