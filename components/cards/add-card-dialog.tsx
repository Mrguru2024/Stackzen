import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Icons } from '@/components/ui/icons';

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddCardDialog: React.FC<AddCardDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const [tab, setTab] = useState('credit');
  const [form, setForm] = useState({
    name: '',
    cardType: 'Visa',
    lastFourDigits: '',
    expiryMonth: '',
    expiryYear: '',
    creditLimit: '',
    dailyLimit: '',
    bank: '',
  });
  const [loading, setLoading] = useState(false);

  const _handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const _handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="credit" value={tab} onValueChange={setTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="credit">Credit Card</TabsTrigger>
            <TabsTrigger value="debit">Debit Card</TabsTrigger>
          </TabsList>
        </Tabs>
        <form onSubmit={_handleSubmit} className="space-y-4">
          <Input
            name="name"
            placeholder="Card Name"
            value={form.name}
            onChange={_handleChange}
            required
          />
          <Input
            name="bank"
            placeholder="Bank Name"
            value={form.bank}
            onChange={_handleChange}
            required
          />
          <Input
            name="lastFourDigits"
            placeholder="Last 4 Digits"
            value={form.lastFourDigits}
            onChange={_handleChange}
            maxLength={4}
            required
          />
          <div className="flex gap-2">
            <Input
              name="expiryMonth"
              placeholder="MM"
              value={form.expiryMonth}
              onChange={_handleChange}
              maxLength={2}
              required
            />
            <Input
              name="expiryYear"
              placeholder="YYYY"
              value={form.expiryYear}
              onChange={_handleChange}
              maxLength={4}
              required
            />
          </div>
          <select
            name="cardType"
            value={form.cardType}
            onChange={_handleChange}
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
            <option value="Amex">Amex</option>
            <option value="Discover">Discover</option>
          </select>
          {tab === 'credit' ? (
            <Input
              name="creditLimit"
              placeholder="Credit Limit ($)"
              value={form.creditLimit}
              onChange={_handleChange}
              type="number"
              required
            />
          ) : (
            <Input
              name="dailyLimit"
              placeholder="Daily Limit ($)"
              value={form.dailyLimit}
              onChange={_handleChange}
              type="number"
              required
            />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Icons.spinner className="h-4 w-4 animate-spin" /> : 'Add Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
