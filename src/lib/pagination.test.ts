import { describe, it, expect } from 'vitest'
import {
  parsePaginationParams,
  calculatePaginationMeta,
  calculateSkipTake,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from './pagination'

describe('parsePaginationParams', () => {
  it('returns defaults when no params provided', () => {
    expect(parsePaginationParams({})).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE })
  })

  it('parses valid page and pageSize', () => {
    expect(parsePaginationParams({ page: '3', pageSize: '50' })).toEqual({ page: 3, pageSize: 50 })
  })

  it('clamps page to minimum of 1', () => {
    expect(parsePaginationParams({ page: '0' })).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE })
    expect(parsePaginationParams({ page: '-5' })).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE })
  })

  it('clamps pageSize to MAX_PAGE_SIZE when too large', () => {
    expect(parsePaginationParams({ pageSize: '999' })).toEqual({ page: 1, pageSize: MAX_PAGE_SIZE })
  })

  it('falls back to default when pageSize is 0 (falsy)', () => {
    expect(parsePaginationParams({ pageSize: '0' })).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE })
  })

  it('clamps negative pageSize to 1', () => {
    expect(parsePaginationParams({ pageSize: '-5' })).toEqual({ page: 1, pageSize: 1 })
  })

  it('handles non-numeric strings as defaults', () => {
    expect(parsePaginationParams({ page: 'abc', pageSize: 'xyz' })).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    })
  })
})

describe('calculatePaginationMeta', () => {
  it('calculates metadata for a single page', () => {
    const meta = calculatePaginationMeta(5, { page: 1, pageSize: 20 })
    expect(meta).toEqual({
      page: 1,
      pageSize: 20,
      totalCount: 5,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })
  })

  it('calculates metadata for multiple pages', () => {
    const meta = calculatePaginationMeta(45, { page: 2, pageSize: 20 })
    expect(meta).toEqual({
      page: 2,
      pageSize: 20,
      totalCount: 45,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    })
  })

  it('has no next page on last page', () => {
    const meta = calculatePaginationMeta(40, { page: 2, pageSize: 20 })
    expect(meta.hasNextPage).toBe(false)
    expect(meta.hasPrevPage).toBe(true)
  })

  it('clamps page to totalPages when page exceeds total', () => {
    const meta = calculatePaginationMeta(10, { page: 99, pageSize: 20 })
    expect(meta.page).toBe(1)
  })

  it('handles zero total count', () => {
    const meta = calculatePaginationMeta(0, { page: 1, pageSize: 20 })
    expect(meta.totalPages).toBe(0)
    expect(meta.page).toBe(1)
    expect(meta.hasNextPage).toBe(false)
    expect(meta.hasPrevPage).toBe(false)
  })
})

describe('calculateSkipTake', () => {
  it('calculates skip and take for first page', () => {
    expect(calculateSkipTake({ page: 1, pageSize: 20 })).toEqual({ skip: 0, take: 20 })
  })

  it('calculates skip and take for later pages', () => {
    expect(calculateSkipTake({ page: 3, pageSize: 10 })).toEqual({ skip: 20, take: 10 })
  })
})
