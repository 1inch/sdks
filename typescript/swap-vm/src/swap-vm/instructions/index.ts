import {emptyInstruction} from './empty'
import * as balances from './balances'

export * from './balances'

export const allInstructions = [
    emptyInstruction,
    balances.balancesXD,
    balances.setBalancesXD
] as const

export const aquaInstruction = [emptyInstruction] as const
