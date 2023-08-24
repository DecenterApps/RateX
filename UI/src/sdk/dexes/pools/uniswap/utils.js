"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertRowPoolData = void 0;
var types_1 = require("./types");
function convertRowPoolData(poolData) {
    var getPoolInfo = function (poolInfoRaw) {
        var pool = poolInfoRaw[0];
        var token0 = poolInfoRaw[1];
        var token1 = poolInfoRaw[2];
        var tick = poolInfoRaw[3];
        var tickSpacing = poolInfoRaw[4];
        var fee = poolInfoRaw[5];
        var sqrtPriceX96 = poolInfoRaw[6];
        var liquidity = poolInfoRaw[7];
        return new types_1.PoolInfo(pool, token0, token1, tick, tickSpacing, fee, sqrtPriceX96, liquidity);
    };
    var getTickData = function (tickDataRaw) {
        var tick = tickDataRaw[0];
        var initialized = tickDataRaw[1];
        var liquidityNet = tickDataRaw[2];
        return new types_1.TickData(tick, initialized, liquidityNet);
    };
    var zeroForOneTicksRaw = poolData[1];
    var zeroForOneTicks = [];
    for (var i = 0; i < zeroForOneTicksRaw.length; i++) {
        zeroForOneTicks.push(getTickData(zeroForOneTicksRaw[i]));
    }
    var oneForZeroTicksRaw = poolData[2];
    var oneForZeroTicks = [];
    for (var i = 0; i < oneForZeroTicksRaw.length; i++) {
        oneForZeroTicks.push(getTickData(oneForZeroTicksRaw[i]));
    }
    return new types_1.PoolData(getPoolInfo(poolData[0]), zeroForOneTicks, oneForZeroTicks);
}
exports.convertRowPoolData = convertRowPoolData;
