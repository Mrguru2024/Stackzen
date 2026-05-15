import React from 'react';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { ServicesPage } from '@/components/services/services-page';
import { CreateServiceModal } from '@/components/services/create-service-modal';

export const metadata: Metadata = {
  title: 'Services | StackZen',
  description: 'Manage your services and offerings',
};

const categories = [
  {
    group: 'Professional Services',
    items: [
      { value: 'web-development', label: 'Web Development' },
      { value: 'mobile-development', label: 'Mobile Development' },
      { value: 'ui-ux-design', label: 'UI/UX Design' },
      { value: 'graphic-design', label: 'Graphic Design' },
      { value: 'content-writing', label: 'Content Writing' },
      { value: 'technical-writing', label: 'Technical Writing' },
      { value: 'digital-marketing', label: 'Digital Marketing' },
      { value: 'seo', label: 'SEO' },
      { value: 'social-media', label: 'Social Media Management' },
      { value: 'data-analysis', label: 'Data Analysis' },
      { value: 'database-design', label: 'Database Design' },
      { value: 'devops', label: 'DevOps' },
      { value: 'quality-assurance', label: 'Quality Assurance' },
      { value: 'project-management', label: 'Project Management' },
      { value: 'business-consulting', label: 'Business Consulting' },
      { value: 'ai-ml', label: 'AI & Machine Learning' },
      { value: 'blockchain', label: 'Blockchain Development' },
      { value: 'cybersecurity', label: 'Cybersecurity' },
      { value: 'cloud-services', label: 'Cloud Services' },
      { value: 'system-architecture', label: 'System Architecture' },
    ],
  },
  {
    group: 'Home Services',
    items: [
      { value: 'locksmith', label: 'Locksmith' },
      { value: 'plumbing', label: 'Plumbing' },
      { value: 'electrical', label: 'Electrical' },
      { value: 'cleaning', label: 'Cleaning' },
      { value: 'gardening', label: 'Gardening' },
      { value: 'painting', label: 'Painting' },
      { value: 'carpentry', label: 'Carpentry' },
    ],
  },
  {
    group: 'Automotive Services',
    items: [
      { value: 'mechanic', label: 'Mechanic' },
      { value: 'detailing', label: 'Car Detailing' },
      { value: 'towing', label: 'Towing' },
      { value: 'auto-body', label: 'Auto Body Repair' },
    ],
  },
  {
    group: 'Beauty & Wellness',
    items: [
      { value: 'hair-styling', label: 'Hair Styling' },
      { value: 'makeup', label: 'Makeup' },
      { value: 'facial-treatment', label: 'Facial Treatment' },
      { value: 'skin-care', label: 'Skin Care' },
      { value: 'microdermabrasion', label: 'Microdermabrasion' },
      { value: 'chemical-peel', label: 'Chemical Peel' },
      { value: 'dermaplaning', label: 'Dermaplaning' },
      { value: 'acne-treatment', label: 'Acne Treatment' },
      { value: 'anti-aging', label: 'Anti-Aging Treatment' },
      { value: 'led-therapy', label: 'LED Light Therapy' },
      { value: 'skin-rejuvenation', label: 'Skin Rejuvenation' },
      { value: 'waxing', label: 'Waxing Services' },
      { value: 'eyebrow-shaping', label: 'Eyebrow Shaping' },
      { value: 'eyelash-extension', label: 'Eyelash Extension' },
      { value: 'body-treatment', label: 'Body Treatment' },
      { value: 'spray-tanning', label: 'Spray Tanning' },
      { value: 'skin-consultation', label: 'Skin Consultation' },
    ],
  },
  {
    group: 'Education & Tutoring',
    items: [
      { value: 'academic-tutoring', label: 'Academic Tutoring' },
      { value: 'language-learning', label: 'Language Learning' },
      { value: 'music-lessons', label: 'Music Lessons' },
      { value: 'art-classes', label: 'Art Classes' },
      { value: 'test-preparation', label: 'Test Preparation' },
    ],
  },
  {
    group: 'Event Services',
    items: [
      { value: 'event-planning', label: 'Event Planning' },
      { value: 'catering', label: 'Catering' },
      { value: 'photography', label: 'Photography' },
      { value: 'videography', label: 'Videography' },
      { value: 'dj', label: 'DJ Services' },
    ],
  },
  {
    group: 'Other Services',
    items: [
      { value: 'pet-care', label: 'Pet Care' },
      { value: 'elderly-care', label: 'Elderly Care' },
      { value: 'childcare', label: 'Childcare' },
      { value: 'personal-training', label: 'Personal Training' },
      { value: 'massage', label: 'Massage Therapy' },
    ],
  },
];

export default async function Services() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  try {
    const services = await prisma.service.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return (
      <div className="space-y-6 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Services</h1>
          <CreateServiceModal />
        </div>
        <div className="mb-6">
          <ServicesPage services={services} categories={categories} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching services:', error);
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Failed to load services. Please try again later.</p>
      </div>
    );
  }
}
