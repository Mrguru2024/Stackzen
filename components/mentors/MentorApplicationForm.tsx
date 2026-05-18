'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui';
import { useToast } from '@/components/ui/use-toast';
import { MentorDocumentUpload } from '@/components/mentors/MentorDocumentUpload';
import { CheckCircle, Loader2 } from 'lucide-react';

const TOTAL_STEPS = 5;

const specialties = [
  'Retirement Planning',
  'Debt Management',
  'Investment Strategy',
  'Budgeting',
  'Tax Planning',
  'Estate Planning',
  'Business Finance',
  'Credit Building',
  'Portfolio Management',
  'Cash Flow Management',
  'Insurance Planning',
  'Financial Goal Setting',
];

const credentials = [
  'CFP (Certified Financial Planner)',
  'CFA (Chartered Financial Analyst)',
  'CPA (Certified Public Accountant)',
  'Series 65',
  'Series 7',
  'Series 63',
  'ChFC (Chartered Financial Consultant)',
  'CLU (Chartered Life Underwriter)',
  'MBA Finance',
  'PhD Finance',
  'Credit Counselor',
  'Other',
];

export default function MentorApplicationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    specialties: [] as string[],
    credentials: [] as string[],
    licenseNumber: '',
    licenseType: '',
    yearsOfExperience: '',
    hourlyRate: '',
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    languages: [] as string[],
    headshotUrl: '',
    licenseUrl: '',
    idUrl: '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleCredentialToggle = (credential: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: prev.credentials.includes(credential)
        ? prev.credentials.filter(c => c !== credential)
        : [...prev.credentials, credential],
    }));
  };

  const handleAvailabilityToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: !prev.availability[day as keyof typeof prev.availability],
      },
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language],
    }));
  };

  const documentsComplete = useMemo(
    () =>
      Boolean(formData.headshotUrl && formData.licenseUrl && formData.idUrl),
    [formData.headshotUrl, formData.licenseUrl, formData.idUrl]
  );

  const handleSubmit = async () => {
    if (!documentsComplete) {
      toast({
        title: 'Documents required',
        description: 'Upload headshot, license, and ID before submitting.',
        variant: 'destructive',
      });
      setStep(4);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          yearsOfExperience: Number(formData.yearsOfExperience),
          hourlyRate: Number(formData.hourlyRate),
          availability: Object.entries(formData.availability)
            .filter(([, available]) => available)
            .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1)),
        }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to submit application');
      }

      setSubmitted(true);
      toast({
        title: 'Application submitted',
        description: 'We will review your credentials and notify you when approved.',
      });
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg border-primary/30">
        <CardContent className="space-y-4 p-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-primary" />
          <h2 className="text-2xl font-bold">Application received</h2>
          <p className="text-muted-foreground">
            Our team will vet your documents and credentials. You can track status anytime in your
            mentor hub.
          </p>
          <Button onClick={() => router.push('/mentor-portal/dashboard')}>Go to mentor portal</Button>
        </CardContent>
      </Card>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Basic Information</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Tell us about yourself and your expertise
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            placeholder="Your full name as it will appear to clients"
          />
        </div>

        <div>
          <Label htmlFor="bio">Professional Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={e => handleInputChange('bio', e.target.value)}
            placeholder="Tell potential clients about your background, expertise, and approach to financial planning..."
            rows={4}
          />
        </div>

        <div>
          <Label>Years of Experience</Label>
          <Input
            type="number"
            value={formData.yearsOfExperience}
            onChange={e => handleInputChange('yearsOfExperience', e.target.value)}
            placeholder="How many years have you been working in finance?"
            min="0"
          />
        </div>

        <div>
          <Label>Hourly Rate (USD)</Label>
          <Input
            type="number"
            value={formData.hourlyRate}
            onChange={e => handleInputChange('hourlyRate', e.target.value)}
            placeholder="Your preferred hourly rate for direct bookings"
            min="50"
            step="25"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" disabled>
          Previous
        </Button>
        <Button onClick={() => setStep(2)} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Specialties & Credentials</h2>
        <p className="text-gray-600 dark:text-gray-300">What areas do you specialize in?</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label>Specialties (Select all that apply)</Label>
          <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3">
            {specialties.map(specialty => (
              <div
                key={specialty}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  formData.specialties.includes(specialty)
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSpecialtyToggle(specialty)}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`h-4 w-4 ${
                      formData.specialties.includes(specialty) ? 'text-primary' : 'text-gray-400'
                    }`}
                  />
                  <span className="text-sm">{specialty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Professional Credentials (Select all that apply)</Label>
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            {credentials.map(credential => (
              <div
                key={credential}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  formData.credentials.includes(credential)
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleCredentialToggle(credential)}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`h-4 w-4 ${
                      formData.credentials.includes(credential) ? 'text-primary' : 'text-gray-400'
                    }`}
                  />
                  <span className="text-sm">{credential}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="licenseNumber">License Number (if applicable)</Label>
            <Input
              id="licenseNumber"
              value={formData.licenseNumber}
              onChange={e => handleInputChange('licenseNumber', e.target.value)}
              placeholder="e.g., 123456789"
            />
          </div>
          <div>
            <Label htmlFor="licenseType">License Type</Label>
            <Input
              id="licenseType"
              value={formData.licenseType}
              onChange={e => handleInputChange('licenseType', e.target.value)}
              placeholder="e.g., Series 65, CFP, etc."
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => setStep(1)}>
          Previous
        </Button>
        <Button onClick={() => setStep(3)} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Availability & Languages</h2>
        <p className="text-gray-600 dark:text-gray-300">When are you available for sessions?</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label>Availability (Select your available days)</Label>
          <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(formData.availability).map(([day, available]) => (
              <div
                key={day}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  available
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleAvailabilityToggle(day)}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`h-4 w-4 ${available ? 'text-primary' : 'text-gray-400'}`}
                  />
                  <span className="text-sm capitalize">{day}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Languages (Select all that apply)</Label>
          <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              'English',
              'Spanish',
              'French',
              'German',
              'Mandarin',
              'Japanese',
              'Korean',
              'Arabic',
              'Portuguese',
              'Italian',
            ].map(language => (
              <div
                key={language}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  formData.languages.includes(language)
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleLanguageToggle(language)}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`h-4 w-4 ${
                      formData.languages.includes(language) ? 'text-primary' : 'text-gray-400'
                    }`}
                  />
                  <span className="text-sm">{language}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => setStep(2)}>
          Previous
        </Button>
        <Button onClick={() => setStep(4)} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Verification documents</h2>
        <p className="text-muted-foreground">
          Required for vetting. Files are reviewed by StackZen admins only.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-1">
        <MentorDocumentUpload
          kind="headshot"
          mode="application"
          currentUrl={formData.headshotUrl}
          onUploaded={url => handleInputChange('headshotUrl', url)}
        />
        <MentorDocumentUpload
          kind="license"
          mode="application"
          currentUrl={formData.licenseUrl}
          onUploaded={url => handleInputChange('licenseUrl', url)}
        />
        <MentorDocumentUpload
          kind="id"
          mode="application"
          currentUrl={formData.idUrl}
          onUploaded={url => handleInputChange('idUrl', url)}
        />
      </div>
      {!documentsComplete ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          All three documents are required before you can submit.
        </p>
      ) : null}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => setStep(3)}>
          Previous
        </Button>
        <Button onClick={() => setStep(5)} className="flex-1" disabled={!documentsComplete}>
          Continue
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Review & Submit</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Review your application before submitting
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Basic Information</h3>
              <p>
                <strong>Name:</strong> {formData.name}
              </p>
              <p>
                <strong>Experience:</strong> {formData.yearsOfExperience} years
              </p>
              <p>
                <strong>Rate:</strong> ${formData.hourlyRate}/hr
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {formData.specialties.map(s => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Credentials</h3>
              <div className="flex flex-wrap gap-2">
                {formData.credentials.map(c => (
                  <Badge key={c} variant="outline">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Availability</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(formData.availability)
                  .filter(([_, available]) => available)
                  .map(([day, _]) => (
                    <Badge key={day} variant="outline">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Badge>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {formData.languages.map(l => (
                  <Badge key={l} variant="outline">
                    {l}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => setStep(4)}>
          Previous
        </Button>
        <Button onClick={() => void handleSubmit()} className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Submit Application
        </Button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(stepNumber => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step >= stepNumber ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < TOTAL_STEPS && (
                <div
                  className={`mx-2 h-1 w-16 ${step > stepNumber ? 'bg-primary' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Basic</span>
          <span>Expertise</span>
          <span>Schedule</span>
          <span>Documents</span>
          <span>Review</span>
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
    </div>
  );
}
