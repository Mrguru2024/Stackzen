import React from 'react';
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button, Badge, ScrollArea, Textarea } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertCircle, Clock, Share2, History, MoreVertical, Search, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  metric: string;
  type: string;
  severity: 'warning' | 'error';
  steps: string[];
  notes: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  category: string;
  tags: string[];
}

interface TemplateVersion {
  version: number;
  changes: string;
  updatedAt: Date;
  updatedBy: string;
}

interface TemplateManagerProps {
  templates: Template[];
  onTemplateUpdate: (template: Template) => void;
  onTemplateShare: (template: Template, recipients: string[]) => void;
}

const _CATEGORIES = [
  'Performance',
  'Memory',
  'Network',
  'Security',
  'Accessibility',
  'Best Practices',
] as const;

interface DuplicateFormErrors {
  name?: string;
  description?: string;
  category?: string;
  tags?: string;
}

export function TemplateManager({
  templates,
  onTemplateUpdate,
  onTemplateShare,
}: TemplateManagerProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareRecipients, setShareRecipients] = useState('');
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const [duplicateDescription, setDuplicateDescription] = useState('');
  const [versionHistory, setVersionHistory] = useState<TemplateVersion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [duplicateCategory, setDuplicateCategory] = useState<string>('');
  const [duplicateSeverity, setDuplicateSeverity] = useState<'warning' | 'error'>('warning');
  const [duplicateTags, setDuplicateTags] = useState<string>('');
  const [duplicateErrors, setDuplicateErrors] = useState<DuplicateFormErrors>({});

  const _filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const _matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const _matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const _matchesSeverity = selectedSeverity === 'all' || template.severity === selectedSeverity;

      return _matchesSearch && _matchesCategory && _matchesSeverity;
    });
  }, [templates, searchQuery, selectedCategory, selectedSeverity]);

  const _handleShare = () => {
    if (!selectedTemplate) return;
    const __recipients = shareRecipients
      .split(',')
      .map(email => email.trim())
      .filter(Boolean);
    onTemplateShare(selectedTemplate, __recipients);
    setShowShareDialog(false);
    setShareRecipients('');
  };

  const _getSeverityColor = (severity: 'warning' | 'error') => {
    return severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  };

  const _validateDuplicateForm = (): boolean => {
    const errors: DuplicateFormErrors = {};
    let isValid = true;

    if (!duplicateName.trim()) {
      errors.name = 'Template name is required';
      isValid = false;
    } else if (duplicateName.length > 100) {
      errors.name = 'Template name must be less than 100 characters';
      isValid = false;
    }

    if (!duplicateDescription.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    } else if (duplicateDescription.length > 500) {
      errors.description = 'Description must be less than 500 characters';
      isValid = false;
    }

    if (!duplicateCategory) {
      errors.category = 'Category is required';
      isValid = false;
    }

    if (duplicateTags) {
      const tags = duplicateTags.split(',').map(tag => tag.trim());
      if (tags.some(tag => tag.length > 30)) {
        errors.tags = 'Each tag must be less than 30 characters';
        isValid = false;
      }
      if (tags.some(tag => !/^[a-zA-Z0-9-_ ]+$/.test(tag))) {
        errors.tags = 'Tags can only contain letters, numbers, hyphens, and underscores';
        isValid = false;
      }
    }

    setDuplicateErrors(errors);
    return isValid;
  };

  const _handleDuplicate = () => {
    if (!selectedTemplate || !_validateDuplicateForm()) return;

    const newTemplate: Template = {
      ...selectedTemplate,
      id: `${selectedTemplate.id}-copy-${Date.now()}`,
      name: duplicateName.trim(),
      description: duplicateDescription.trim(),
      category: duplicateCategory,
      severity: duplicateSeverity,
      tags: duplicateTags
        ? duplicateTags.split(',').map(tag => tag.trim())
        : [...selectedTemplate.tags],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'Current User', // Replace with actual user
      lastModifiedBy: 'Current User', // Replace with actual user
    };

    onTemplateUpdate(newTemplate);
    setShowDuplicateDialog(false);
    setDuplicateName('');
    setDuplicateDescription('');
    setDuplicateCategory('');
    setDuplicateSeverity('warning');
    setDuplicateTags('');
    setDuplicateErrors({});
    toast({
      title: 'Template duplicated',
      description: 'Template duplicated successfully.',
    });
  };

  const _handleDuplicateDialogOpen = (template: Template) => {
    setDuplicateName(`${template.name} (Copy)`);
    setDuplicateDescription(template.description);
    setDuplicateCategory(template.category);
    setDuplicateSeverity(template.severity);
    setDuplicateTags(template.tags.join(', '));
    setDuplicateErrors({});
    setShowDuplicateDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Template Manager</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowVersionHistory(true)}>
              <History className="mr-2 h-4 w-4" />
              Version History
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Label>Search Templates</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, description, or tags..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div>
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label>Select Template</Label>
            <Select
              value={selectedTemplate?.id}
              onValueChange={value =>
                setSelectedTemplate(templates.find(t => t.id === value) || null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {_filteredTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        <Badge variant="outline" className="ml-2">
                          v{template.version}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle
                    className={`h-4 w-4 ${
                      selectedTemplate.severity === 'warning' ? 'text-yellow-500' : 'text-red-500'
                    }`}
                  />
                  <Badge variant="outline" className={_getSeverityColor(selectedTemplate.severity)}>
                    {selectedTemplate.severity}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedTemplate.metric} - {selectedTemplate.type}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setShowVersionHistory(true)}>
                      View History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                      Share Template
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => _handleDuplicateDialogOpen(selectedTemplate)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate Template
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm">{selectedTemplate.description}</p>

              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div>
                <Label>Resolution Steps</Label>
                <ScrollArea className="h-32 rounded-md border p-4">
                  <ol className="list-inside list-decimal space-y-2">
                    {selectedTemplate.steps.map((step, index) => (
                      <li key={index} className="text-sm">
                        {step}
                      </li>
                    ))}
                  </ol>
                </ScrollArea>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Created by: {selectedTemplate.createdBy}</p>
                <p>Last modified by: {selectedTemplate.lastModifiedBy}</p>
                <p>Version: {selectedTemplate.version}</p>
                <p>Category: {selectedTemplate.category}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>View changes made to this template over time</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {versionHistory.map(version => (
                <div key={version.version} className="flex items-start gap-4 rounded-lg border p-4">
                  <Clock className="mt-1 h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge>v{version.version}</Badge>
                      <span className="text-sm text-muted-foreground">{version.updatedBy}</span>
                    </div>
                    <p className="text-sm">{version.changes}</p>
                    <p className="text-xs text-muted-foreground">
                      {version.updatedAt.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Template</DialogTitle>
            <DialogDescription>Share this template with team members</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Recipients (comma-separated emails)</Label>
              <Input
                value={shareRecipients}
                onChange={e => setShareRecipients(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={_handleShare}>Share</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Duplicate Template</DialogTitle>
            <DialogDescription>
              Create a copy of this template with custom settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="duplicate-name">Template Name</Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={e => {
                  setDuplicateName(e.target.value);
                  if (duplicateErrors.name) {
                    setDuplicateErrors({ ...duplicateErrors, name: undefined });
                  }
                }}
                placeholder="Enter a name for the duplicate template"
                className={cn(duplicateErrors.name && 'border-red-500')}
              />
              {duplicateErrors.name && (
                <p className="mt-1 text-sm text-red-500">{duplicateErrors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="duplicate-description">Description</Label>
              <Textarea
                id="duplicate-description"
                value={duplicateDescription}
                onChange={e => {
                  setDuplicateDescription(e.target.value);
                  if (duplicateErrors.description) {
                    setDuplicateErrors({
                      ...duplicateErrors,
                      description: undefined,
                    });
                  }
                }}
                placeholder="Enter a description for the duplicate template"
                className={cn(duplicateErrors.description && 'border-red-500')}
              />
              {duplicateErrors.description && (
                <p className="mt-1 text-sm text-red-500">{duplicateErrors.description}</p>
              )}
            </div>
            <div>
              <Label htmlFor="duplicate-category">Category</Label>
              <Select
                value={duplicateCategory}
                onValueChange={value => {
                  setDuplicateCategory(value);
                  if (duplicateErrors.category) {
                    setDuplicateErrors({
                      ...duplicateErrors,
                      category: undefined,
                    });
                  }
                }}
              >
                <SelectTrigger
                  id="duplicate-category"
                  className={cn(duplicateErrors.category && 'border-red-500')}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {duplicateErrors.category && (
                <p className="mt-1 text-sm text-red-500">{duplicateErrors.category}</p>
              )}
            </div>
            <div>
              <Label htmlFor="duplicate-severity">Severity</Label>
              <Select
                value={duplicateSeverity}
                onValueChange={(value: 'warning' | 'error') => setDuplicateSeverity(value)}
              >
                <SelectTrigger id="duplicate-severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duplicate-tags">Tags (comma-separated)</Label>
              <Input
                id="duplicate-tags"
                value={duplicateTags}
                onChange={e => {
                  setDuplicateTags(e.target.value);
                  if (duplicateErrors.tags) {
                    setDuplicateErrors({ ...duplicateErrors, tags: undefined });
                  }
                }}
                placeholder="Enter tags separated by commas"
                className={cn(duplicateErrors.tags && 'border-red-500')}
              />
              {duplicateErrors.tags && (
                <p className="mt-1 text-sm text-red-500">{duplicateErrors.tags}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDuplicateDialog(false);
                setDuplicateErrors({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={_handleDuplicate}>Duplicate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
