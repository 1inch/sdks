import { AquaProtocolContract } from "@1inch/aqua-sdk";
import { ReadyEvmFork, setupEvm } from "./setup-evm";

describe('Default Strategies', () => {
  let forkNode: ReadyEvmFork


  beforeAll(async () => {
    forkNode = await setupEvm({chainId: 1})
  });

  test('should be able to ship basic strategy', () => {
    const liquidityProvider = forkNode.maker
    
    const tx = {
      to: forkNode.addresses.aqua,
      data: AquaProtocolContract.buildShipTx()
    }
  });
})
