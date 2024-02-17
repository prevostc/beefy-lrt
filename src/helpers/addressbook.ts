import { Hex } from "viem";
import { addressBook } from "blockchain-addressbook";
import { BeefyChain } from "./chain";

export function getTokenByAddress(chain: BeefyChain, address: Hex) {
    const chainAddressBook = addressBook[chain];
    if (!chainAddressBook) {
        throw new Error(`Chain ${chain} is not supported`);
    }

    const token = Object.values(chainAddressBook.tokens).find(
        (token) =>
            token.address.toLocaleLowerCase() === address.toLocaleLowerCase()
    );
    if (!token) {
        throw new Error(`Token ${address} is not supported on chain ${chain}`);
    }

    return token;
}

export function getTokenByName(chain: BeefyChain, name: string) {
    const chainAddressBook = addressBook[chain];
    if (!chainAddressBook) {
        throw new Error(`Chain ${chain} is not supported`);
    }

    const token = chainAddressBook.tokens[name];
    if (!token) {
        throw new Error(`Token ${name} is not supported on chain ${chain}`);
    }

    return token;
}
