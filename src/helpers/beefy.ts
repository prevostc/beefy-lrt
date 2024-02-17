import axios from "axios";
import { type Hex } from "viem";
import groupBy from "lodash/groupBy";
import Decimal from "decimal.js";
import { BeefyChain } from "./chain";
import { getTokenByAddress, getTokenByName } from "./addressbook";
import Token from "blockchain-addressbook/build/types/token";

Decimal.set({
    // make sure we have enough precision
    precision: 250,
    // configure the Decimals lib to format without exponents
    toExpNeg: -250,
    toExpPos: 250,
});

export type BeefyVault = {
    id: string;
    earnContractAddress: Hex;
    strategy: Hex;
    chain: BeefyChain;
    tokenDecimals: number;
    assets: string[];
};

export const getVaultsByChain = async (idFilter: string[]) => {
    const { data: vaults } = await axios.get<BeefyVault[]>(
        "https://api.beefy.finance/vaults"
    );

    const vaultsData = vaults.filter((vault) => idFilter.includes(vault.id));
    return groupBy(vaultsData, "chain") as {
        [chain in BeefyChain]: BeefyVault[];
    };
};

export type BeefyVaultBreakdown = {
    [id: string]: {
        price: number;
        tokens: Hex[];
        balances: string[];
        totalSupply: string;
    };
};
export const getLPBreakdownByVaultId = async (idFilter: string[]) => {
    const { data: breakdowns } = await axios.get<BeefyVaultBreakdown>(
        "https://api.beefy.finance/lps/breakdown"
    );

    return Object.fromEntries(
        Object.entries(breakdowns).filter(([id]) => idFilter.includes(id))
    );
};

// takes ppfs and compute the actual rate which can be directly multiplied by the vault balance
// this is derived from mooAmountToOracleAmount in beefy-v2 repo
export function ppfsToVaultSharesRate(
    mooTokenDecimals: number,
    depositTokenDecimals: number,
    ppfs: bigint
) {
    const mooTokenAmount = new Decimal("1.0");

    // go to chain representation
    const mooChainAmount = mooTokenAmount
        .mul(new Decimal(10).pow(mooTokenDecimals))
        .toDecimalPlaces(0);

    // convert to oracle amount in chain representation
    const oracleChainAmount = mooChainAmount.mul(new Decimal(ppfs.toString()));

    // go to math representation
    // but we can't return a number with more precision than the oracle precision
    const oracleAmount = oracleChainAmount
        .div(new Decimal(10).pow(mooTokenDecimals + depositTokenDecimals))
        .toDecimalPlaces(mooTokenDecimals);

    return oracleAmount;
}

export function getDecimalValue(value: bigint, decimals: number) {
    return new Decimal(value.toString()).div(new Decimal(10).pow(decimals));
}

export function breakdownToBalances(
    vault: BeefyVault,
    breakdown: BeefyVaultBreakdown[0],
    lpAmount: Decimal
) {
    const totalSupply = new Decimal(breakdown.totalSupply);
    let tokens: Token[];
    let tokenBalances;

    // if breakdown is empty this might be a single asset vault
    if (breakdown.tokens.length === 0) {
        tokens = [getTokenByName(vault.chain, vault.assets[0])];
        tokenBalances = [breakdown.totalSupply];
    } else {
        tokens = breakdown.tokens.map((token) =>
            getTokenByAddress(vault.chain, token)
        );
        tokenBalances = breakdown.balances;
    }

    // express breakdown as percentages of total lp
    const percentages = tokenBalances.map((balance) =>
        new Decimal(balance).div(totalSupply)
    );

    // express lpAmount as an array of token amounts
    return percentages.map((percentage, i) => {
        const token = tokens[i];
        return {
            balance: lpAmount.mul(percentage).toDecimalPlaces(token.decimals),
            token: token.symbol,
        };
    });
}
