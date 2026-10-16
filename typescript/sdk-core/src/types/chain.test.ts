import { describe, it, expect } from 'vitest'
import { NetworkEnum } from './chain'

describe('NetworkEnum', () => {
  it('should map networks to chain ids', () => {
    expect(NetworkEnum.ETHEREUM).toBe(1)
    expect(NetworkEnum.POLYGON).toBe(137)
    expect(NetworkEnum.ZKSYNC).toBe(324)
    expect(NetworkEnum.BINANCE).toBe(56)
    expect(NetworkEnum.ARBITRUM).toBe(42161)
    expect(NetworkEnum.AVALANCHE).toBe(43114)
    expect(NetworkEnum.OPTIMISM).toBe(10)
    expect(NetworkEnum.GNOSIS).toBe(100)
    expect(NetworkEnum.COINBASE).toBe(8453)
    expect(NetworkEnum.LINEA).toBe(59144)
    expect(NetworkEnum.SONIC).toBe(146)
    expect(NetworkEnum.UNICHAIN).toBe(130)
    expect(NetworkEnum.ROBINHOOD).toBe(4663)
    expect(NetworkEnum.MONAD).toBe(143)
    expect(NetworkEnum.CRONOS).toBe(25)
    expect(NetworkEnum.HYPEREVM).toBe(999)
    expect(NetworkEnum.ARC).toBe(5042)
  })
})
