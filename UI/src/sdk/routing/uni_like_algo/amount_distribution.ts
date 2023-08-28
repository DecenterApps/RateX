import {AmountPercentage} from "./types";

export default function calculateAmountDistribution(amountIn: bigint, distributionPercentage: number): AmountPercentage[] {
    const percentages: number[] = [];
    const amounts: bigint[] = [];
    for (let i = 1; i <= 100 / distributionPercentage; ++i) {
        percentages.push(distributionPercentage * i);
        amounts.push(amountIn * BigInt(distributionPercentage * i) / BigInt(100));
    }
    return amounts.map((amount, index) => {
        return {
            amountIn: amount,
            percentage: percentages[index]
        }
    });
}