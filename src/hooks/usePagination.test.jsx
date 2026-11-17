import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import usePagination from './usePagination.jsx'

const liste = Array.from({ length: 23 }, (_, i) => i + 1)

describe('usePagination', () => {
  it('decoupe la liste et cache la barre quand elle ne sert pas', () => {
    const { result } = renderHook(() => usePagination(liste, { options: [6, 12, 24] }))
    expect(result.current.visibles).toEqual(liste.slice(0, 12))
    expect(result.current.barre).not.toBeNull()
    const petit = renderHook(() => usePagination([1, 2, 3], { options: [6, 12, 24] }))
    expect(petit.result.current.barre).toBeNull()
  })
  it('revient a la page 1 quand la cle change', () => {
    const { result, rerender } = renderHook(({ cle }) => usePagination(liste, { options: [5, 10], cle }), { initialProps: { cle: 'a' } })
    act(() => result.current.barre.props.onPageChange(3))
    expect(result.current.visibles).toEqual([21, 22, 23])
    rerender({ cle: 'b' })
    expect(result.current.page).toBe(1)
  })
})
