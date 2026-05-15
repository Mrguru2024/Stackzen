'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  duration: number | string | null;
  rating: number | null;
  reviews: number | null;
  isProOnly: boolean;
  tags: string[];
  user: {
    name: string | null;
    image: string | null;
  };
}

interface Category {
  group: string;
  items: {
    value: string;
    label: string;
  }[];
}

interface ServicesPageProps {
  services: Service[];
  categories: Category[];
}

export function ServicesPage({ services }: ServicesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const _filteredServices = services.filter(service => {
    const _matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return _matchesSearch;
  });

  return (
    <div className="px-4 py-4 md:px-8">
      <div className="mb-4">
        <Input
          placeholder="Search services..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {_filteredServices.map(service => (
          <Card key={service.id}>
            <CardHeader>
              <CardTitle>{service.title}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Category: {service.category}</p>
              <p>Price: ${service.price}</p>
              <p>Duration: {service.duration}</p>
            </CardContent>
            <CardFooter>
              <Button>View Details</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
