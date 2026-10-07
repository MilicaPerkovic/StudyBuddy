import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from './api.js';

/** Loads `path` on mount (and when it changes); returns { data, error, loading, reload }. */
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    return api(path)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((err) => setState({ data: null, error: errorMessage(err), loading: false }));
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
