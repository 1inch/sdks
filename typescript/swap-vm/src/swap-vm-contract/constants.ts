import {Address, NetworkEnum} from '@1inch/sdk-shared'

/**
 * SwapVM contract addresses by chain ID
 */
export const SWAP_VM_CONTRACT_ADDRESSES: Record<NetworkEnum, Address> = {
    [NetworkEnum.ETHEREUM]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    ),
    [NetworkEnum.BINANCE]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    ),
    [NetworkEnum.POLYGON]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    ),
    [NetworkEnum.ARBITRUM]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    ),
    [NetworkEnum.AVALANCHE]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    ),
    [NetworkEnum.GNOSIS]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    ),
    [NetworkEnum.COINBASE]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    ),
    [NetworkEnum.OPTIMISM]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    ),
    [NetworkEnum.FANTOM]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    ),
    [NetworkEnum.ZKSYNC]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    ),
    [NetworkEnum.LINEA]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    ),
    [NetworkEnum.UNICHAIN]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    ),
    [NetworkEnum.SONIC]: new Address(
        '0x11d305af1691D3aca504f6216532675f7Dd07D11'
    )
}
