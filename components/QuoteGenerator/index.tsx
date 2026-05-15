'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';
import AddressInput from '../ui/address-input.tsx';
import LocationMap from '../ui/location-map.tsx';
import {
  Location,
  TravelDetails,
  calculateTravelDetails,
  AddressFormat,
} from '@/lib/location-utils';
import { Button } from '@/components/ui';
import { toast } from '@/components/ui/use-toast';
import { _getServicesByCategory, SERVICE_CATEGORIES } from '@/lib/service-config';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { _Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Plus } from 'lucide-react';
import { getTaxRateForState } from '@/lib/tax-utils';
import { SendQuoteDialog } from './SendQuoteDialog';

interface QuoteFormState {
  serviceType: string;
  jobDescription: string;
  hours: number;
  hourlyRate: number;
  materialsCost: number;
  tier: 'basic' | 'standard' | 'premium';
  serviceLocation: Location;
  contractorLocation: Location;
  addressFormat: AddressFormat;
  travelCost: number;
  customerEmail?: string;
  customerPhone?: string;
  preferredContactMethod?: 'email' | 'sms';
}

interface QuoteBreakdown {
  laborCost: number;
  materialsCost: number;
  travelCost: number;
  overheadCost: number;
  profitMargin: number;
  totalCost: number;
  suggestedPrice: number;
  netProfit: number;
}

interface QuoteOption {
  tier: 'basic' | 'standard' | 'premium';
  name: string;
  price: number;
  features: string[];
  valueProps: string[];
  warranty: string;
  responseTime: string;
  additionalServices: string[];
  breakdown: QuoteBreakdown;
}

interface EditableQuoteOption extends QuoteOption {
  isEditing?: boolean;
  customPrice?: number;
  customFeatures?: string[];
  customWarranty?: string;
  customResponseTime?: string;
  customAdditionalServices?: string[];
}

const initialForm: QuoteFormState = {
  serviceType: '',
  jobDescription: '',
  hours: 1,
  hourlyRate: 75,
  materialsCost: 0,
  tier: 'standard',
  serviceLocation: { address: '', latitude: 0, longitude: 0 },
  contractorLocation: { address: '', latitude: 0, longitude: 0 },
  addressFormat: 'full',
  travelCost: 0,
  customerEmail: '',
  customerPhone: '',
  preferredContactMethod: 'email',
};

interface QuoteGeneratorProps {
  onSave: (quote: any) => void;
  onCancel: () => void;
}

const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({ onSave, onCancel }) => {
  const [form, setForm] = useState(initialForm);
  const [selectedQuoteOption, setSelectedQuoteOption] = useState<
    'basic' | 'standard' | 'premium' | null
  >(null);
  const [quoteOptions, setQuoteOptions] = useState<QuoteOption[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [travelDetails, setTravelDetails] = useState<TravelDetails | null>(null);
  const [editableOptions, setEditableOptions] = useState<EditableQuoteOption[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  // Memoize the categorized services
  const _categorizedServices = React.useMemo(() => _getServicesByCategory(), []);

  // Calculate travel details when locations change
  useEffect(() => {
    async function updateTravelDetails() {
      // Check if both locations have coordinates
      if (!form.serviceLocation.latitude || !form.contractorLocation.latitude) {
        console.log('Missing location coordinates:', {
          service: form.serviceLocation,
          contractor: form.contractorLocation,
        });
        setTravelDetails(null);
        return;
      }

      // Check if Google Maps API is loaded
      if (!window.google) {
        console.log('Google Maps API not loaded yet');
        setTravelDetails(null);
        return;
      }

      try {
        const details = await calculateTravelDetails(
          form.serviceLocation,
          form.contractorLocation,
          form.tier
        );

        if (!details) {
          console.log('No travel details returned from calculation');
          setTravelDetails(null);
          return;
        }

        console.log('Travel details calculated:', details);
        setTravelDetails(details);
      } catch (err) {
        console.error('Failed to calculate travel details:', err);
        setTravelDetails(null);
      }
    }

    // Only update travel details if both locations have coordinates
    if (form.serviceLocation.latitude && form.contractorLocation.latitude) {
      updateTravelDetails();
    }
  }, [form.serviceLocation, form.contractorLocation, form.tier]);

  const _calculateQuoteBreakdown = useCallback(
    (
      hours: number,
      hourlyRate: number,
      materialsCost: number,
      travelCost: number,
      tier: 'basic' | 'standard' | 'premium'
    ): QuoteBreakdown => {
      const laborCost = hours * hourlyRate;
      const overheadCost = laborCost * 0.15; // 15% overhead
      const totalCost = laborCost + materialsCost + travelCost + overheadCost;

      // Profit margins based on tier
      const profitMargins = {
        basic: 0.15, // 15% profit margin
        standard: 0.25, // 25% profit margin
        premium: 0.35, // 35% profit margin
      };

      const profitMargin = profitMargins[tier];
      const suggestedPrice = totalCost / (1 - profitMargin);
      const netProfit = suggestedPrice - totalCost;

      return {
        laborCost,
        materialsCost,
        travelCost,
        overheadCost,
        profitMargin,
        totalCost,
        suggestedPrice,
        netProfit,
      };
    },
    []
  );

  const calculateQuoteOptions = useCallback(() => {
    if (!form.hours || !form.hourlyRate || !form.materialsCost) return [];

    const baseLaborCost = form.hours * form.hourlyRate;
    const baseMaterialsCost = form.materialsCost;
    const baseTravelCost = travelDetails?.travelCost || 0;
    const baseOverhead = baseLaborCost * 0.15; // 15% overhead
    const baseSubtotal = baseLaborCost + baseMaterialsCost + baseTravelCost + baseOverhead;
    const baseTaxRate = getTaxRateForState(form.serviceLocation.state);
    const baseTax = baseSubtotal * baseTaxRate;
    const baseTotal = baseSubtotal + baseTax;

    return [
      {
        tier: 'basic',
        name: 'Basic Package',
        features: [
          'Standard service quality',
          'Basic materials included',
          '30-day warranty',
          'Standard response time',
          'Basic support',
        ],
        valueProps: ['Cost-effective solution', 'Reliable service', 'Essential features included'],
        warranty: '30 days',
        responseTime: '24-48 hours',
        additionalServices: [],
        breakdown: {
          laborCost: baseLaborCost,
          materialsCost: baseMaterialsCost,
          travelCost: baseTravelCost,
          overheadCost: baseOverhead,
          profitMargin: 0.15,
          totalCost: baseSubtotal,
          taxRate: baseTaxRate,
          tax: baseTax,
          total: baseTotal,
          suggestedPrice: baseSubtotal / 0.85,
          netProfit: baseSubtotal / 0.85 - baseSubtotal,
        },
      },
      {
        tier: 'standard',
        name: 'Standard Package',
        features: [
          'Enhanced service quality',
          'Premium materials included',
          '90-day warranty',
          'Priority scheduling',
          'Extended support hours',
          'Quality assurance check',
        ],
        valueProps: [
          'Better value for money',
          'Extended warranty',
          'Faster response time',
          'Priority service',
        ],
        warranty: '90 days',
        responseTime: '12-24 hours',
        additionalServices: [
          'Free initial consultation',
          'Follow-up service included',
          'Basic maintenance tips',
        ],
        breakdown: {
          laborCost: baseLaborCost * 1.2,
          materialsCost: baseMaterialsCost * 1.3,
          travelCost: baseTravelCost,
          overheadCost: baseOverhead * 1.2,
          profitMargin: 0.25,
          totalCost:
            baseLaborCost * 1.2 + baseMaterialsCost * 1.3 + baseTravelCost + baseOverhead * 1.2,
          taxRate: baseTaxRate,
          tax:
            (baseLaborCost * 1.2 + baseMaterialsCost * 1.3 + baseTravelCost + baseOverhead * 1.2) *
            baseTaxRate,
          total:
            baseLaborCost * 1.2 +
            baseMaterialsCost * 1.3 +
            baseTravelCost +
            baseOverhead * 1.2 +
            (baseLaborCost * 1.2 + baseMaterialsCost * 1.3 + baseTravelCost + baseOverhead * 1.2) *
              baseTaxRate,
          suggestedPrice:
            (baseLaborCost * 1.2 + baseMaterialsCost * 1.3 + baseTravelCost + baseOverhead * 1.2) /
            0.75,
          netProfit:
            (baseLaborCost * 1.2 + baseMaterialsCost * 1.3 + baseTravelCost + baseOverhead * 1.2) /
              0.75 -
            (baseLaborCost * 1.2 + baseMaterialsCost * 1.3 + baseTravelCost + baseOverhead * 1.2),
        },
      },
      {
        tier: 'premium',
        name: 'Premium Package',
        features: [
          'Premium service quality',
          'High-end materials included',
          '1-year warranty',
          'Priority scheduling',
          '24/7 support',
          'Quality assurance check',
          'Dedicated project manager',
        ],
        valueProps: [
          'Best value proposition',
          'Longest warranty period',
          'Fastest response time',
          'Premium materials',
          'VIP treatment',
        ],
        warranty: '1 year',
        responseTime: '4-12 hours',
        additionalServices: [
          'Free initial consultation',
          'Follow-up service included',
          'Detailed maintenance guide',
          'Priority support line',
          'Free annual check-up',
        ],
        breakdown: {
          laborCost: baseLaborCost * 1.4,
          materialsCost: baseMaterialsCost * 1.6,
          travelCost: baseTravelCost,
          overheadCost: baseOverhead * 1.4,
          profitMargin: 0.35,
          totalCost:
            baseLaborCost * 1.4 + baseMaterialsCost * 1.6 + baseTravelCost + baseOverhead * 1.4,
          taxRate: baseTaxRate,
          tax:
            (baseLaborCost * 1.4 + baseMaterialsCost * 1.6 + baseTravelCost + baseOverhead * 1.4) *
            baseTaxRate,
          total:
            baseLaborCost * 1.4 +
            baseMaterialsCost * 1.6 +
            baseTravelCost +
            baseOverhead * 1.4 +
            (baseLaborCost * 1.4 + baseMaterialsCost * 1.6 + baseTravelCost + baseOverhead * 1.4) *
              baseTaxRate,
          suggestedPrice:
            (baseLaborCost * 1.4 + baseMaterialsCost * 1.6 + baseTravelCost + baseOverhead * 1.4) /
            0.65,
          netProfit:
            (baseLaborCost * 1.4 + baseMaterialsCost * 1.6 + baseTravelCost + baseOverhead * 1.4) /
              0.65 -
            (baseLaborCost * 1.4 + baseMaterialsCost * 1.6 + baseTravelCost + baseOverhead * 1.4),
        },
      },
    ];
  }, [form.hours, form.hourlyRate, form.materialsCost, travelDetails, form.serviceLocation.state]);

  // Update calculateQuoteOptions to ensure it's called when form values change
  useEffect(() => {
    if (form.hours && form.hourlyRate && form.materialsCost) {
      const options = calculateQuoteOptions();
      setQuoteOptions(options);
      setEditableOptions(
        options.map(option => ({
          ...option,
          isEditing: false,
          customPrice: option.breakdown.suggestedPrice,
          customFeatures: [...option.features],
          customWarranty: option.warranty,
          customResponseTime: option.responseTime,
          customAdditionalServices: [...option.additionalServices],
        }))
      );
    }
  }, [form.hours, form.hourlyRate, form.materialsCost, travelDetails]);

  // Calculate preview values based on selected quote option
  const selectedOption = quoteOptions.find(opt => opt.tier === selectedQuoteOption);
  const previewBreakdown = selectedOption?.breakdown || {
    laborCost: form.hours * form.hourlyRate,
    materialsCost: form.materialsCost,
    travelCost: travelDetails?.travelCost || 0,
    overheadCost: form.hours * form.hourlyRate * 0.15,
    totalCost:
      form.hours * form.hourlyRate +
      form.materialsCost +
      (travelDetails?.travelCost || 0) +
      form.hours * form.hourlyRate * 0.15,
    taxRate: getTaxRateForState(form.serviceLocation.state),
    tax:
      (form.hours * form.hourlyRate +
        form.materialsCost +
        (travelDetails?.travelCost || 0) +
        form.hours * form.hourlyRate * 0.15) *
      getTaxRateForState(form.serviceLocation.state),
    total:
      (form.hours * form.hourlyRate +
        form.materialsCost +
        (travelDetails?.travelCost || 0) +
        form.hours * form.hourlyRate * 0.15) *
      (1 + getTaxRateForState(form.serviceLocation.state)),
  };

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]:
        name === 'hours' || name === 'hourlyRate' || name === 'materialsCost'
          ? parseFloat(value)
          : value,
    }));
  }

  function handleServiceLocationChange(
    address: string,
    lat: number,
    lng: number,
    city?: string,
    state?: string,
    zipCode?: string
  ) {
    console.log('[QuoteGenerator] Service Location Changed:', {
      address,
      lat,
      lng,
      city,
      state,
      zipCode,
    });
    setForm(prev => ({
      ...prev,
      serviceLocation: {
        address,
        latitude: lat,
        longitude: lng,
        city,
        state,
        zipCode,
      },
    }));
  }

  function handleContractorLocationChange(
    address: string,
    lat: number,
    lng: number,
    city?: string,
    state?: string,
    zipCode?: string
  ) {
    console.log('[QuoteGenerator] Contractor Location Changed:', {
      address,
      lat,
      lng,
      city,
      state,
      zipCode,
    });
    setForm(prev => ({
      ...prev,
      contractorLocation: {
        address,
        latitude: lat,
        longitude: lng,
        city,
        state,
        zipCode,
      },
    }));
  }

  function handleServiceTypeChange(value: string) {
    setForm(prev => ({
      ...prev,
      serviceType: value,
    }));
  }

  const handleSave = () => {
    if (!selectedQuoteOption) {
      toast({
        title: 'Error',
        description: 'Please select a quote option',
        variant: 'destructive',
      });
      return;
    }

    if (!form.serviceLocation.latitude || !form.contractorLocation.latitude) {
      toast({
        title: 'Error',
        description: 'Please enter valid service and contractor locations',
        variant: 'destructive',
      });
      return;
    }

    if (!form.serviceType) {
      toast({
        title: 'Error',
        description: 'Please select a service type',
        variant: 'destructive',
      });
      return;
    }

    if (!form.jobDescription) {
      toast({
        title: 'Error',
        description: 'Please enter a job description',
        variant: 'destructive',
      });
      return;
    }

    if (!form.hours || !form.hourlyRate || !form.materialsCost) {
      toast({
        title: 'Error',
        description: 'Please fill in all cost details (hours, rate, materials)',
        variant: 'destructive',
      });
      return;
    }

    const selectedOption = quoteOptions.find(opt => opt.tier === selectedQuoteOption);
    if (!selectedOption) {
      toast({
        title: 'Error',
        description: 'Selected quote option not found',
        variant: 'destructive',
      });
      return;
    }

    const quote = {
      serviceType: form.serviceType,
      jobDescription: form.jobDescription,
      hours: form.hours,
      hourlyRate: form.hourlyRate,
      materialsCost: form.materialsCost,
      serviceTier: selectedOption.tier,
      serviceLocation: form.serviceLocation,
      contractorLocation: form.contractorLocation,
      travelDetails: {
        distance: travelDetails?.distance || 0,
        duration: travelDetails?.duration || 0,
        durationInTraffic: travelDetails?.durationInTraffic || 0,
        travelCost: travelDetails?.travelCost || 0,
        marketAnalysis: travelDetails?.marketAnalysis || null,
      },
      price: selectedOption.breakdown.suggestedPrice,
      features: selectedOption.features,
      valueProps: selectedOption.valueProps,
      warranty: selectedOption.warranty,
      responseTime: selectedOption.responseTime,
      additionalServices: selectedOption.additionalServices,
      breakdown: selectedOption.breakdown,
      customerContact: {
        email: form.customerEmail,
        phone: form.customerPhone,
        preferredMethod: form.preferredContactMethod,
      },
      createdAt: new Date().toISOString(),
      status: 'draft',
    };

    try {
      onSave(quote);
      toast({
        title: 'Quote saved successfully',
        description: 'The quote has been saved.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        title: 'Error',
        description: 'Failed to save quote. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditOption = (tier: string) => {
    setEditableOptions(prev =>
      prev.map(option => ({
        ...option,
        isEditing: option.tier === tier,
      }))
    );
    setIsEditing(true);
  };

  const handleSaveEdit = (tier: string) => {
    setEditableOptions(prev =>
      prev.map(option => {
        if (option.tier === tier) {
          const updatedOption = {
            ...option,
            isEditing: false,
            breakdown: {
              ...option.breakdown,
              suggestedPrice: option.customPrice || option.breakdown.suggestedPrice,
              netProfit:
                (option.customPrice || option.breakdown.suggestedPrice) -
                option.breakdown.totalCost,
            },
            features: option.customFeatures || option.features,
            warranty: option.customWarranty || option.warranty,
            responseTime: option.customResponseTime || option.responseTime,
            additionalServices: option.customAdditionalServices || option.additionalServices,
          };
          return updatedOption;
        }
        return option;
      })
    );
    setIsEditing(false);
  };

  const handleCancelEdit = (tier: string) => {
    setEditableOptions(prev =>
      prev.map(option => ({
        ...option,
        isEditing: false,
        customPrice: option.breakdown.suggestedPrice,
        customFeatures: [...option.features],
        customWarranty: option.warranty,
        customResponseTime: option.responseTime,
        customAdditionalServices: [...option.additionalServices],
      }))
    );
    setIsEditing(false);
  };

  const handleOptionChange = (tier: string, field: string, value: any) => {
    setEditableOptions(prev =>
      prev.map(option => {
        if (option.tier === tier) {
          return {
            ...option,
            [field]: value,
          };
        }
        return option;
      })
    );
  };

  const handleCustomerContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendQuote = async (method: 'email' | 'sms', contact: string) => {
    if (!selectedQuoteOption) return;

    const selectedOption = quoteOptions.find(opt => opt.tier === selectedQuoteOption);
    if (!selectedOption) return;

    try {
      // Here you would typically make an API call to your backend to send the quote
      const response = await fetch('/api/send-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          contact,
          quote: {
            ...selectedOption,
            customerEmail: form.customerEmail,
            customerPhone: form.customerPhone,
            serviceType: form.serviceType,
            jobDescription: form.jobDescription,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to send quote');

      toast({
        title: 'Quote sent successfully',
        description: `Quote sent successfully via ${method.toUpperCase()}`,
        variant: 'success',
      });
      setIsSendDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send quote. Please try again.',
        variant: 'destructive',
      });
      console.error('Error sending quote:', error);
    }
  };

  return (
    <div className="h-full min-h-screen bg-transparent dark:bg-gray-950">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form Section */}
        <div className="rounded-lg border bg-white p-4 shadow-md dark:border-gray-900 dark:bg-gray-900 lg:p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            Quote Generator
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="serviceType" className="mb-1 block text-sm font-medium text-gray-700">
                Service Type
              </label>
              <Select value={form.serviceType} onValueChange={handleServiceTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a service type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(_categorizedServices).map(([category, services]) => (
                    <React.Fragment key={category}>
                      <SelectItem
                        value={category}
                        disabled
                        className="bg-gray-50 font-semibold text-gray-900"
                      >
                        {category}
                      </SelectItem>
                      {services.map(service => (
                        <SelectItem key={service.value} value={service.value} className="pl-6">
                          {service.label}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="jobDescription"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Job Description
              </label>
              <textarea
                id="jobDescription"
                className="w-full rounded border p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                name="jobDescription"
                placeholder="Job Description"
                value={form.jobDescription}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="hours" className="mb-1 block text-sm font-medium text-gray-700">
                Hours
              </label>
              <input
                id="hours"
                className="w-full rounded border p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                name="hours"
                type="number"
                min={0}
                step={0.5}
                value={form.hours}
                onChange={handleChange}
                placeholder="Hours"
              />
            </div>

            <div>
              <label htmlFor="hourlyRate" className="mb-1 block text-sm font-medium text-gray-700">
                Hourly Rate
              </label>
              <input
                id="hourlyRate"
                className="w-full rounded border p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                name="hourlyRate"
                type="number"
                min={0}
                value={form.hourlyRate}
                onChange={handleChange}
                placeholder="Hourly Rate"
              />
            </div>

            <div>
              <label
                htmlFor="materialsCost"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Materials Cost
              </label>
              <input
                id="materialsCost"
                className="w-full rounded border p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                name="materialsCost"
                type="number"
                min={0}
                value={form.materialsCost}
                onChange={handleChange}
                placeholder="Materials Cost"
              />
            </div>

            <div>
              <label
                htmlFor="addressFormat"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Address Format
              </label>
              <select
                id="addressFormat"
                className="w-full rounded border p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                name="addressFormat"
                value={form.addressFormat}
                onChange={handleChange}
              >
                <option value="full">Full Address</option>
                <option value="short">City, State</option>
                <option value="city-state">City, State ZIP</option>
                <option value="coordinates">Coordinates</option>
              </select>
            </div>

            <AddressInput
              id="serviceLocation"
              label="Service Location"
              value={form.serviceLocation.address}
              onChange={handleServiceLocationChange}
              placeholder="Enter service address..."
              required
              error={
                !form.serviceLocation.address && form.serviceLocation.latitude === 0
                  ? 'Service location is required'
                  : undefined
              }
              addressFormat={form.addressFormat}
            />

            <AddressInput
              id="contractorLocation"
              label="Contractor Location"
              value={form.contractorLocation.address}
              onChange={handleContractorLocationChange}
              placeholder="Enter contractor address..."
              required
              error={
                !form.contractorLocation.address && form.contractorLocation.latitude === 0
                  ? 'Contractor location is required'
                  : undefined
              }
              addressFormat={form.addressFormat}
            />
          </div>

          {/* Quote Options */}
          <div className="mt-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Quote Options</h3>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? 'Done Editing' : 'Customize Quotes'}
              </Button>
            </div>

            <RadioGroup
              value={selectedQuoteOption || ''}
              onValueChange={value =>
                setSelectedQuoteOption(value as 'basic' | 'standard' | 'premium')
              }
              className="w-full overflow-x-auto"
            >
              <div className="grid w-full min-w-[1024px] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {editableOptions.map(option => (
                  <div
                    key={option.tier}
                    className={`flex w-full min-w-[340px] flex-1 flex-col rounded-xl border p-8 transition-all duration-200 ${
                      selectedQuoteOption === option.tier
                        ? 'scale-[1.02] border-blue-500 bg-blue-50 shadow-xl'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                    }`}
                  >
                    <div className="mb-8 flex items-center justify-between">
                      <h4 className="text-2xl font-semibold capitalize">{option.tier} Package</h4>
                      <RadioGroupItem value={option.tier} id={option.tier} className="h-6 w-6" />
                    </div>

                    {option.isEditing ? (
                      <div className="space-y-8">
                        <div>
                          <label
                            htmlFor={`${option.tier}-price`}
                            className="mb-3 block text-lg font-medium"
                          >
                            Custom Price
                          </label>
                          <input
                            id={`${option.tier}-price`}
                            type="number"
                            value={option.customPrice}
                            onChange={e =>
                              handleOptionChange(
                                option.tier,
                                'customPrice',
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-full rounded-lg border p-4 text-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter custom price"
                            aria-label="Custom price"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`${option.tier}-features`}
                            className="mb-3 block text-lg font-medium"
                          >
                            Features
                          </label>
                          <textarea
                            id={`${option.tier}-features`}
                            value={option.customFeatures?.join('\n')}
                            onChange={e =>
                              handleOptionChange(
                                option.tier,
                                'customFeatures',
                                e.target.value.split('\n')
                              )
                            }
                            className="min-h-[160px] w-full rounded-lg border p-4 text-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter features (one per line)"
                            aria-label="Custom features"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`${option.tier}-warranty`}
                            className="mb-3 block text-lg font-medium"
                          >
                            Warranty
                          </label>
                          <input
                            id={`${option.tier}-warranty`}
                            type="text"
                            value={option.customWarranty}
                            onChange={e =>
                              handleOptionChange(option.tier, 'customWarranty', e.target.value)
                            }
                            className="w-full rounded-lg border p-4 text-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter warranty period"
                            aria-label="Custom warranty"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`${option.tier}-response-time`}
                            className="mb-3 block text-lg font-medium"
                          >
                            Response Time
                          </label>
                          <input
                            id={`${option.tier}-response-time`}
                            type="text"
                            value={option.customResponseTime}
                            onChange={e =>
                              handleOptionChange(option.tier, 'customResponseTime', e.target.value)
                            }
                            className="w-full rounded-lg border p-4 text-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter response time"
                            aria-label="Custom response time"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`${option.tier}-additional-services`}
                            className="mb-3 block text-lg font-medium"
                          >
                            Additional Services
                          </label>
                          <textarea
                            id={`${option.tier}-additional-services`}
                            value={option.customAdditionalServices?.join('\n')}
                            onChange={e =>
                              handleOptionChange(
                                option.tier,
                                'customAdditionalServices',
                                e.target.value.split('\n')
                              )
                            }
                            className="min-h-[160px] w-full rounded-lg border p-4 text-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter additional services (one per line)"
                            aria-label="Custom additional services"
                          />
                        </div>

                        <div className="flex justify-end gap-4 pt-6">
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => handleCancelEdit(option.tier)}
                          >
                            Cancel
                          </Button>
                          <Button size="lg" onClick={() => handleSaveEdit(option.tier)}>
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-8 space-y-6">
                          <p className="text-4xl font-bold text-blue-600">
                            ${option.breakdown.suggestedPrice.toFixed(2)}
                          </p>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
                              <p className="mb-2 text-sm text-gray-600">Response Time</p>
                              <p className="text-lg font-medium">{option.responseTime}</p>
                            </div>
                            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
                              <p className="mb-2 text-sm text-gray-600">Warranty</p>
                              <p className="text-lg font-medium">{option.warranty}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-8 space-y-6">
                          <h5 className="text-xl font-semibold text-gray-900">Cost Breakdown:</h5>
                          <div className="space-y-3 text-base">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Labor:</span>
                              <span>${option.breakdown.laborCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Materials:</span>
                              <span>${option.breakdown.materialsCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Travel:</span>
                              <span>${option.breakdown.travelCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Overhead:</span>
                              <span>${option.breakdown.overheadCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-3 font-medium">
                              <span>Total Cost:</span>
                              <span>${option.breakdown.totalCost.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-8 space-y-6">
                          <h5 className="text-xl font-semibold text-gray-900">Profit Analysis:</h5>
                          <div className="space-y-3 text-base">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Profit Margin:</span>
                              <span>{(option.breakdown.profitMargin * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Net Profit:</span>
                              <span>${option.breakdown.netProfit.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h5 className="text-xl font-semibold text-gray-900">Features:</h5>
                          <ul className="space-y-4">
                            {option.features.map((feature, index) => (
                              <li key={index} className="flex items-start">
                                <Check className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-green-500" />
                                <span className="text-lg text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {option.additionalServices.length > 0 && (
                          <div className="mt-8 space-y-6">
                            <h5 className="text-xl font-semibold text-gray-900">
                              Additional Services:
                            </h5>
                            <ul className="space-y-4">
                              {option.additionalServices.map((service, index) => (
                                <li key={index} className="flex items-start">
                                  <Plus className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-blue-500" />
                                  <span className="text-lg text-gray-700">{service}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-10 flex justify-between">
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => handleEditOption(option.tier)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="lg"
                            onClick={() => {
                              setSelectedQuoteOption(option.tier);
                              setIsSendDialogOpen(true);
                            }}
                          >
                            Send to Customer
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Customer Contact Information</h3>

            <div>
              <label
                htmlFor="customerEmail"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="customerEmail"
                name="customerEmail"
                type="email"
                value={form.customerEmail}
                onChange={handleCustomerContactChange}
                className="w-full rounded border p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="customerPhone"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                value={form.customerPhone}
                onChange={handleCustomerContactChange}
                className="w-full rounded border p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 555-5555"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Preferred Contact Method
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="preferredContactMethod"
                    value="email"
                    checked={form.preferredContactMethod === 'email'}
                    onChange={handleCustomerContactChange}
                    className="mr-2"
                  />
                  Email
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="preferredContactMethod"
                    value="sms"
                    checked={form.preferredContactMethod === 'sms'}
                    onChange={handleCustomerContactChange}
                    className="mr-2"
                  />
                  SMS
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Quote Preview</h3>
            <div className="space-y-1">
              <div>Labor: {formatCurrency(previewBreakdown.laborCost)}</div>
              <div>Materials: {formatCurrency(previewBreakdown.materialsCost)}</div>
              {travelDetails && (
                <>
                  <div>
                    Travel: {formatCurrency(previewBreakdown.travelCost)} (
                    {travelDetails.distance.toFixed(2)} km)
                  </div>
                  <div className="text-sm text-gray-600">
                    Estimated time: {Math.round(travelDetails.duration)} min
                    {travelDetails.durationInTraffic && (
                      <> (with traffic: {Math.round(travelDetails.durationInTraffic)} min)</>
                    )}
                  </div>
                  {travelDetails.marketAnalysis && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="mb-2 font-medium">Market Analysis</h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-gray-600">Average Market Price:</span>{' '}
                          {formatCurrency(travelDetails.marketAnalysis.averagePrice)}
                        </div>
                        <div>
                          <span className="text-gray-600">Price Range:</span>{' '}
                          {formatCurrency(travelDetails.marketAnalysis.priceRange.min)} -{' '}
                          {formatCurrency(travelDetails.marketAnalysis.priceRange.max)}
                        </div>
                        <div>
                          <span className="text-gray-600">Competition Level:</span>{' '}
                          <span className="capitalize">
                            {travelDetails.marketAnalysis.competitionLevel}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Suggested Price:</span>{' '}
                          <span className="font-medium text-green-600">
                            {formatCurrency(travelDetails.suggestedPrice || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Potential Profit Margin:</span>{' '}
                          <span className="font-medium text-green-600">
                            {travelDetails.marketAnalysis.profitMargin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div>Subtotal: {formatCurrency(previewBreakdown.totalCost)}</div>
              <div>Tax: {formatCurrency(previewBreakdown.tax)}</div>
              <div className="font-bold">Total: {formatCurrency(previewBreakdown.total)}</div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.serviceLocation || !form.contractorLocation || !selectedQuoteOption}
            >
              Save Quote
            </Button>
          </div>

          {error && <div className="mt-4 text-red-600">{error}</div>}

          {quote && (
            <div className="mt-4 rounded bg-green-50 p-4">
              <div className="font-bold">Quote Saved!</div>
              <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(quote, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Map Preview Section */}
        <div className="rounded-lg border bg-white p-4 shadow-md dark:border-gray-900 dark:bg-gray-900 lg:p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            Location Preview
          </h2>
          <div className="mb-4 aspect-[4/3] w-full">
            <LocationMap
              serviceLocation={form.serviceLocation}
              contractorLocation={form.contractorLocation}
              className="h-full w-full rounded-lg"
            />
          </div>
          {form.serviceLocation.latitude && form.contractorLocation.latitude ? (
            travelDetails ? (
              <div className="mt-4 rounded bg-gray-50 p-4 pt-10 dark:bg-gray-800">
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                  Travel Details
                </h3>
                <div className="space-y-2 text-gray-800 dark:text-gray-200">
                  <div>
                    <span className="font-medium">Distance:</span>{' '}
                    {travelDetails.distance.toFixed(2)} km
                  </div>
                  <div>
                    <span className="font-medium">Travel Cost:</span>{' '}
                    {formatCurrency(travelDetails.travelCost)}
                  </div>
                  <div>
                    <span className="font-medium">Estimated Time:</span>{' '}
                    {Math.round(travelDetails.duration)} min
                    {travelDetails.durationInTraffic && (
                      <> (with traffic: {Math.round(travelDetails.durationInTraffic)} min)</>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded bg-gray-50 p-4 pt-10 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Calculating travel details...
              </div>
            )
          ) : (
            <div className="mt-4 rounded bg-gray-50 p-4 pt-10 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Enter both addresses to see travel details.
            </div>
          )}
        </div>
      </div>

      <SendQuoteDialog
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        selectedQuote={quoteOptions.find(opt => opt.tier === selectedQuoteOption) || null}
        customerEmail={form.customerEmail}
        customerPhone={form.customerPhone}
        preferredContactMethod={form.preferredContactMethod}
        onSend={handleSendQuote}
      />
    </div>
  );
};

export default QuoteGenerator;
