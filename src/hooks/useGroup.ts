'use client';

import useSWR from 'swr';
import type { CookGroup, Order } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useGroup(userUid: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<CookGroup | null>(
    userUid ? `/api/groups?uid=${userUid}` : null,
    fetcher
  );

  return {
    group: data ?? null,
    loading: isLoading,
    error: error ?? null,
    refetch: () => mutate(),
  };
}

export function useTodayOrder(groupId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Order | null>(
    groupId ? `/api/orders/today?groupId=${groupId}` : null,
    fetcher,
    { refreshInterval: 5000 } // poll every 5s
  );

  return {
    order: data ?? null,
    loading: isLoading,
    error: error ?? null,
    mutate,
  };
}
