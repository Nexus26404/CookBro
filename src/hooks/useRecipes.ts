'use client';

import useSWR from 'swr';
import type { Recipe } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useRecipes(groupId?: string) {
  const url = groupId ? `/api/recipes?groupId=${groupId}` : '/api/recipes';
  const { data, error, isLoading, mutate } = useSWR<Recipe[]>(url, fetcher, {
    refreshInterval: 10000, // poll every 10s as substitute for real-time
  });

  return {
    recipes: data ?? [],
    loading: isLoading,
    error: error ?? null,
    mutate,
  };
}
