'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface FilterState {
  activeFilter: 'all' | 'active' | 'closed'
  category: string
  volumeRange: [number, number]
  sentimentFilter: string[]
  sortBy: string
  searchQuery: string
}

interface FilterContextType extends FilterState {
  setActiveFilter: (filter: 'all' | 'active' | 'closed') => void
  setCategory: (category: string) => void
  setVolumeRange: (range: [number, number]) => void
  setSentimentFilter: (filters: string[]) => void
  setSortBy: (sort: string) => void
  setSearchQuery: (query: string) => void
  resetFilters: () => void
}

const defaultState: FilterState = {
  activeFilter: 'all',
  category: 'all',
  volumeRange: [0, 100],
  sentimentFilter: [],
  sortBy: 'volume',
  searchQuery: '',
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'closed'>('all')
  const [category, setCategory] = useState('all')
  const [volumeRange, setVolumeRange] = useState<[number, number]>([0, 100])
  const [sentimentFilter, setSentimentFilter] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('volume')
  const [searchQuery, setSearchQuery] = useState('')

  const resetFilters = () => {
    setActiveFilter('all')
    setCategory('all')
    setVolumeRange([0, 100])
    setSentimentFilter([])
    setSortBy('volume')
    setSearchQuery('')
  }

  return (
    <FilterContext.Provider
      value={{
        activeFilter,
        category,
        volumeRange,
        sentimentFilter,
        sortBy,
        searchQuery,
        setActiveFilter,
        setCategory,
        setVolumeRange,
        setSentimentFilter,
        setSortBy,
        setSearchQuery,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}
