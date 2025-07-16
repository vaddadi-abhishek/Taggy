// src/context/SearchContext.tsx
import React, { createContext, useContext, useState } from "react";

type SearchFilter = "All" | "Tags" | "Title" | "Caption";

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  searching: boolean;
  setSearching: (b: boolean) => void;
  searchFilter: SearchFilter;
  setSearchFilter: (filter: SearchFilter) => void;
}

const SearchContext = createContext<SearchContextType>(null!);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("All");

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searching,
        setSearching,
        searchFilter,
        setSearchFilter,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);
