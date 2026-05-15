'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateTax } from '@/lib/stripe/actions';

interface TaxDisplayProps {
  basePrice: number;
}

export function TaxDisplay({ basePrice }: TaxDisplayProps) {
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [showTaxInfo, setShowTaxInfo] = useState(false);

  const taxInfo = calculateTax(basePrice, country, state);

  return (
    <div className="mt-4 space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowTaxInfo(!showTaxInfo)}
        className="w-full"
      >
        {showTaxInfo ? 'Hide' : 'Show'} Tax Information
      </Button>

      {showTaxInfo && (
        <div className="space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="country" className="text-xs">
                Country
              </Label>
              <Input
                id="country"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="e.g., US, CA, GB"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="state" className="text-xs">
                State/Province
              </Label>
              <Input
                id="state"
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="e.g., CA, NY, ON"
                className="text-sm"
              />
            </div>
          </div>

          {country && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span>${basePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Rate:</span>
                <span>{(taxInfo.taxRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Amount:</span>
                <span>${taxInfo.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span>Total:</span>
                <span>${taxInfo.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
