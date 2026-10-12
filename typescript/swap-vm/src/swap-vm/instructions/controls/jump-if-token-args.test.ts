// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString } from '@1inch/sdk-core'
import { JumpIfTokenArgs } from './jump-if-token-args'

describe('JumpIfTokenArgs', () => {
  const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
  const TOKEN_1 = new Address('0x1111111111111111111111111111111111111111')

  // ControlsArgsBuilder.buildJumpIfToken(TOKEN_1, 5)
  const SOLIDITY_JUMP_IF_TOKEN_HEX = '0x11111111111111111111111111111111111111110005'

  it('should encode, decode and serialize to JSON', () => {
    const args = new JumpIfTokenArgs(USDC, 12n)
    const encoded = JumpIfTokenArgs.CODER.encode(args)
    const decoded = JumpIfTokenArgs.decode(encoded)

    expect(encoded.toString()).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000c')
    expect(decoded.token.equal(USDC)).toBe(true)
    expect(decoded.nextPC).toBe(12n)
    expect(args.toJSON()).toEqual({
      token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      nextPC: 12n,
    })
  })

  it('should match ControlsArgsBuilder.buildJumpIfToken byte layout', () => {
    const encoded = JumpIfTokenArgs.CODER.encode(new JumpIfTokenArgs(TOKEN_1, 5n))

    expect(encoded.toString()).toBe(SOLIDITY_JUMP_IF_TOKEN_HEX)
    expect(encoded.bytesCount()).toBe(22)
  })

  it('should decode bytes produced by ControlsArgsBuilder.buildJumpIfToken', () => {
    const decoded = JumpIfTokenArgs.decode(new HexString(SOLIDITY_JUMP_IF_TOKEN_HEX))

    expect(decoded.token.toString()).toBe(TOKEN_1.toString())
    expect(decoded.nextPC).toBe(5n)
  })

  it('should reject data using a truncated 10-byte token tail', () => {
    expect(() => JumpIfTokenArgs.decode(new HexString('0x9d4a2e9eb0ce3606eb48000c'))).toThrow(
      'Can not consume 20 bytes',
    )
  })
})
