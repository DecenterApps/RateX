import * as dotenv from 'dotenv';
import tokenList from '../UI/src/constants/tokenList.json'
import { getUniswapOutputAmount } from './util/uniswap';
import { RateX } from 'ratex-sdk'


dotenv.config();

const getTokenByTicker = (ticker: string) => {
    const result = tokenList.find(e => e.ticker == ticker);
    if (!result)
        throw new Error("Could not find the specified token: " + ticker)
    return result
}

const TEST_CASES = [
    {
        tokenIn: getTokenByTicker("WETH"),
        tokenOut: getTokenByTicker("USDT"),
        amount: 100
    },
    {
        tokenIn: getTokenByTicker("DAI"),
        tokenOut: getTokenByTicker("WBTC"),
        amount: 1000
    },
    {
        tokenIn: getTokenByTicker("DAI"),
        tokenOut: getTokenByTicker("WBTC"),
        amount: 10000
    },
    {
        tokenIn: getTokenByTicker("DAI"),
        tokenOut: getTokenByTicker("WBTC"),
        amount: 100000
    },
    {
        tokenIn: getTokenByTicker("USDT"),
        tokenOut: getTokenByTicker("MATIC"),
        amount: 1000
    },
    {
        tokenIn: getTokenByTicker("USDT"),
        tokenOut: getTokenByTicker("DAI"),
        amount: 100000
    }
]

interface CsvRow {
    [key: string]: string;
}

function isNumeric(value: string): boolean {
    return !isNaN(Number(value)) || value.endsWith("%") || value.endsWith("ms");
}

function printPrettyTable(csv: string): void {
    const lines: string[] = csv.trim().split('\n');
    const headers: string[] = lines[0].split(',');
    const rows: string[][] = lines.slice(1).map(line => line.split(','));

    const table: CsvRow[] = rows.map(row => {
        return headers.reduce((obj, header, index) => {
            obj[header] = row[index];
            return obj;
        }, {} as CsvRow);
    });

    const columnWidths: number[] = headers.map(header => Math.max(header.length, ...table.map(row => row[header].length)));

    const formatRow = (row: string[]): string => row.map((cell, i) => {
        if (isNumeric(cell)) {
            return cell.padStart(columnWidths[i]);
        } else {
            return cell.padEnd(columnWidths[i]);
        }
    }).join(' | ');

    console.log(formatRow(headers));
    console.log(columnWidths.map(width => '-'.repeat(width)).join('-|-'));

    table.forEach(row => {
        console.log(formatRow(headers.map(header => row[header])));
    });
}


const runTestOnChainId = async (chainId: 1 | 42161) => {
    let myRateX;
    if (chainId == 1) {
        myRateX = new RateX({
            rpcUrl: process.env.REACT_APP_MAINNET_URL || "",
            chainId: 1,
            graphApiKey: process.env.REACT_APP_GRAPH_API_KEY || ""
        });
    }
    else {
        myRateX = new RateX({
            rpcUrl: process.env.REACT_APP_ARBITRUM_URL || "",
            chainId: 42161,
            graphApiKey: process.env.REACT_APP_GRAPH_API_KEY || ""
        });
    }
    const ONE_INCH_API_KEY = process.env.REACT_APP_1INCH_API_KEY;
    let output = "Amount,From,To,RateX,RateX time,Uniswap,Uniswap time"
    if (ONE_INCH_API_KEY)
        output += ",1Inch,1Inch time"
    output += ",Competition max (C),RateX vs C\n"
    for (const { tokenIn, tokenOut, amount } of TEST_CASES) {
        await new Promise(e => setTimeout(e, 4000))
        console.log(`Swapping ${amount} ${tokenIn.ticker} for ${tokenOut.ticker} on chain id ${chainId}`)
        const tokenInAddress = tokenIn.address[chainId];
        const tokenOutAddress = tokenOut.address[chainId]
        const amountIn = BigInt(amount) * BigInt(10 ** tokenIn.decimals)

        const startTime = Date.now();
        const quote = await myRateX.getQuote(tokenInAddress, tokenOutAddress, amountIn)
        const quoteReadable = (parseFloat(quote.quote.toString()) / (10 ** tokenOut.decimals)).toFixed(3)
        const rateXTime = Date.now() - startTime;

        const uniswapStart = Date.now();
        const uniswapQuote = await getUniswapOutputAmount(tokenIn.address[chainId], tokenOut.address[chainId], amountIn, chainId);
        const uniswapQuoteReadable = (parseFloat(uniswapQuote.toString()) / (10 ** tokenOut.decimals)).toFixed(3);
        const uniswapTime = Date.now() - uniswapStart;
        let competitionsBest = uniswapQuoteReadable;
        output += `${amount},${tokenIn.ticker},${tokenOut.ticker},${quoteReadable},${rateXTime}ms,${uniswapQuoteReadable},${uniswapTime}ms`

        if (ONE_INCH_API_KEY) {
            const oneInchStart = Date.now();
            const URL = `https://api.1inch.dev/fusion/quoter/v2.0/${chainId}/quote/receive?fromTokenAddress=${tokenIn.address[chainId]}&toTokenAddress=${tokenOut.address[chainId]}&amount=${amountIn}&walletAddress=0x0000000000000000000000000000000000000000`;
            const oneInchQuoteObject = await fetch(URL, {
                headers: {
                    "Authorization": "Bearer " + ONE_INCH_API_KEY,
                    'Content-Type': 'application/json',
                }
            });
            const oneInchQuoteParsed = await oneInchQuoteObject.json();
            const oneInchQuote = oneInchQuoteParsed.toTokenAmount;
            const oneInchQuoteReadable = (oneInchQuote / (10 ** tokenOut.decimals)).toFixed(3);
            if (parseFloat(oneInchQuoteReadable) > parseFloat(competitionsBest))
                competitionsBest = oneInchQuoteReadable
            const oneInchTime = Date.now() - oneInchStart;
            output += `,${oneInchQuoteReadable},${oneInchTime}ms`
        }

        const rateXvsCompetition = (100 * (parseFloat(quoteReadable) - parseFloat(competitionsBest)) / parseFloat(competitionsBest)).toFixed(1);
        output += `,${competitionsBest},${(parseFloat(rateXvsCompetition) > 0) ? "+" + rateXvsCompetition : rateXvsCompetition}%\n`
    }
    console.log("\nCompleted test for chain id: " + chainId + "\n")
    printPrettyTable(output);
}

const runTests = async () => {
    console.log("Starting tests... Be patient, it may take up to 20 seconds for each pair to be swapped.")
    await new Promise(e => setTimeout(e, 2000));
    await runTestOnChainId(1)
    await runTestOnChainId(42161)
}
runTests();

export { }