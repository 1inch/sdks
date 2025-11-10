import { assertHexString } from './should-be-hex-string'

describe('Unit Test assertHexString ', () => {
  test('should accept empty hex string 0x', async () => {
    expect(() => assertHexString('0x')).not.toThrow()
  })

  test('should throw error because value not start from 0x', async () => {
    expect(() => assertHexString('fffffffffffffffffffffffffffffffffffffffff')).toThrow()
  })

  test('should throw error because value is not valid hex string', async () => {
    expect(() => assertHexString('0xfffffffffffffffffffffffffffffffffffffffg')).toThrow()
  })

  test('should ok because value is valid hex string', async () => {
    expect(() => assertHexString('0xfffffffffffffffffffffffffffffffffffffffff')).not.toThrow()
  })

  test('should not be ok because value 00 not start from 0x', async () => {
    expect(() => assertHexString('00')).toThrow()
  })

  test('should not be ok because value aa not start from 0x', async () => {
    expect(() => assertHexString('aa')).toThrow()
  })

  test('should ok because value is valid hex string 0xaa', async () => {
    expect(() => assertHexString('0xaa')).not.toThrow()
  })
})
