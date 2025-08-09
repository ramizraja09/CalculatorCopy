
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp } from 'lucide-react';

const formSchema = z.object({
  text: z.string(),
  base64: z.string(),
});
type FormData = z.infer<typeof formSchema>;

export default function Base64Encoder() {
  const { control, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: { text: 'Hello World!', base64: '' },
  });

  const encode = (data: FormData) => {
    try {
      setValue('base64', btoa(data.text));
    } catch (e) {
      setValue('base64', 'Invalid input for Base64 encoding.');
    }
  };

  const decode = (data: FormData) => {
    try {
      setValue('text', atob(data.base64));
    } catch (e) {
      setValue('text', 'Invalid Base64 string.');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller name="text" control={control} render={({ field }) => (
            <Textarea placeholder="Enter text to encode/decode" {...field} rows={5} />
          )} />
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button onClick={handleSubmit(encode)}>
          <ArrowDown className="mr-2 h-4 w-4" /> Encode
        </Button>
        <Button onClick={handleSubmit(decode)}>
          <ArrowUp className="mr-2 h-4 w-4" /> Decode
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Base64</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller name="base64" control={control} render={({ field }) => (
            <Textarea placeholder="Enter Base64 to decode" {...field} rows={5} />
          )} />
        </CardContent>
      </Card>
    </div>
  );
}
