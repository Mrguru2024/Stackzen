import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui';
import { ScrollArea } from '@/components/ui';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui';
import { Check, ChevronsUpDown, Plus, Tag, X, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

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

interface TemplateCategoriesProps {
  templates: Template[];
  onCategorySelect: (category: string | null) => void;
  onTagSelect: (tags: string[]) => void;
  onSearch: (query: string) => void;
  onCategoryAdd?: (category: string) => void;
  onCategoryDelete?: (category: string) => void;
}

const _defaultCategories = [
  'Performance',
  'Memory',
  'Network',
  'Security',
  'UI/UX',
  'Database',
  'API',
  'Testing',
  'Deployment',
  'Monitoring',
];

export function TemplateCategories({
  templates,
  onCategorySelect,
  onTagSelect,
  onSearch,
  onCategoryAdd,
  onCategoryDelete,
}: TemplateCategoriesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const _allTags = useMemo(() => {
    const tags = new Set<string>();
    templates.forEach(template => {
      template.tags.forEach(_tag => tags.add(_tag));
    });
    return Array.from(tags).sort();
  }, [templates]);

  const categories = useMemo(() => {
    const _categoryCounts = new Map<string, number>();
    templates.forEach(template => {
      _categoryCounts.set(template.category, (_categoryCounts.get(template.category) || 0) + 1);
    });
    return Array.from(_categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([_category]) => _category);
  }, [templates]);

  const _handleCategorySelect = (_category: string | null) => {
    setSelectedCategory(_category);
    onCategorySelect(_category);
  };

  const _handleTagSelect = (_tag: string) => {
    const _newTags = selectedTags.includes(_tag)
      ? selectedTags.filter(t => t !== _tag)
      : [...selectedTags, _tag];
    setSelectedTags(_newTags);
    onTagSelect(_newTags);
  };

  const _handleSearch = (_query: string) => {
    setSearchQuery(_query);
    onSearch(_query);
  };

  const _clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
    setSearchQuery('');
    onCategorySelect(null);
    onTagSelect([]);
    onSearch('');
  };

  const _handleAddCategory = () => {
    if (newCategory.trim() && onCategoryAdd) {
      onCategoryAdd(newCategory.trim());
      setNewCategory('');
      setIsAddingCategory(false);
    }
  };

  const _handleDeleteCategory = (_category: string) => {
    if (onCategoryDelete) {
      onCategoryDelete(_category);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={e => _handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between"
            >
              <Filter className="mr-2 h-4 w-4" />
              {selectedCategory || 'Select Category'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search categories..." />
              <CommandList>
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      _handleCategorySelect(null);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedCategory === null ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    All Categories
                  </CommandItem>
                  {categories.map(_category => (
                    <CommandItem
                      key={_category}
                      onSelect={() => {
                        _handleCategorySelect(_category);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedCategory === _category ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {_category}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button
              title={`Remove ${tag} tag`}
              onClick={() => _handleTagSelect(tag)}
              className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {selectedTags.length > 0 && (
          <Button variant="ghost" size="sm" onClick={_clearFilters} className="h-6 px-2">
            Clear all
          </Button>
        )}
      </div>

      <Card>
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-medium">Popular Tags</h4>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Add new tag">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {_allTags.map(tag => (
                <div
                  key={tag}
                  className="flex cursor-pointer items-center justify-between rounded p-2 hover:bg-accent"
                  onClick={() => _handleTagSelect(tag)}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{tag}</span>
                  </div>
                  {selectedTags.includes(tag) && <Check className="h-4 w-4 text-primary" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-medium">Categories</h4>
            <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                    Create a new category for organizing templates
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category Name</Label>
                    <Input
                      id="category"
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      placeholder="Enter category name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
                    Cancel
                  </Button>
                  <Button onClick={_handleAddCategory}>Add Category</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {_defaultCategories.map(_category => (
              <div
                key={_category}
                className={cn(
                  'flex items-center justify-between p-2 rounded cursor-pointer group',
                  selectedCategory === _category
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <div
                  className="flex flex-1 items-center justify-between"
                  onClick={() => _handleCategorySelect(_category)}
                >
                  <span className="text-sm">{_category}</span>
                  <Badge variant="secondary" className="ml-2">
                    {templates.filter(t => t.category === _category).length}
                  </Badge>
                </div>
                {onCategoryDelete && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      _handleDeleteCategory(_category);
                    }}
                    className="ml-2 opacity-0 transition-opacity group-hover:opacity-100"
                    title={`Delete ${_category} category`}
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
