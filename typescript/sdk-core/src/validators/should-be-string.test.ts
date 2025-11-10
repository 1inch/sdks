import { assertString } from './should-be-string'

describe('Unit Test ', () => {
  test('should throw error because string should not be undefined', async () => {
    expect(() => assertString(undefined)).toThrow()
  })

  test('should throw error because string should not be null', async () => {
    expect(() => assertString(null)).toThrow()
  })

  test('should throw error because string should not be bool', async () => {
    expect(() => assertString(true)).toThrow()
  })

  test('should throw error because string should not be number', async () => {
    expect(() => assertString(121)).toThrow()
  })

  test('should throw error because string should not be array', async () => {
    expect(() => assertString([121])).toThrow()
  })

  test('should throw error because string should not be object', async () => {
    expect(() => assertString({ a: 123 })).toThrow()
  })

  test('should validate because string is valid', async () => {
    expect(() => assertString('I am the string !')).not.toThrow()
  })

  test('should validate because empty string is valid', async () => {
    expect(() => assertString('')).not.toThrow()
  })
})
