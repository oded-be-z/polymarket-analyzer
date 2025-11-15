/**
 * useIntelligence Hook
 *
 * React hook for fetching Perplexity intelligence with loading/error states.
 * Handles caching and API communication for all 5 intelligence endpoints.
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

'use client'

import { useState, useEffect } from 'react'
import { PerplexityIntelligenceResponse, ApiResponse } from '@/INTERFACE_CONTRACTS'

type IntelligenceEndpoint = 'context' | 'news' | 'experts' | 'brief' | 'trends'

interface UseIntelligenceState {
  data: PerplexityIntelligenceResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useIntelligence(
  marketId: string,
  endpoint: IntelligenceEndpoint
): UseIntelligenceState {
  const [data, setData] = useState<PerplexityIntelligenceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  useEffect(() => {
    let isCancelled = false

    async function fetchIntelligence() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/intelligence/${endpoint}?marketId=${encodeURIComponent(marketId)}`
        )

        const result: ApiResponse<PerplexityIntelligenceResponse> = await response.json()

        if (isCancelled) return

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || 'Failed to fetch intelligence')
        }

        setData(result.data || null)
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          console.error(`Intelligence fetch error (${endpoint}):`, err)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchIntelligence()

    return () => {
      isCancelled = true
    }
  }, [marketId, endpoint, refetchTrigger])

  const refetch = () => setRefetchTrigger(prev => prev + 1)

  return { data, isLoading, error, refetch }
}
