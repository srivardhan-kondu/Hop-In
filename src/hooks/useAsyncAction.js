import { useState } from 'react';

export function useAsyncAction(handler) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const execute = async (...args) => {
    setLoading(true);
    setError('');
    try {
      return await handler(...args);
    } catch (err) {
      setError(err?.message ?? 'Unexpected error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}
