"use client";

import { useState, useEffect } from "react";

interface LookupOption {
  value: string;
  label: string;
}

export function useLookups(category: string) {
  const [options, setOptions] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLookups() {
      try {
        const response = await fetch(`/api/lookups?category=${category}`);
        if (response.ok) {
          const data = await response.json();
          setOptions(data);
        }
      } catch (error) {
        console.error(`Failed to fetch ${category} lookups:`, error);
      } finally {
        setLoading(false);
      }
    }
    fetchLookups();
  }, [category]);

  return { options, loading };
}

export function useMultipleLookups(categories: string[]) {
  const [lookups, setLookups] = useState<Record<string, LookupOption[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllLookups() {
      try {
        const response = await fetch("/api/lookups");
        if (response.ok) {
          const data = await response.json();
          // Filter to only requested categories
          const filtered = categories.reduce((acc, cat) => {
            acc[cat] = data[cat] || [];
            return acc;
          }, {} as Record<string, LookupOption[]>);
          setLookups(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch lookups:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllLookups();
  }, [categories.join(",")]);

  return { lookups, loading };
}
