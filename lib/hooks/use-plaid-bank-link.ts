'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlaidLink, type PlaidLinkOnSuccess } from 'react-plaid-link';
import { useQueryClient } from '@tanstack/react-query';
import { useBank } from '@/lib/hooks/use-bank';

type BankLinkDeps = Pick<
  ReturnType<typeof useBank>,
  'linkToken' | 'isLoadingLinkToken' | 'exchangeToken'
>;

export function usePlaidBankLink(bank: BankLinkDeps, options?: { onLinked?: () => void }) {
  const onLinkedRef = useRef(options?.onLinked);
  useEffect(() => {
    onLinkedRef.current = options?.onLinked;
  }, [options?.onLinked]);

  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { linkToken, isLoadingLinkToken, exchangeToken } = bank;

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    (publicToken, metadata) => {
      void (async () => {
        try {
          setError(null);
          await exchangeToken({
            publicToken,
            institution: metadata.institution?.name ?? 'Linked institution',
          });
          await queryClient.invalidateQueries({ queryKey: ['income-sources'] });
          onLinkedRef.current?.();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to connect bank account');
        }
      })();
    },
    [exchangeToken, queryClient]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess,
    onExit: err => {
      if (err) setError(err.error_message || 'Failed to connect bank account');
    },
  });

  return {
    open,
    ready,
    isLoadingLinkToken,
    error,
    setError,
    hasToken: !!linkToken,
  };
}
