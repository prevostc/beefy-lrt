
# weETH

## User balance 

```bash

yarn --silent run vite-node ./src/weeth/weeth-addy-balance.ts 0x02a6faadc8fdacf8bf99951b3c6303ef19168149
{
  investor: '0x02a6faadc8fdacf8bf99951b3c6303ef19168149',
  balanceByToken: { weETH: '2.12164879061895879' }
}

yarn --silent run vite-node ./src/weeth/weeth-addy-balance.ts 0x161D61e30284A33Ab1ed227beDcac6014877B3DE
{
  investor: '0x161D61e30284A33Ab1ed227beDcac6014877B3DE',
  balanceByToken: { rETH: '0.001480947002211512', weETH: '0.00327225273766871' }
}

```

## TVL

```bash

yarn --silent run vite-node ./src/weeth/weeth-tvl.ts
{
  tokenTvl: { weETH: '259.067298595216009185', rETH: '54.37809084336381612' }
}
```
