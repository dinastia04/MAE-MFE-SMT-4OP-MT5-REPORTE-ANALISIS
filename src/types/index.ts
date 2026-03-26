export interface Operation {
  id: string;
  symbol: string;
  activationTime: Date;
  closeTime: Date;
  comment: string;
  entryPrice: number;
  type: 'buy' | 'sell';
  volume: number;
  sl: number;
  tp: number;
  pnl: number;
  commission: number;
  durationSec: number;
  model: string;
}

export interface Candle {
  datetime: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  ema100?: number;
  ema200?: number;
  ema100Trend?: 'ALCISTA' | 'BAJISTA';
  ema200Trend?: 'ALCISTA' | 'BAJISTA';
  rsi?: number;
  macd?: number;
}

export interface JourneyPoint {
  time: Date;
  close: number;
  high: number;
  low: number;
}

export interface TradeResult {
  id: string;
  symbol: string;
  activationTime: Date;
  closeTime: Date;
  comment: string;
  sl: number;
  tp: number;
  model: string;
  type: 'buy' | 'sell';
  volume: number;
  pnl: number;
  commission: number;
  maePts: number;
  mfePts: number;
  maeDollars: number;
  mfeDollars: number;
  slDist: number;
  tpDist: number;
  durationMin: number;
  journey: JourneyPoint[];
  entryPrice: number;
  ema100?: number;
  ema200?: number;
  ema100Trend?: 'ALCISTA' | 'BAJISTA';
  ema200Trend?: 'ALCISTA' | 'BAJISTA';
  rsi?: number;
  macd?: number;
}

export interface ModelAnalysis {
  modelo: string;
  total: number;
  winners: number;
  losers: number;
  winRate: number;
  pnlTotal: number;
  pnlProm: number;
  comisiones: number;
  pnlNeto: number;
  maeProm: number;
  maeMed: number;
  mfeProm: number;
  mfeMed: number;
  maeVsSl: number;
  mfeVsTp: number;
  ratio: number;
  tiempoBenProm: number;
  tiempoBenMed: number;
  tiempoPerProm: number;
  tiempoPerMed: number;
  pctTiempoBen: number;
  bestMinMean: number;
  bestMinMeanVal: number;
  bestMinSum: number;
  top10Min: { minute: number; mean: number; median: number; count: number }[];
  beResults: { nivel: string; pnlTotal: number; mejora: number; tradesMod: number }[];
  slLevels: { nivel: string; alcanzaron: number; llegaronTp: number; hitSl: number; successRate: number }[];
  halfPnl: number;
  halfDiff: number;
  pnlEma100: number;
  pnlEma200: number;
  clasif: {
    BIEN: { count: number; pnlProm: number };
    NEUTRAL: { count: number; pnlProm: number };
    MAL: { count: number; pnlProm: number };
  };
}
