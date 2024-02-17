import {
    arbitrum,
    aurora,
    avalanche,
    base,
    bsc,
    canto,
    celo,
    cronos,
    fantom,
    fuse,
    gnosis,
    harmonyOne,
    kava,
    linea,
    mainnet,
    mantle,
    metis,
    moonbeam,
    moonriver,
    optimism,
    polygon,
    polygonZkEvm,
    type Chain as ViemChain,
    zkSync,
} from "viem/chains";
import { addressBook } from "blockchain-addressbook";
import { createPublicClient, http } from "viem";

export type BeefyChain = keyof typeof addressBook;

export const allChainIds: BeefyChain[] = Object.keys(
    addressBook
) as BeefyChain[];

const VIEM_CHAINS: Record<BeefyChain, ViemChain | null> = {
    arbitrum: arbitrum,
    aurora: aurora,
    avax: avalanche,
    base: base,
    bsc: bsc,
    canto: canto,
    celo: celo,
    cronos: cronos,
    fantom: fantom,
    ethereum: mainnet,
    emerald: null,
    one: harmonyOne,
    heco: null,
    fuse: fuse,
    gnosis: gnosis,
    kava: kava,
    linea: linea,
    polygon: polygon,
    mantle: mantle,
    moonbeam: moonbeam,
    moonriver: moonriver,
    metis: metis,
    optimism: optimism,
    zkevm: polygonZkEvm,
    zksync: zkSync,
};

export const createPublicClientFromBeefyChain = (chain: BeefyChain) => {
    const viemChain = VIEM_CHAINS[chain];
    if (!viemChain) {
        throw new Error(`Chain ${chain} not supported`);
    }
    return createPublicClient({
        chain: viemChain,
        transport: http(),
        batch: {
            multicall: true,
        },
    });
};
