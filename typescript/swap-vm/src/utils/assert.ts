// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

export class AssertionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssertionError'
  }
}

export function assert(value: unknown, message = 'Assertion failed'): asserts value {
  if (!value) {
    throw new AssertionError(message)
  }
}
