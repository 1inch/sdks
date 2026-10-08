// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, expectTypeOf, it } from 'vitest'
import { assert, AssertionError } from './assert'

describe('assert', () => {
  it.each([true, 1, 1n, 'swap-vm', {}])('passes for truthy value %o', (value) => {
    expect(() => assert(value, 'should not throw')).not.toThrow()
  })

  it.each([false, 0, 0n, NaN, '', null, undefined])(
    'throws AssertionError with the given message for falsy value %o',
    (value) => {
      const check = (): void => assert(value, 'value must be truthy')

      expect(check).toThrow(AssertionError)
      expect(check).toThrow(
        expect.objectContaining({ name: 'AssertionError', message: 'value must be truthy' }),
      )
    },
  )

  it('uses a default message when none is given', () => {
    expect(() => assert(false)).toThrow(
      expect.objectContaining({ name: 'AssertionError', message: 'Assertion failed' }),
    )
  })

  it('narrows the asserted value as a TypeScript assertion function', () => {
    const input: unknown = 41n

    assert(typeof input === 'bigint', 'input must be a bigint')

    expectTypeOf(input).toEqualTypeOf<bigint>()
    expect(input + 1n).toBe(42n)
  })
})

describe('AssertionError', () => {
  it('is an Error subclass named AssertionError', () => {
    const error = new AssertionError('Reserves cannot be zero')

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('AssertionError')
    expect(error.message).toBe('Reserves cannot be zero')
    expect(String(error)).toBe('AssertionError: Reserves cannot be zero')
  })
})
