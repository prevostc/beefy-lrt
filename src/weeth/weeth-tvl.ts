import { runMain } from "../helpers/process";
import {
    breakdownToBalances,
    getDecimalValue,
    getLPBreakdownByVaultId,
    getVaultsByChain,
    ppfsToVaultSharesRate,
} from "../helpers/beefy";
import { BeefyVaultV7Abi } from "../abi/BeefyVaultV7";
import { BeefyChain, createPublicClientFromBeefyChain } from "../helpers/chain";
import { printData } from "../helpers/print";
import Decimal from "decimal.js";
import { weethVaultIds } from "./config";


runMain(async () => {
    const vaultsByChain = await getVaultsByChain(weethVaultIds);
    const lpBreakDowns = await getLPBreakdownByVaultId(weethVaultIds);
    const calculationDetails: any[] = [];
    const tokenTvl: { [key: string]: Decimal } = {};

    for (const [chainStr, vaults] of Object.entries(vaultsByChain)) {
        const chain = chainStr as BeefyChain;
        const client = createPublicClientFromBeefyChain(chain);

        for (const vault of vaults) {
            const contract = {
                address: vault.earnContractAddress,
                abi: BeefyVaultV7Abi,
            };

            const [rawPpfs, totalSupply] = await Promise.all([
                client.readContract({
                    ...contract,
                    functionName: "getPricePerFullShare",
                }),
                client.readContract({
                    ...contract,
                    functionName: "totalSupply",
                }),
            ]);

            // derive token balances
            const vaultDecimals = 18;
            const mooBalance = getDecimalValue(totalSupply, vaultDecimals);
            const shareRate = ppfsToVaultSharesRate(
                vaultDecimals,
                vault.tokenDecimals,
                rawPpfs
            );
            const underlyingBalance = mooBalance.mul(shareRate);
            const breakdown = lpBreakDowns[vault.id];
            const tokenBalances = breakdownToBalances(
                vault,
                breakdown,
                underlyingBalance
            );

            // accounting
            calculationDetails.push({
                vaultId: vault.id,
                rawPpfs,
                totalSupply,
                mooBalance: mooBalance.toString(),
                shareRate: shareRate.toString(),
                underlyingBalance: underlyingBalance.toString(),
                breakdown,
                tokenBalances,
            });

            for (const { token, balance } of Object.values(tokenBalances)) {
                if (balance.isZero()) {
                    continue;
                }
                if (!tokenTvl[token]) {
                    tokenTvl[token] = new Decimal(0);
                }

                tokenTvl[token] = tokenTvl[token].add(balance);
            }
        }
    }

    //printData(calculationDetails);
    printData({
        tokenTvl,
    });
});
