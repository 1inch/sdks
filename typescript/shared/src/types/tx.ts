/**
 * Call info type for transaction data
 * Matching limit-order-sdk pattern
 */
export type CallInfo = {
    to: string
    data: string
    value: bigint
}
