import assert from 'node:assert'

export function assertHexString(
    value: string,
    name = 'value'
): asserts value is `0x${string}` {
    const hexRegex = /^(0x)[0-9a-f]+$/i

    assert(
        hexRegex.test(value.toLowerCase()),
        `${name} should be a valid hex string, ${name}: ${value}`
    )
}
