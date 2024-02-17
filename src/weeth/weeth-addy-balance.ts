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

const vaultIds = ["equilibria-arb-eeth", "aura-weeth-reth"];

runMain(async (argv) => {
    const userAddress = argv[0];
    if (!userAddress) {
        throw new Error("User address is required");
    }

    const vaultsByChain = await getVaultsByChain(vaultIds);
    const lpBreakDowns = await getLPBreakdownByVaultId(vaultIds);
    const calculationDetails: any[] = [];
    const balanceByToken: { [key: string]: Decimal } = {};

    for (const [chainStr, vaults] of Object.entries(vaultsByChain)) {
        const chain = chainStr as BeefyChain;
        const client = createPublicClientFromBeefyChain(chain);

        for (const vault of vaults) {
            const contract = {
                address: vault.earnContractAddress,
                abi: BeefyVaultV7Abi,
            };

            const [rawPpfs, totalSupply, rawMooBalance] = await Promise.all([
                client.readContract({
                    ...contract,
                    functionName: "getPricePerFullShare",
                }),
                client.readContract({
                    ...contract,
                    functionName: "totalSupply",
                }),
                client.readContract({
                    ...contract,
                    functionName: "balanceOf",
                    args: [userAddress],
                }),
            ]);

            // derive token balances
            const vaultDecimals = 18;
            const mooBalance = getDecimalValue(rawMooBalance, vaultDecimals);
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
                rawMooBalance,
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
                if (!balanceByToken[token]) {
                    balanceByToken[token] = new Decimal(0);
                }

                balanceByToken[token] = balanceByToken[token].add(balance);
            }
        }
    }

    //printData(calculationDetails);
    printData({
        investor: userAddress,
        balanceByToken,
    });
});
