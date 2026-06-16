import { renderHook } from '@testing-library/react-native';
import { act } from 'react';
import { useDebounce } from '../../src/hooks/useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('returns initial value immediately', async () => {
    const { result } = await renderHook(() => useDebounce('hello', 400));
    expect(result.current).toBe('hello');
  });

  it('delays value update by specified ms', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    );
    await rerender({ value: 'ab' });
    expect(result.current).toBe('a');
    act(() => { jest.advanceTimersByTime(400); });
    expect(result.current).toBe('ab');
  });

  it('resets timer on rapid updates — only last value emits', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    );
    await rerender({ value: 'ab' });
    act(() => { jest.advanceTimersByTime(200); });
    await rerender({ value: 'abc' });
    act(() => { jest.advanceTimersByTime(400); });
    expect(result.current).toBe('abc');
  });
});
