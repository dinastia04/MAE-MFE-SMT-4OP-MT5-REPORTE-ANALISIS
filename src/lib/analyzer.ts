import { Operation, Candle, TradeResult, ModelAnalysis, JourneyPoint } from '../types';

function roundToM5(dt: Date): Date {
  const rounded = new Date(dt);
  const minute = Math.floor(rounded.getMinutes() / 5) * 5;
  rounded.setMinutes(minute, 0, 0);
  return rounded;
}

export function analyzeOperations(ops: Operation[], history: Candle[]): { results: TradeResult[], models: ModelAnalysis[] } {
  const histDict = new Map<number, Candle>();
  for (const c of history) {
    histDict.set(c.datetime.getTime(), c);
  }

  const results: TradeResult[] = [];
  let opsWithData = 0;

  for (const op of ops) {
    let maePts = 0;
    let mfePts = 0;
    const journey: JourneyPoint[] = [];

    let current = roundToM5(op.activationTime);
    const end = new Date(roundToM5(op.closeTime).getTime() + 5 * 60000);

    const prevCandleTime = current.getTime() - 5 * 60000;
    const prevCandle = histDict.get(prevCandleTime);
    const ema100 = prevCandle?.ema100;
    const ema200 = prevCandle?.ema200;

    while (current <= end) {
      const candle = histDict.get(current.getTime());
      if (candle) {
        let adverse = 0;
        let favorable = 0;

        if (op.type === 'buy') {
          adverse = op.entryPrice - candle.low;
          favorable = candle.high - op.entryPrice;
        } else {
          adverse = candle.high - op.entryPrice;
          favorable = op.entryPrice - candle.low;
        }

        maePts = Math.max(maePts, adverse);
        mfePts = Math.max(mfePts, favorable);

        journey.push({
          time: new Date(current),
          close: candle.close,
          high: candle.high,
          low: candle.low,
        });
      }
      current = new Date(current.getTime() + 5 * 60000);
    }

    if (journey.length > 0) {
      opsWithData++;
    }

    let slDist = 0;
    let tpDist = 0;
    if (op.type === 'buy') {
      slDist = op.entryPrice - op.sl;
      tpDist = op.tp - op.entryPrice;
    } else {
      slDist = op.sl - op.entryPrice;
      tpDist = op.entryPrice - op.tp;
    }

    const maeDollars = maePts * op.volume;
    const mfeDollars = mfePts * op.volume;

    results.push({
      id: op.id,
      symbol: op.symbol,
      activationTime: op.activationTime,
      closeTime: op.closeTime,
      comment: op.comment,
      sl: op.sl,
      tp: op.tp,
      model: op.model,
      type: op.type,
      volume: op.volume,
      pnl: op.pnl,
      commission: op.commission,
      maePts,
      mfePts,
      maeDollars,
      mfeDollars,
      slDist,
      tpDist,
      durationMin: op.durationSec / 60,
      journey,
      entryPrice: op.entryPrice,
      ema100,
      ema200,
    });
  }

  const modelNames = ['LITE', 'LITE 3.1', 'LITE 3.1 3V', 'G3.1', 'G3.1 3B', 'OTHER'];
  const models: ModelAnalysis[] = [];

  for (const modelName of modelNames) {
    const modelOps = results.filter((r) => r.model === modelName);
    if (modelOps.length > 0) {
      models.push(analyzeModel(modelOps, modelName));
    }
  }

  return { results, models };
}

function analyzeModel(modelOps: TradeResult[], modelName: string): ModelAnalysis {
  const total = modelOps.length;
  const winners = modelOps.filter((o) => o.pnl > 0).length;
  const losers = modelOps.filter((o) => o.pnl < 0).length;
  const winRate = (winners / total) * 100;

  const pnlTotal = modelOps.reduce((sum, o) => sum + o.pnl, 0);
  const pnlProm = pnlTotal / total;
  const comisiones = modelOps.reduce((sum, o) => sum + o.commission, 0);
  const pnlNeto = pnlTotal - comisiones;

  let pnlEma100 = 0;
  let pnlEma200 = 0;

  modelOps.forEach((o) => {
    if (o.ema100 !== undefined) {
      if ((o.type === 'buy' && o.entryPrice > o.ema100) || (o.type === 'sell' && o.entryPrice < o.ema100)) {
        pnlEma100 += o.pnl;
      }
    }
    if (o.ema200 !== undefined) {
      if ((o.type === 'buy' && o.entryPrice > o.ema200) || (o.type === 'sell' && o.entryPrice < o.ema200)) {
        pnlEma200 += o.pnl;
      }
    }
  });

  const maeProm = modelOps.reduce((sum, o) => sum + o.maeDollars, 0) / total;
  const sortedMae = [...modelOps].map(o => o.maeDollars).sort((a, b) => a - b);
  const maeMed = sortedMae[Math.floor(sortedMae.length / 2)] || 0;

  const mfeProm = modelOps.reduce((sum, o) => sum + o.mfeDollars, 0) / total;
  const sortedMfe = [...modelOps].map(o => o.mfeDollars).sort((a, b) => a - b);
  const mfeMed = sortedMfe[Math.floor(sortedMfe.length / 2)] || 0;

  let sumMaeVsSl = 0;
  let countMaeVsSl = 0;
  let sumMfeVsTp = 0;
  let countMfeVsTp = 0;
  let sumRatio = 0;
  let countRatio = 0;

  modelOps.forEach((o) => {
    if (o.slDist !== 0) {
      sumMaeVsSl += (o.maePts / o.slDist) * 100;
      countMaeVsSl++;
    }
    if (o.tpDist !== 0) {
      sumMfeVsTp += (o.mfePts / o.tpDist) * 100;
      countMfeVsTp++;
    }
    if (o.maeDollars !== 0) {
      sumRatio += o.mfeDollars / o.maeDollars;
      countRatio++;
    }
  });

  const maeVsSl = countMaeVsSl > 0 ? sumMaeVsSl / countMaeVsSl : 0;
  const mfeVsTp = countMfeVsTp > 0 ? sumMfeVsTp / countMfeVsTp : 0;
  const ratio = countRatio > 0 ? sumRatio / countRatio : 0;

  let sumBenMin = 0;
  let sumPerMin = 0;
  const benMins: number[] = [];
  const perMins: number[] = [];
  let sumPctBen = 0;

  modelOps.forEach((o) => {
    let barsBen = 0;
    let barsPer = 0;
    o.journey.forEach((c) => {
      if (o.type === 'buy') {
        if (c.close > o.entryPrice) barsBen++;
        else barsPer++;
      } else {
        if (c.close < o.entryPrice) barsBen++;
        else barsPer++;
      }
    });
    const totalBars = barsBen + barsPer;
    const benMin = barsBen * 5;
    const perMin = barsPer * 5;
    const pctBen = totalBars > 0 ? (barsBen / totalBars) * 100 : 50;

    sumBenMin += benMin;
    sumPerMin += perMin;
    benMins.push(benMin);
    perMins.push(perMin);
    sumPctBen += pctBen;
  });

  const tiempoBenProm = sumBenMin / total;
  const tiempoPerProm = sumPerMin / total;
  benMins.sort((a, b) => a - b);
  perMins.sort((a, b) => a - b);
  const tiempoBenMed = benMins[Math.floor(benMins.length / 2)] || 0;
  const tiempoPerMed = perMins[Math.floor(perMins.length / 2)] || 0;
  const pctTiempoBen = sumPctBen / total;

  const minuteData = new Map<number, number[]>();
  modelOps.forEach((o) => {
    o.journey.forEach((c, idx) => {
      const minOff = idx + 1;
      let pnl = 0;
      if (o.type === 'buy') {
        pnl = (c.close - o.entryPrice) * o.volume;
      } else {
        pnl = (o.entryPrice - c.close) * o.volume;
      }
      if (!minuteData.has(minOff)) minuteData.set(minOff, []);
      minuteData.get(minOff)!.push(pnl);
    });
  });

  const minStats: { minute: number; mean: number; median: number; sum: number; count: number }[] = [];
  minuteData.forEach((pnls, minute) => {
    const sum = pnls.reduce((a, b) => a + b, 0);
    const mean = sum / pnls.length;
    const sorted = [...pnls].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] || 0;
    minStats.push({ minute, mean, median, sum, count: pnls.length });
  });

  minStats.sort((a, b) => b.mean - a.mean);
  const top10Min = minStats.slice(0, 10);
  const bestMinMeanObj = minStats[0] || { minute: 1, mean: 0, sum: 0 };
  
  minStats.sort((a, b) => b.sum - a.sum);
  const bestMinSumObj = minStats[0] || { minute: 1, mean: 0, sum: 0 };

  const beResults = [0.25, 0.33, 0.50, 0.75].map((pct) => {
    let totalPnlBe = 0;
    let modified = 0;
    modelOps.forEach((o) => {
      const trigger = o.tpDist * pct;
      if (o.mfePts >= trigger) {
        if (o.pnl < 0) {
          totalPnlBe += 0;
          modified++;
        } else {
          totalPnlBe += o.pnl;
        }
      } else {
        totalPnlBe += o.pnl;
      }
    });
    return {
      nivel: `${Math.round(pct * 100)}% TP`,
      pnlTotal: totalPnlBe,
      mejora: totalPnlBe - pnlTotal,
      tradesMod: modified,
    };
  });

  const slLevels = [0.20, 0.25, 0.33, 0.50, 0.67, 0.75, 0.80].map((pct) => {
    let reached = 0;
    let reachedTp = 0;
    let hitSl = 0;
    modelOps.forEach((o) => {
      const trigger = o.tpDist * pct;
      if (o.mfePts >= trigger) {
        reached++;
        if (o.pnl > 0) reachedTp++;
        else hitSl++;
      }
    });
    return {
      nivel: `${Math.round(pct * 100)}% TP`,
      alcanzaron: reached,
      llegaronTp: reachedTp,
      hitSl,
      successRate: reached > 0 ? (reachedTp / reached) * 100 : 0,
    };
  }).filter(l => l.alcanzaron > 0);

  let halfPnl = 0;
  modelOps.forEach((o) => {
    const halfTrigger = o.tpDist * 0.5;
    if (o.mfePts >= halfTrigger) {
      const pnlHalf = halfTrigger * o.volume * 0.5;
      const pnlRest = o.pnl * 0.5;
      halfPnl += pnlHalf + pnlRest;
    } else {
      halfPnl += o.pnl;
    }
  });
  const halfDiff = halfPnl - pnlTotal;

  const clasif = {
    BIEN: { count: 0, pnlTotal: 0, pnlProm: 0 },
    NEUTRAL: { count: 0, pnlTotal: 0, pnlProm: 0 },
    MAL: { count: 0, pnlTotal: 0, pnlProm: 0 },
  };

  modelOps.forEach((o) => {
    const maeOk = o.slDist !== 0 ? (o.maePts / o.slDist) * 100 < 50 : false;
    const mfeOk = o.tpDist !== 0 ? (o.mfePts / o.tpDist) * 100 > 30 : false;
    const ratioOk = o.maeDollars !== 0 ? (o.mfeDollars / o.maeDollars) > 1 : false;

    const score = (maeOk ? 1 : 0) + (mfeOk ? 1 : 0) + (ratioOk ? 1 : 0);
    let cl: 'BIEN' | 'NEUTRAL' | 'MAL' = 'MAL';
    if (score >= 2) cl = 'BIEN';
    else if (score === 1) cl = 'NEUTRAL';

    clasif[cl].count++;
    clasif[cl].pnlTotal += o.pnl;
  });

  (['BIEN', 'NEUTRAL', 'MAL'] as const).forEach((cl) => {
    clasif[cl].pnlProm = clasif[cl].count > 0 ? clasif[cl].pnlTotal / clasif[cl].count : 0;
  });

  return {
    modelo: modelName,
    total,
    winners,
    losers,
    winRate,
    pnlTotal,
    pnlProm,
    comisiones,
    pnlNeto,
    maeProm,
    maeMed,
    mfeProm,
    mfeMed,
    maeVsSl,
    mfeVsTp,
    ratio,
    tiempoBenProm,
    tiempoBenMed,
    tiempoPerProm,
    tiempoPerMed,
    pctTiempoBen,
    bestMinMean: bestMinMeanObj.minute,
    bestMinMeanVal: bestMinMeanObj.mean,
    bestMinSum: bestMinSumObj.minute,
    top10Min,
    beResults,
    slLevels,
    halfPnl,
    halfDiff,
    pnlEma100,
    pnlEma200,
    clasif,
  };
}
