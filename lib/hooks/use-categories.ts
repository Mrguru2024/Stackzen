import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Food & Dining', icon: 'utensils', color: '#FF6B6B' },
  { id: '2', name: 'Transportation', icon: 'car', color: '#4ECDC4' },
  { id: '3', name: 'Housing', icon: 'home', color: '#45B7D1' },
  { id: '4', name: 'Utilities', icon: 'bolt', color: '#96CEB4' },
  { id: '5', name: 'Entertainment', icon: 'film', color: '#FFEEAD' },
  { id: '6', name: 'Shopping', icon: 'shopping-bag', color: '#D4A5A5' },
  { id: '7', name: 'Healthcare', icon: 'heart', color: '#9B59B6' },
  { id: '8', name: 'Education', icon: 'book', color: '#3498DB' },
  { id: '9', name: 'Travel', icon: 'plane', color: '#E67E22' },
  { id: '10', name: 'Personal Care', icon: 'user', color: '#1ABC9C' },
  { id: '11', name: 'Gifts', icon: 'gift', color: '#E74C3C' },
  { id: '12', name: 'Subscriptions', icon: 'credit-card', color: '#2ECC71' },
  { id: '13', name: 'Investments', icon: 'chart-line', color: '#F1C40F' },
  { id: '14', name: 'Savings', icon: 'piggy-bank', color: '#27AE60' },
  { id: '15', name: 'Other', icon: 'ellipsis-h', color: '#95A5A6' },
];

async function fetchCategories(): Promise<Category[]> {
  // In a real app, this would fetch from an API
  return Promise.resolve(defaultCategories);
}

async function createCategory(data: Omit<Category, 'id'>): Promise<Category> {
  // In a real app, this would create via API
  const newCategory = {
    id: Math.random().toString(36).substring(2, 9),
    ...data,
  };
  return Promise.resolve(newCategory);
}

async function updateCategory(id: string, data: Partial<Category>): Promise<Category> {
  // In a real app, this would update via API
  const category = defaultCategories.find(c => c.id === id);
  if (!category) {
    throw new Error('Category not found');
  }
  return Promise.resolve({ ...category, ...data });
}

async function deleteCategory(id: string): Promise<void> {
  // In a real app, this would delete via API
  const category = defaultCategories.find(c => c.id === id);
  if (!category) {
    throw new Error('Category not found');
  }
  return Promise.resolve();
}

export function useCategories() {
  const queryClient = useQueryClient();

  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
