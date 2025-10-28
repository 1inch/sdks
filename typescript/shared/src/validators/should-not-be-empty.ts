import assert from 'node:assert'

export function assertNotEmpty<T>(
    value: T,
    name = 'value'
): asserts value is NonNullable<T> {
    if (typeof value === 'number' || typeof value === 'boolean') {
        return
    }

    const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' &&
            value !== null &&
            Object.keys(value).length === 0)

    assert(!isEmpty, `${name} should not be empty, but ${name}: ${value}`)
}
