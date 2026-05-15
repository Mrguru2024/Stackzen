import React from 'react';
import { getServerSession } from 'next-auth';
import Image from 'next/image';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import { Star, Clock, DollarSign, Calendar, User, Tag, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { BookingModal } from '@/components/services/booking-modal';
import { EditServiceModal } from '@/components/services/edit-service-modal';
import { DeleteServiceButton } from '@/components/services/delete-service-button';
import { ReviewForm } from '@/components/services/review-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface ServiceDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ServiceDetailsPage({ params }: ServiceDetailsPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  try {
    const service = await prisma.service.findUnique({
      where: {
        id: id,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        serviceReviews: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!service) {
      notFound();
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{service.title}</h1>
            <p className="mt-1 text-muted-foreground">
              Created {formatDistanceToNow(new Date(service.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BookingModal
              service={{
                id: service.id,
                title: service.title,
                price: service.price,
                duration: service.duration != null ? String(service.duration) : '',
              }}
            >
              <Button>Book Now</Button>
            </BookingModal>
            <EditServiceModal service={service} categories={categories}>
              <Button variant="outline">Edit Service</Button>
            </EditServiceModal>
            <DeleteServiceButton serviceId={service.id} />
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({service.serviceReviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">${service.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span>{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span>
                      {(service.rating ?? 0).toFixed(1)} ({service.serviceReviews.length} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-purple-500" />
                    <div className="flex flex-wrap gap-2">
                      {service.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-lg">
                    {service.category}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Provider</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {service.user.image && (
                      <Image
                        src={service.user.image}
                        alt={service.user.name || 'User'}
                        className="h-10 w-10 rounded-full"
                        width={40}
                        height={40}
                      />
                    )}
                    <div>
                      <p className="font-medium">{service.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Member since{' '}
                        {formatDistanceToNow(new Date(service.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {service.isProOnly && (
              <Card className="bg-yellow-50 dark:bg-yellow-950">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <Star className="h-5 w-5 fill-yellow-400" />
                    <p className="font-medium">This is a Pro-only service</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm serviceId={service.id} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              {service.serviceReviews.map(review => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {review.user.image && (
                          <Image
                            src={review.user.image}
                            alt={review.user.name || 'User'}
                            className="h-8 w-8 rounded-full"
                            width={32}
                            height={32}
                          />
                        )}
                        <div>
                          <p className="font-medium">{review.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{review.rating}</span>
                      </div>
                    </div>
                    <p className="mt-4 text-muted-foreground">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error('Error fetching service:', error);
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          Failed to load service details. Please try again later.
        </p>
      </div>
    );
  }
}
