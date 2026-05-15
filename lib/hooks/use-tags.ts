import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

const defaultTags: Tag[] = [
  { id: '1', name: 'Essential', color: '#FF6B6B' },
  { id: '2', name: 'Luxury', color: '#4ECDC4' },
  { id: '3', name: 'Business', color: '#45B7D1' },
  { id: '4', name: 'Personal', color: '#96CEB4' },
  { id: '5', name: 'Emergency', color: '#FFEEAD' },
  { id: '6', name: 'Recurring', color: '#D4A5A5' },
  { id: '7', name: 'One-time', color: '#9B59B6' },
  { id: '8', name: 'Tax-deductible', color: '#3498DB' },
  { id: '9', name: 'Investment', color: '#E67E22' },
  { id: '10', name: 'Savings', color: '#1ABC9C' },
];

async function fetchTags(): Promise<Tag[]> {
  // In a real app, this would fetch from an API
  return Promise.resolve(defaultTags);
}

async function createTag(data: Omit<Tag, 'id'>): Promise<Tag> {
  // In a real app, this would create via API
  const newTag = {
    id: Math.random().toString(36).substring(2, 9),
    ...data,
  };
  return Promise.resolve(newTag);
}

async function updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
  // In a real app, this would update via API
  const tag = defaultTags.find(t => t.id === id);
  if (!tag) {
    throw new Error('Tag not found');
  }
  return Promise.resolve({ ...tag, ...data });
}

async function deleteTag(id: string): Promise<void> {
  // In a real app, this would delete via API
  const tag = defaultTags.find(t => t.id === id);
  if (!tag) {
    throw new Error('Tag not found');
  }
  return Promise.resolve();
}

export function useTags() {
  const queryClient = useQueryClient();

  const {
    data: tags = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tag> }) => updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    tags,
    isLoading,
    error,
    createTag: createMutation.mutate,
    updateTag: updateMutation.mutate,
    deleteTag: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
