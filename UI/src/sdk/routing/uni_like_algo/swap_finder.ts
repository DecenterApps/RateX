import {AlgoParams, QueueItem, TQuoteUniLike, TRouteWithQuote} from "./types";
import Queue from "mnemonist/queue";

export class SwapFinder {

    private algoParams: AlgoParams;
    private percentagesToSortedQuotes: Map<number, TRouteWithQuote[]>;
    private percentages: number[];
    private amountIn: bigint;
    private bestQuote: bigint;
    private bestSwap: TRouteWithQuote[];
    private queue: Queue<QueueItem>;
    private numOfSplits: number;

    public constructor(algoParams: AlgoParams, routesWithQuotes: TRouteWithQuote[], percentages: number[], amountIn: bigint) {
        this.algoParams = algoParams;
        this.percentages = percentages;
        this.amountIn = amountIn;
        this.percentagesToSortedQuotes = this.getSortedQuotes(routesWithQuotes);

        this.bestQuote = BigInt(0);
        this.bestSwap = [];
        this.queue = new Queue<QueueItem>();
        this.numOfSplits = 1;
    }

    private readyToFinishSplitting() {
        const maxSplitsReached: boolean = this.numOfSplits > this.algoParams.maxSplit;
        const bestSwapNotImprovedWithNewSplit: boolean =
            this.numOfSplits >= 3 && (this.bestSwap.length < this.numOfSplits - 1);

        return maxSplitsReached || bestSwapNotImprovedWithNewSplit;
    }

    public findBestRoute(): TQuoteUniLike {
        this.initBestQuoteAndSwapForFullAmount();
        this.initQueueWithHighestQuotes();

        while (this.queue.size > 0) {
            let layer = this.queue.size;
            this.numOfSplits++;
            if (this.readyToFinishSplitting()) {
                break;
            }
            this.processLayer(layer);
        }

        this.addMissingAmountIn();

        return {
            quote: this.bestQuote,
            routes: this.bestSwap
        };
    }

    private addMissingAmountIn() {
        const totalAmountIn = this.bestSwap.reduce((acc, route) => acc + route.amount.amountIn, BigInt(0));
        const diff = this.amountIn - totalAmountIn;
        if (diff > BigInt(0)) {
            this.bestSwap[this.bestSwap.length - 1].amount.amountIn += diff;
        }
    }

    private processLayer(layer: number) {
        while (layer > 0) {
            layer--;
            const q = this.queue.dequeue()!;
            this.processPairedItemsInLayer(q);
        }
    }

    private processPairedItemsInLayer(q: QueueItem) {
        for (let i = q.percentageIndex; i >= 0; --i) {
            const percentage = this.percentages[i];
            if (percentage > q.ramainingPercentage || !this.percentagesToSortedQuotes.has(percentage)) {
                continue;
            }
            this.processPairedItem(q, percentage, i);
        }
    }

    private processPairedItem(q: QueueItem, percentage: number, index: number) {
        const candidateRoutes = this.percentagesToSortedQuotes.get(percentage)!;
        const routeWithQuote = this.findFirstRouteNotUsingUsedPools(q.currentRoutes, candidateRoutes);
        if (!routeWithQuote) {
            return;
        }

        const newRemainingPercentage = q.ramainingPercentage - percentage;
        const newCurrentRoutes = [...q.currentRoutes, routeWithQuote];

        if (newRemainingPercentage === 0) {
            this.updateBestQuoteAndSwapIfBetter(newCurrentRoutes);
        }
        else {
            this.queue.enqueue({
                percentageIndex: index,
                currentRoutes: newCurrentRoutes,
                ramainingPercentage: newRemainingPercentage
            });
        }
    }

    private updateBestQuoteAndSwapIfBetter(currentRoutes: TRouteWithQuote[]) {
        const quote = currentRoutes.reduce((acc, route) => acc + route.quote, BigInt(0));
        if (quote > this.bestQuote) {
            this.bestQuote = quote;
            this.bestSwap = currentRoutes;
        }
    }

    private initBestQuoteAndSwapForFullAmount() {
        if (this.percentagesToSortedQuotes.has(100)) {
            this.bestQuote = this.percentagesToSortedQuotes.get(100)![0].quote;
            this.bestSwap = [this.percentagesToSortedQuotes.get(100)![0]];
        }
    }

    private initQueueWithHighestQuotes() {
        for (let i = this.percentages.length - 1; i >= 0; --i) {
            this.insertHigestQuoteForPercentageIfExist(i);
            this.insertSecondHigestQuoteForPercentageIfExist(i);
        }
    }

    private insertHigestQuoteForPercentageIfExist(percentageIndex: number) {
        const percentage = this.percentages[percentageIndex];
        if (this.percentagesToSortedQuotes.has(percentage)) {
            this.queue.enqueue({
                percentageIndex: percentageIndex,
                currentRoutes: [this.percentagesToSortedQuotes.get(percentage)![0]],
                ramainingPercentage: 100 - percentage
            });
        }
    }

    private insertSecondHigestQuoteForPercentageIfExist(percentageIndex: number) {
        const percentage = this.percentages[percentageIndex];
        if (this.percentagesToSortedQuotes.get(percentage)![1]) {
            this.queue.enqueue({
                percentageIndex: percentageIndex,
                currentRoutes: [this.percentagesToSortedQuotes.get(percentage)![1]],
                ramainingPercentage: 100 - percentage
            });
        }
    }

    private getSortedQuotes(routeWithQuotes: TRouteWithQuote[]) {
        const map = new Map<number, TRouteWithQuote[]>();
        routeWithQuotes.forEach(routeWithQuote => {
            const percentage = routeWithQuote.amount.percentage;
            if (!map.has(percentage)) {
                map.set(percentage, []);
            }
            map.get(percentage)?.push(routeWithQuote);
        });
        map.forEach((value, key) => {
            value.sort((a, b) => {
                return Number(b.quote - a.quote);
            })
        });

        return map;
    }

    private findFirstRouteNotUsingUsedPools(
        usedRoutes: TRouteWithQuote[],
        candidateRoutes: TRouteWithQuote[]
    ) {
        const usedPoolsSet = new Set<string>();
        usedRoutes.forEach(route => {
            route.route.steps.forEach(step => usedPoolsSet.add(step.pool.poolId));
        });

        for (const candidateRoute of candidateRoutes) {
            const candidatePools = candidateRoute.route.steps.map(step => step.pool.poolId);
            if (candidatePools.some(pool => usedPoolsSet.has(pool))) {
                continue;
            }
            return candidateRoute;
        }
        return null;
    }

}
