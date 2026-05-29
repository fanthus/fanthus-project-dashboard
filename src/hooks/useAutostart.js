import { isTauri } from '@tauri-apps/api/core';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import { useCallback, useEffect, useState } from 'react';

export function useAutostart() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(isTauri());
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!isTauri()) {
      setLoading(false);
      return;
    }

    try {
      setEnabled(await isEnabled());
      setError('');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setAutostart = useCallback(
    async (next) => {
      if (!isTauri()) return;

      setLoading(true);
      setError('');
      try {
        if (next) await enable();
        else await disable();
        setEnabled(next);
      } catch (err) {
        setError(String(err));
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  return { enabled, loading, error, setAutostart, available: isTauri() };
}
