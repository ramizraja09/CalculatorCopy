
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash } from 'lucide-react';

const courseSchema = z.object({
  credits: z.number().min(0.5, 'Credits must be positive'),
  grade: z.string().nonempty('Please select a grade'),
});

const formSchema = z.object({
  courses: z.array(courseSchema).min(1, 'Please add at least one course.'),
});

type FormData = z.infer<typeof formSchema>;

const gradePoints: { [key: string]: number } = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0,
};

export default function GpaCalculator() {
  const [results, setResults] = useState<any>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courses: [{ credits: 3, grade: 'A' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "courses",
  });

  const calculateGpa = (data: FormData) => {
    let totalPoints = 0;
    let totalCredits = 0;
    
    data.courses.forEach(course => {
      totalPoints += course.credits * (gradePoints[course.grade] || 0);
      totalCredits += course.credits;
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    
    setResults({ gpa, totalCredits, error: null });
  };

  return (
    <form onSubmit={handleSubmit(calculateGpa)} className="grid md:grid-cols-2 gap-8">
      {/* Inputs Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Courses</h3>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-end p-2 border rounded-md">
              <div className="flex-1 space-y-1">
                <Label htmlFor={`courses[${index}].credits`}>Credits</Label>
                <Controller name={`courses.${index}.credits`} control={control} render={({ field }) => <Input type="number" step="0.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor={`courses[${index}].grade`}>Grade</Label>
                <Controller name={`courses.${index}.grade`} control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(gradePoints).map(grade => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4" /></Button>
            </div>
          ))}
          {errors.courses?.root && <p className="text-destructive text-sm mt-1">{errors.courses.root.message}</p>}
        </div>

        <Button type="button" variant="outline" onClick={() => append({ credits: 3, grade: 'A' })}>Add Course</Button>
        <Button type="submit" className="w-full">Calculate GPA</Button>
      </div>

      {/* Results Column */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Results</h3>
        {results ? (
            results.error ? (
                <Card className="flex items-center justify-center h-60 bg-muted/50 border-dashed">
                    <p className="text-destructive">{results.error}</p>
                </Card>
            ) : (
                 <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Your GPA</p>
                            <p className="text-3xl font-bold">{results.gpa.toFixed(3)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                             <p className="text-muted-foreground">Total Credits</p>
                             <p className="font-semibold">{results.totalCredits}</p>
                        </CardContent>
                    </Card>
                </div>
            )
        ) : (
             <div className="flex items-center justify-center h-60 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Add your courses and grades to calculate your GPA</p>
            </div>
        )}
      </div>
    </form>
  );
}
