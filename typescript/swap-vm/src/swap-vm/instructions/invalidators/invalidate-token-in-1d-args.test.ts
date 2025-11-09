import { describe, it, expect } from 'vitest'
import { Address, AddressHalf } from '@1inch/sdk-shared'
import { InvalidateTokenIn1DArgs } from './invalidate-token-in-1d-args'
import { InvalidateTokenIn1DArgsCoder } from './invalidate-token-in-1d-args-coder'

describe('InvalidateTokenIn1DArgs', () => {
  const coder = new InvalidateTokenIn1DArgsCoder()
  const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
  const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

  const WETH_HALF = AddressHalf.fromAddress(WETH)
  const USDC_HALF = AddressHalf.fromAddress(USDC)

  it('should encode and decode token input half', () => {
    const args = new InvalidateTokenIn1DArgs(USDC_HALF)

    const encoded = coder.encode(args)
    expect(encoded.toString().length).toBe(22)

    const decoded = coder.decode(encoded)
    expect(decoded.tokenInHalf.toString()).toBe(USDC_HALF.toString())
  })

  it('should use static decode method', () => {
    const args = new InvalidateTokenIn1DArgs(USDC_HALF)
    const encoded = coder.encode(args)

    const decoded = InvalidateTokenIn1DArgs.decode(encoded)
    expect(decoded.tokenInHalf.toString()).toBe(USDC_HALF.toString())
  })

  it('should convert to JSON', () => {
    const args = new InvalidateTokenIn1DArgs(USDC_HALF)
    const json = args.toJSON()

    expect(json).toEqual({
      tokenIn: USDC_HALF.toString(),
    })
  })

  it('should handle different tokens', () => {
    const args = new InvalidateTokenIn1DArgs(WETH_HALF)
    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.tokenInHalf.toString()).toBe(WETH_HALF.toString())
  })
})
