'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import {} from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Loader2,
  User,
  Building2,
  Target,
  Settings,
  CreditCard,
  Bell,
  Shield,
  Lock,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Award,
  TrendingUp,
  Users,
  Briefcase,
  Star,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface UserProfile {
  userId: string;
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    website?: string;
    avatar?: string;
  };
  businessInfo: {
    companyName?: string;
    industry?: string;
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
    targetMargin: number;
    businessGoals: string[];
    businessChallenges: string[];
    servicePreferences: string[];
    companyLogoUrl?: string;
  };
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'trial';
    validUntil?: string;
    features: string[];
  };
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private';
      showContactInfo: boolean;
      showBusinessInfo: boolean;
    };
  };
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  const { data: profile, isLoading, refetch } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    },
  });

  useEffect(() => {
    const url = profile?.businessInfo?.companyLogoUrl;
    if (url) setLogoUrl(url);
  }, [profile?.businessInfo?.companyLogoUrl]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        throw new Error('Failed to save profile');
      }
      toast({ title: 'Profile updated', description: 'Changes saved successfully.' });
      await refetch();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
    setIsEditing(false);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('logo', file);
    setLogoUploading(true);
    try {
      const res = await fetch('/api/user/upload-logo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setLogoUrl(data.url);
        // Update profile state
        if (profile) {
          profile.businessInfo.companyLogoUrl = data.url;
        }
      }
    } catch (err) {
      console.error('Failed to upload logo:', err);
      toast({ title: 'Upload failed', description: 'Could not upload company logo.', variant: 'destructive' });
    } finally {
      setLogoUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-300" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 py-6 pt-16 sm:pt-0">
      <div className="flex flex-col items-start justify-between gap-4 pb-8 pt-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-200">
            Manage your personal and business information
          </p>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={profile?.subscription.status === 'active' ? 'default' : 'secondary'}>
                {profile?.subscription.plan.toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-300">
                {profile?.subscription.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            {profile?.subscription.validUntil && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Valid until {new Date(profile.subscription.validUntil).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Experience Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-gray-500 dark:text-gray-300" />
              <span className="capitalize">{profile?.businessInfo.experienceLevel}</span>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
              Target Margin: {profile?.businessInfo.targetMargin}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Business Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile?.businessInfo.businessGoals.map(goal => (
                <Badge key={goal} variant="secondary">
                  {goal.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="personal">
            <User className="mr-2 h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="business">
            <Building2 className="mr-2 h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.personalInfo.avatar} />
                  <AvatarFallback>
                    {profile?.personalInfo.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={profile?.personalInfo.name} disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.personalInfo.email}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile?.personalInfo.phone}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profile?.personalInfo.website}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={profile?.personalInfo.address}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Information</CardTitle>
              <CardDescription>Your company details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Company Logo"
                        className="h-full w-full object-cover"
                        width={96}
                        height={96}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <Building2 className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    {isEditing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={logoUploading}
                        >
                          {logoUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Change Logo'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={profile?.businessInfo.companyName || ''}
                      onChange={e => {
                        if (profile) {
                          profile.businessInfo.companyName = e.target.value;
                        }
                      }}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload company logo"
                  title="Upload company logo"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={profile?.businessInfo.industry}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select value={profile?.businessInfo.experienceLevel} disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margin">Target Margin (%)</Label>
                  <Input
                    id="margin"
                    type="number"
                    value={profile?.businessInfo.targetMargin}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Business Goals</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {profile?.businessInfo.businessGoals.map(goal => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Switch id={goal} checked={true} disabled={!isEditing} />
                      <Label htmlFor={goal} className="capitalize">
                        {goal.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Service Preferences</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {profile?.businessInfo.servicePreferences.map(pref => (
                    <div key={pref} className="flex items-center space-x-2">
                      <Switch id={pref} checked={true} disabled={!isEditing} />
                      <Label htmlFor={pref} className="capitalize">
                        {pref.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>View and manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Current Plan</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg">
                      {profile?.subscription.plan.toUpperCase()}
                    </Badge>
                    <Badge
                      variant={profile?.subscription.status === 'active' ? 'default' : 'secondary'}
                    >
                      {profile?.subscription.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-300">
                    <Calendar className="h-4 w-4" />
                    {profile?.subscription.validUntil
                      ? new Date(profile.subscription.validUntil).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Plan Features</h3>
                <div className="grid gap-4">
                  {profile?.subscription.features.map(feature => (
                    <div key={feature} className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline">Upgrade Plan</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {Object.entries(profile?.preferences.notifications || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="capitalize">{key}</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Receive {key} notifications
                      </p>
                    </div>
                    <Switch checked={value} disabled={!isEditing} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control your profile visibility and information sharing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Control who can see your profile
                    </p>
                  </div>
                  <Select
                    value={profile?.preferences.privacy.profileVisibility}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Contact Information</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Show contact information on profile
                    </p>
                  </div>
                  <Switch
                    checked={profile?.preferences.privacy.showContactInfo}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Business Information</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Show business details on profile
                    </p>
                  </div>
                  <Switch
                    checked={profile?.preferences.privacy.showBusinessInfo}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
