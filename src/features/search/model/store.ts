import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SearchFilters {
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  sortBy: 'popular' | 'newest' | 'best-selling' | 'price-asc' | 'price-desc';
}

interface SearchState {
  query: string;
  filters: SearchFilters;
  recentSearches: string[];
  suggestions: string[];
  trendingSearches: string[];
  instantResults: any[];
  isSearching: boolean;
  isLoadingSuggestions: boolean;
  
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setIsSearching: (isSearching: boolean) => void;
  setSuggestions: (suggestions: string[]) => void;
  setTrendingSearches: (trending: string[]) => void;
  setInstantResults: (results: any[]) => void;
  setLoadingSuggestions: (loading: boolean) => void;
}

const DEFAULT_FILTERS: SearchFilters = {
  category: null,
  minPrice: null,
  maxPrice: null,
  minRating: null,
  sortBy: 'popular',
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      query: '',
      filters: DEFAULT_FILTERS,
      recentSearches: [],
      suggestions: [],
      trendingSearches: ['iPhone 15 Pro Max', 'Nến thơm Đà Lạt', 'Túi Canvas', 'Decor phòng ngủ'],
      instantResults: [],
      isSearching: false,
      isLoadingSuggestions: false,

      setQuery: (query) => set({ query }),
      setFilters: (newFilters) => set((state) => ({ 
        filters: { ...state.filters, ...newFilters } 
      })),
      clearFilters: () => set({ filters: DEFAULT_FILTERS }),
      addRecentSearch: (query) => set((state) => {
        if (!query.trim()) return state;
        const filtered = state.recentSearches.filter(s => s !== query);
        return { recentSearches: [query, ...filtered].slice(0, 10) };
      }),
      clearRecentSearches: () => set({ recentSearches: [] }),
      setIsSearching: (isSearching) => set({ isSearching }),
      setSuggestions: (suggestions) => set({ suggestions }),
      setTrendingSearches: (trendingSearches) => set({ trendingSearches }),
      setInstantResults: (instantResults) => set({ instantResults }),
      setLoadingSuggestions: (isLoadingSuggestions) => set({ isLoadingSuggestions }),
    }),
    {
      name: 'htmn-search-storage',
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    }
  )
);
