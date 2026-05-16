import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/src/shared/lib/react-query';

export const withQuery = (Component: React.ComponentType) => () => (
  <QueryClientProvider client={queryClient}>
    <Component />
  </QueryClientProvider>
);
