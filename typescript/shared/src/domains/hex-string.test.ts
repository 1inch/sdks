import {HexString} from './hex-string'

describe('HexString Unit Test', () => {
    test('should create from bigint', async () => {
        const hexString = HexString.fromBigInt(
            BigInt('1461501637330902918203684832716283019655932542975')
        )
        expect(hexString.toString()).toEqual(
            '0xffffffffffffffffffffffffffffffffffffffff'
        )
    })

    test('should not create from bigint because string is not valid address', async () => {
        expect(() => HexString.fromBigInt(BigInt('qqq'))).toThrow()
    })

    test('should covert to bigint', async () => {
        const hexString = HexString.fromBigInt(
            BigInt('1461501637330902918203684832716283019655932542975')
        )
        expect(hexString.toBigInt()).toEqual(
            BigInt('1461501637330902918203684832716283019655932542975')
        )
    })

    test('should not create because hexString should not be undefined', async () => {
        // @ts-expect-error not allowed type
        expect(() => new HexString(undefined)).toThrow()
    })

    test('should not create because hexString should not be valid hex string', async () => {
        // @ts-expect-error not allowed type
        expect(() => new HexString(false)).toThrow()
    })

    test('should not create because hexString is empty', async () => {
        expect(() => new HexString('')).toThrow()
    })

    test('should not create because hexString has length less than 3', async () => {
        expect(() => new HexString('0x')).toThrow()
    })

    test('should not create because hexString not start from 0x', async () => {
        expect(
            () =>
                new HexString(
                    'eba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e'
                )
        ).toThrow()
    })

    test('should not create from 00 because hexString not start from 0x', async () => {
        expect(() => new HexString('00')).toThrow()
    })

    test('should not create from aa because hexString not start from 0x', async () => {
        expect(() => new HexString('aa')).toThrow()
    })

    test('should create from 0xaa because valid hex string', async () => {
        expect(() => new HexString('0xaa')).not.toThrow()
    })

    test('should not create because hexString is not valid hex string', async () => {
        expect(
            () =>
                new HexString(
                    '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30eg'
                )
        ).toThrow()
    })

    test('should convert to string', async () => {
        const hexString = new HexString(
            '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e'
        )
        expect(hexString.toString()).toEqual(
            '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e'
        )
    })

    test('should convert to string and back to object', async () => {
        const hexString = new HexString(
            '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e'
        )
        const strOfHexString = hexString.toString()

        const repairedHexString = new HexString(strOfHexString)

        expect(repairedHexString).toEqual(hexString)
    })

    test('should convert to json', async () => {
        const hexString = new HexString(
            '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e'
        )
        expect(JSON.stringify(hexString)).toEqual(
            '"0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e"'
        )
    })

    test('should convert to json and back to object', async () => {
        const hexString = new HexString(
            '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e'
        )
        const jsonHexStringes = JSON.stringify(hexString)

        const repairedHexString = new HexString(JSON.parse(jsonHexStringes))

        expect(repairedHexString).toEqual(hexString)
    })

    test('should convert to json complex object', async () => {
        const obj = {
            hexString: new HexString(
                '0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e'
            ),
            str: 'string',
            number: 123,
            b: true
        }

        const jsonObj = JSON.stringify(obj, null, 2)

        expect(jsonObj).toEqual(`{
  "hexString": "0xeba2df809e7a612a0a0d444ccfa5c839624bdc00dd29e3340d46df3870f8a30e",
  "str": "string",
  "number": 123,
  "b": true
}`)
    })

    test('should create from 0x0000000000000000000000000000000000000000 because valid hex string', async () => {
        expect(
            () => new HexString('0x0000000000000000000000000000000000000000')
        ).not.toThrow()
    })
})
