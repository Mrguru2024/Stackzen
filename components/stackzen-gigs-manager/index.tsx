import React from 'react';
import { useState } from 'react';
import {
  useStackZenGigs,
  useCreateStackZenGig,
  useUpdateStackZenGig,
  useDeleteStackZenGig,
  StackZenGig,
} from '@/lib/hooks/useStackZenGigs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

const emptyGig: Omit<StackZenGig, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  description: '',
  category: '',
  duration: '',
  budget: 0,
  rating: 0,
  postedBy: '',
  skills: [],
  isProOnly: false,
};

export default function StackZenGigsManager() {
  const { data: gigs, isLoading } = useStackZenGigs();
  const createGig = useCreateStackZenGig();
  const updateGig = useUpdateStackZenGig();
  const deleteGig = useDeleteStackZenGig();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [modalOpen, setModalOpen] = useState(false);
  const [editGig, setEditGig] = useState<StackZenGig | null>(null);
  const [form, setForm] = useState(emptyGig);

  const openCreate = () => {
    setEditGig(null);
    setForm(emptyGig);
    setModalOpen(true);
  };
  const openEdit = (gig: StackZenGig) => {
    setEditGig(gig);
    setForm({ ...gig });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const el = e.target;
    const { name } = el;
    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: el.checked }));
      return;
    }
    const value = 'value' in el ? el.value : '';
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, skills: e.target.value.split(',').map(s => s.trim()) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editGig) {
      updateGig.mutate({ ...form, id: editGig.id });
    } else {
      createGig.mutate(form);
    }
    setModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Manage StackZen Gigs</h1>
        <Button onClick={openCreate} disabled={!isAdmin}>
          New Gig
        </Button>
      </div>
      {!isAdmin && (
        <div className="mb-4 rounded bg-yellow-100 p-3 text-center text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Only admins can create, edit, or delete gigs.
        </div>
      )}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading gigs...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg bg-white shadow dark:bg-gray-900">
            <thead>
              <tr className="border-b border-gray-200 text-left dark:border-gray-700">
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Budget</th>
                <th className="p-3">Pro Only</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gigs?.map(gig => (
                <tr
                  key={gig.id}
                  className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                >
                  <td className="p-3 font-medium">{gig.title}</td>
                  <td className="p-3">{gig.category}</td>
                  <td className="p-3">${gig.budget}</td>
                  <td className="p-3">{gig.isProOnly ? 'Yes' : 'No'}</td>
                  <td className="flex gap-2 p-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(gig)}
                      disabled={!isAdmin}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteGig.mutate(gig.id)}
                      disabled={!isAdmin}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editGig ? 'Edit Gig' : 'New Gig'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-medium">Title</label>
              <Input name="title" value={form.title} onChange={handleChange} required />
            </div>
            <div>
              <label className="mb-1 block font-medium">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                className="w-full rounded border border-gray-300 bg-white p-2 dark:border-gray-700 dark:bg-gray-900"
                placeholder="Describe the gig..."
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block font-medium">Category</label>
                <Input name="category" value={form.category} onChange={handleChange} required />
              </div>
              <div className="flex-1">
                <label className="mb-1 block font-medium">Budget</label>
                <Input
                  name="budget"
                  type="number"
                  value={form.budget}
                  onChange={handleChange}
                  min={0}
                  required
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block font-medium">Duration</label>
                <Input name="duration" value={form.duration} onChange={handleChange} />
              </div>
              <div className="flex-1">
                <label className="mb-1 block font-medium">Rating</label>
                <Input
                  name="rating"
                  type="number"
                  value={form.rating}
                  onChange={handleChange}
                  min={0}
                  max={5}
                  step={0.1}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block font-medium">Posted By</label>
              <Input name="postedBy" value={form.postedBy} onChange={handleChange} />
            </div>
            <div>
              <label className="mb-1 block font-medium">Skills (comma separated)</label>
              <Input name="skills" value={form.skills.join(', ')} onChange={handleSkillsChange} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isProOnly"
                checked={form.isProOnly}
                onChange={handleChange}
                id="isProOnly"
              />
              <label htmlFor="isProOnly" className="font-medium">
                Pro Only
              </label>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={!isAdmin}>
                {editGig ? 'Update' : 'Create'} Gig
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full" onClick={closeModal}>
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
