'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus as PlusIcon } from 'lucide-react';

const serviceFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z.number().min(1, 'Price must be greater than 0'),
  duration: z
    .string()
    .min(1, 'Duration is required')
    .refine(
      val => {
        // Ensure duration is a positive number and has a valid unit
        const [num, unit] = val.split(' ');
        return !!unit && !isNaN(Number(num)) && Number(num) > 0;
      },
      { message: 'Duration must be a positive number with a valid unit' }
    ),
  tags: z.string().transform(str => str.split(',').map(tag => tag.trim())),
  isProOnly: z.boolean().default(false),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

const categories = [
  {
    group: 'Development Services',
    items: [
      { value: 'web-development', label: 'Web Development' },
      { value: 'mobile-development', label: 'Mobile Development' },
      { value: 'database-design', label: 'Database Design' },
      { value: 'devops', label: 'DevOps' },
      { value: 'blockchain-development', label: 'Blockchain Development' },
      { value: 'ai-ml', label: 'AI & Machine Learning' },
      { value: 'cybersecurity', label: 'Cybersecurity' },
      { value: 'cloud-services', label: 'Cloud Services' },
      { value: 'system-architecture', label: 'System Architecture' },
    ],
  },
  {
    group: 'Design Services',
    items: [
      { value: 'ui-ux-design', label: 'UI/UX Design' },
      { value: 'graphic-design', label: 'Graphic Design' },
      { value: 'branding', label: 'Branding' },
      { value: 'print-design', label: 'Print Design' },
      { value: 'motion-graphics', label: 'Motion Graphics' },
      { value: '3d-modeling', label: '3D Modeling' },
    ],
  },
  {
    group: 'Content & Writing',
    items: [
      { value: 'content-writing', label: 'Content Writing' },
      { value: 'technical-writing', label: 'Technical Writing' },
      { value: 'copywriting', label: 'Copywriting' },
      { value: 'editing', label: 'Editing' },
      { value: 'translation', label: 'Translation' },
    ],
  },
  {
    group: 'Marketing & SEO',
    items: [
      { value: 'digital-marketing', label: 'Digital Marketing' },
      { value: 'seo', label: 'SEO' },
      { value: 'social-media-management', label: 'Social Media Management' },
      { value: 'email-marketing', label: 'Email Marketing' },
      { value: 'ppc-advertising', label: 'PPC Advertising' },
    ],
  },
  {
    group: 'Other Services',
    items: [
      { value: 'pet-care', label: 'Pet Care' },
      { value: 'elderly-care', label: 'Elderly Care' },
      { value: 'childcare', label: 'Childcare' },
      { value: 'personal-training', label: 'Personal Training' },
      { value: 'massage-therapy', label: 'Massage Therapy' },
    ],
  },
];

const durationUnits = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
];

export function CreateServiceModal() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [durationValue, setDurationValue] = useState('');
  const [durationUnit, setDurationUnit] = useState('hours');

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      price: 0,
      duration: '',
      tags: '',
      isProOnly: false,
    },
  });

  useEffect(() => {
    if (durationValue && durationUnit) {
      form.setValue('duration', `${durationValue} ${durationUnit}`);
    }
  }, [durationValue, durationUnit, form]);

  async function onSubmit(data: ServiceFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create service');
      }

      toast.success('Service created successfully');
      setOpen(false);
      form.reset();
      setDurationValue('');
      setDurationUnit('hours');
    } catch (error) {
      toast.error('Failed to create service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} />
          Create Service
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader className="sticky top-0 z-10 border-b bg-background pb-4">
          <DialogTitle>Create New Service</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter service title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your service in detail"
                      className="min-h-[100px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Category</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? categories
                                .flatMap(group => group.items)
                                .find(item => item.value === field.value)?.label
                            : 'Select category'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search categories..." />
                        <CommandList>
                          <CommandEmpty>No category found.</CommandEmpty>
                          {categories.map(group => (
                            <CommandGroup key={group.group} heading={group.group}>
                              {group.items.map(item => (
                                <CommandItem
                                  value={item.value}
                                  key={item.value}
                                  onSelect={() => {
                                    form.setValue('category', item.value);
                                  }}
                                  onClick={e => {
                                    e.preventDefault();
                                    form.setValue('category', item.value);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      field.value === item.value ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {item.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Choose the category that best describes your service
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Duration"
                          min={1}
                          value={durationValue}
                          onChange={e => {
                            // Only allow positive numbers
                            const val = e.target.value;
                            if (/^\d*$/.test(val) && Number(val) > 0) {
                              setDurationValue(val);
                              if (durationUnit) {
                                form.setValue('duration', `${val} ${durationUnit}`);
                              }
                            } else if (val === '') {
                              setDurationValue('');
                              form.setValue('duration', '');
                            }
                          }}
                          className="w-24"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          aria-label="Duration value"
                        />
                      </FormControl>
                      <Select
                        value={durationUnit}
                        onValueChange={value => {
                          setDurationUnit(value);
                          if (durationValue) {
                            form.setValue('duration', `${durationValue} ${value}`);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {durationUnits.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., web, design, marketing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isProOnly"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300"
                      aria-label="Pro Only Service"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Pro Only Service</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="sticky bottom-0 flex flex-col justify-end gap-4 border-t bg-background pt-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? 'Creating...' : 'Create Service'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
