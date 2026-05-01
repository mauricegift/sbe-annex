import { useState, useEffect } from 'react';
import { groupsAPI } from '../lib/api';

export interface Group {
  id?: string;
  code: string;
  name: string;
  description?: string;
  specializations: string[];
}

interface UseGroupsReturn {
  groups: Group[];
  loading: boolean;
  error: string | null;
  allSpecializations: string[];
  contentSpecializations: string[];
  getSpecializationsForGroup: (groupCode: string) => string[];
}

let _cachedGroups: Group[] | null = null;
let _cacheTime: number | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export function useGroups(): UseGroupsReturn {
  const [groups, setGroups] = useState<Group[]>(_cachedGroups || []);
  const [loading, setLoading] = useState(!_cachedGroups);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    if (_cachedGroups && _cacheTime && now - _cacheTime < CACHE_TTL) {
      setGroups(_cachedGroups);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    groupsAPI.getGroups()
      .then((res) => {
        if (cancelled) return;
        const data: Group[] = res.data || [];
        _cachedGroups = data;
        _cacheTime = Date.now();
        setGroups(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch groups:', err);
        setError('Failed to load groups');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const allSpecializations = Array.from(
    new Set(groups.flatMap((g) => g.specializations || []))
  ).sort();

  // Content specializations include COMMON if not already there
  const contentSpecializations = allSpecializations.includes('COMMON')
    ? allSpecializations
    : allSpecializations.length > 0
    ? [...allSpecializations, 'COMMON'].sort()
    : allSpecializations;

  const getSpecializationsForGroup = (groupCode: string): string[] => {
    const group = groups.find((g) => g.code === groupCode);
    return group?.specializations || [];
  };

  return { groups, loading, error, allSpecializations, contentSpecializations, getSpecializationsForGroup };
}
