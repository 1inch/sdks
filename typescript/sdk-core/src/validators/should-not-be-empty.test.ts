import { assertNotEmpty } from './should-not-be-empty'

describe('Unit Test shouldHaveSizeMore', () => {
  test('should throw error because value should not be undefined', async () => {
    expect(() => assertNotEmpty(undefined)).toThrow()
  })

  test('should throw error because value should not be null', async () => {
    expect(() => assertNotEmpty(null)).toThrow()
  })

  test('should throw error because value should not be empty string', async () => {
    expect(() => assertNotEmpty('')).toThrow()
  })

  test('should throw error because value should not be empty array', async () => {
    expect(() => assertNotEmpty([])).toThrow()
  })

  test('should throw error because value should not be empty object', async () => {
    expect(() => assertNotEmpty({})).toThrow()
  })

  test('should not throw error because value is number', async () => {
    expect(() => assertNotEmpty(0)).not.toThrow()
  })

  test('should not throw error because value is boolean', async () => {
    expect(() => assertNotEmpty(true)).not.toThrow()
  })

  test('should not throw error because value is not empty string', async () => {
    expect(() => assertNotEmpty('I am the string')).not.toThrow()
  })

  test('should not throw error because value is not empty array', async () => {
    expect(() => assertNotEmpty([true])).not.toThrow()
  })

  test('should not throw error because value is not empty object', async () => {
    expect(() => assertNotEmpty({ a: 123 })).not.toThrow()
  })
})
