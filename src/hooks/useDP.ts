import { useCallback } from 'react';
import { solveDP } from '../lib/dp';
import type { DPInput, DPResult } from '../types';

export function useDP() {
  const calculate = useCallback((input: DPInput): DPResult => {
    return solveDP(input);
  }, []);

  return { calculate };
}
