'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Loader2,
  Search,
  Brain,
  Calendar,
  Award,
  ArrowUpRight,
  Clock,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/components/ui/use-toast';

interface Grant {
  id: string;
  title: string;
  description: string;
  organization: string;
  amount: number;
  deadline: string;
  category: string;
  requirements: string[];
  aiScore: number;
  applicationStatus?: 'open' | 'closing_soon' | 'closed';
  isProOnly: boolean;
  tags: string[];
}

interface GrantApplication {
  id: string;
  grantTitle: string;
  organization: string;
  appliedDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  amount: number;
}

export default function GrantsFinderPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ai-recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const isPro = user?.subscription?.status === 'active';

  const { data: grants, isLoading } = useQuery<Grant[]>({
    queryKey: ['/api/grants'],
    queryFn: async () => {
      const response = await fetch('/api/grants');
      if (!response.ok) {
        throw new Error('Failed to fetch grants');
      }
      return response.json();
    },
  });

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('stackzen.grantApplications');
      if (raw) {
        const parsed = JSON.parse(raw) as GrantApplication[];
        setApplications(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setApplications([]);
    }
  }, []);

  const saveApplications = (nextApplications: GrantApplication[]) => {
    setApplications(nextApplications);
    localStorage.setItem('stackzen.grantApplications', JSON.stringify(nextApplications));
  };

  const filteredGrants = grants?.filter(grant => {
    const matchesSearch =
      grant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.organization.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || grant.category === selectedCategory;

    if (activeTab === 'ai-recommended') {
      return matchesSearch && matchesCategory && grant.aiScore >= 80;
    } else if (activeTab === 'pro') {
      return matchesSearch && matchesCategory && grant.isProOnly;
    }
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'technology', label: 'Technology' },
    { value: 'research', label: 'Research' },
    { value: 'nonprofit', label: 'Non-Profit' },
    { value: 'creative', label: 'Creative Arts' },
  ];

  const handleAIAnalysis = () => {
    setShowAIAnalysis(true);
    toast({
      title: 'AI Analysis Started',
      description: 'Analyzing your profile and grant opportunities...',
    });
  };

  const handleMyApplications = () => {
    setShowApplications(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'under_review':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grants Finder</h1>
          <p className="text-muted-foreground">
            Discover and apply for funding opportunities with AI-powered recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAIAnalysis} onOpenChange={setShowAIAnalysis}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" onClick={handleAIAnalysis}>
                <Brain size={16} />
                AI Analysis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI Grant Analysis</DialogTitle>
                <DialogDescription>
                  AI-powered analysis of your profile and grant opportunities
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Profile Match
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">87%</div>
                      <p className="text-sm text-muted-foreground">
                        Based on your skills and experience
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Success Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">23%</div>
                      <p className="text-sm text-muted-foreground">Average grant success rate</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Top Recommendations</h3>
                  <div className="space-y-3">
                    {filteredGrants?.slice(0, 3).map(grant => (
                      <div
                        key={grant.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <div className="font-medium">{grant.title}</div>
                          <div className="text-sm text-muted-foreground">{grant.organization}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${grant.amount.toLocaleString()}</div>
                          <div className="text-sm text-green-600">{grant.aiScore}% match</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showApplications} onOpenChange={setShowApplications}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={handleMyApplications}>
                <Award size={16} />
                My Applications
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>My Grant Applications</DialogTitle>
                <DialogDescription>Track the status of your grant applications</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {applications.map(application => (
                  <Card key={application.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{application.grantTitle}</CardTitle>
                          <CardDescription>{application.organization}</CardDescription>
                        </div>
                        <Badge className={getStatusColor(application.status)}>
                          {getStatusLabel(application.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Applied: {new Date(application.appliedDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />${application.amount.toLocaleString()}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const matchedGrant = grants?.find(grant => grant.id === application.id);
                            if (!matchedGrant) return;
                            toast({
                              title: matchedGrant.title,
                              description: `Requirements: ${matchedGrant.requirements.join(', ')}`,
                            });
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {applications.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No applications yet. Use Apply Now on a grant card to start one.
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Funding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${grants?.reduce((sum, g) => sum + g.amount, 0).toLocaleString() || 0}
            </div>
            <p className="text-sm text-muted-foreground">Available grant funding</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {grants?.length
                ? Math.round(grants.reduce((sum, g) => sum + g.aiScore, 0) / grants.length)
                : 0}
              %
            </div>
            <p className="text-sm text-muted-foreground">Average AI match score</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Closing Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {grants?.filter(g => g.applicationStatus === 'closing_soon').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Grants closing this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search grants..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="ai-recommended" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ai-recommended">AI Recommended</TabsTrigger>
          <TabsTrigger value="all">All Grants</TabsTrigger>
          <TabsTrigger value="pro">Pro Grants</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGrants?.map(grant => (
                <Card key={grant.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    {grant.isProOnly && <Badge className="mb-2 w-fit">Pro Only</Badge>}
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{grant.title}</CardTitle>
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 ${
                          grant.applicationStatus === 'closing_soon'
                            ? 'text-orange-500'
                            : grant.applicationStatus === 'closed'
                              ? 'text-red-500'
                              : 'text-green-500'
                        }`}
                      >
                        {grant.applicationStatus === 'closing_soon' ? (
                          <Clock className="h-3 w-3" />
                        ) : grant.applicationStatus === 'closed' ? (
                          <Calendar className="h-3 w-3" />
                        ) : (
                          <Award className="h-3 w-3" />
                        )}
                        {grant.applicationStatus?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription>{grant.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-muted-foreground">AI Match Score</span>
                          <span className="font-medium">{grant.aiScore}%</span>
                        </div>
                        <Progress value={grant.aiScore} className="h-2" />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4" />${grant.amount.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(grant.deadline).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {grant.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-between"
                      disabled={grant.isProOnly && !isPro}
                      onClick={() => {
                        if (grant.isProOnly && !isPro) {
                          toast({
                            title: 'Pro Subscription Required',
                            description: 'This grant requires a Pro subscription to apply.',
                            variant: 'destructive',
                          });
                        } else if (grant.applicationStatus === 'closed') {
                          toast({
                            title: 'Applications Closed',
                            description: 'This grant is no longer accepting applications.',
                            variant: 'destructive',
                          });
                        } else {
                          const existing = applications.find(app => app.id === grant.id);
                          if (!existing) {
                            const nextApplications: GrantApplication[] = [
                              {
                                id: grant.id,
                                grantTitle: grant.title,
                                organization: grant.organization,
                                appliedDate: new Date().toISOString(),
                                status: 'pending',
                                amount: grant.amount,
                              },
                              ...applications,
                            ];
                            saveApplications(nextApplications);
                          }
                          toast({
                            title: 'Application added',
                            description: existing
                              ? 'This grant is already in your applications list.'
                              : 'Added to My Applications for tracking.',
                          });
                          setShowApplications(true);
                        }
                      }}
                    >
                      {grant.isProOnly && !isPro
                        ? 'Requires Pro Subscription'
                        : grant.applicationStatus === 'closed'
                          ? 'Applications Closed'
                          : 'Apply Now'}
                      <ArrowUpRight size={16} />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
