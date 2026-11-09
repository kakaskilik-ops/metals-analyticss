import { useEffect, useState } from 'react';

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

export function useAsyncData<T>(load: () => Promise<T>, key: string, enabled: boolean) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle' });
      return;
    }
    let active = true;
    setState({ status: 'loading' });
    load()
      .then((data) => {
        if (active) setState({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Неизвестная ошибка.',
          });
        }
      });
    return () => {
      active = false;
    };
    // The loader is a fresh closure each render; `key` and `attempt` define when a reload is wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, attempt]);

  return { state, reload: () => setAttempt((value) => value + 1) };
}
