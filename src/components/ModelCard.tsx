import React from 'react';
import { ModelAnalysis } from '../types';

interface ModelCardProps {
  key?: string | number;
  model: ModelAnalysis;
}

export function ModelCard({ model }: ModelCardProps) {
  const bestSl = model.slLevels.length > 0
    ? model.slLevels.reduce((prev, current) => (prev.successRate > current.successRate) ? prev : current)
    : { nivel: 'N/A', successRate: 0 };
  
  const bestBe = model.beResults.length > 0
    ? model.beResults.reduce((prev, current) => (prev.mejora > current.mejora) ? prev : current)
    : { mejora: 0, nivel: 'N/A' };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-white space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <h3 className="text-xl font-bold text-emerald-400">{model.modelo}</h3>
        <span className="text-sm text-zinc-400">{model.total} Ops</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Win Rate</p>
          <p className="text-lg font-medium">{model.winRate.toFixed(1)}%</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">PNL Neto</p>
          <p className={`text-lg font-medium ${model.pnlNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${model.pnlNeto.toFixed(2)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">MAE Prom</p>
          <p className="text-lg font-medium text-red-400">${model.maeProm.toFixed(2)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">MFE Prom</p>
          <p className="text-lg font-medium text-emerald-400">${model.mfeProm.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-zinc-800">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">MAE vs SL</span>
          <span className="font-medium">{model.maeVsSl.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">MFE vs TP</span>
          <span className="font-medium">{model.mfeVsTp.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Ratio MFE/MAE</span>
          <span className="font-medium">{model.ratio.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-zinc-800">
        <h4 className="text-sm font-semibold text-zinc-300">Recomendaciones</h4>
        <div className="bg-black/50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Mejor BE</span>
            <span className="font-medium text-emerald-400">{bestBe.nivel} (+${bestBe.mejora.toFixed(2)})</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Mejor SL</span>
            <span className="font-medium text-emerald-400">{bestSl.nivel} ({bestSl.successRate.toFixed(1)}%)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Mejor Minuto</span>
            <span className="font-medium text-emerald-400">{model.bestMinMean} (${model.bestMinMeanVal.toFixed(2)}/op)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Half TP Diff</span>
            <span className={`font-medium ${model.halfDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {model.halfDiff >= 0 ? '+' : ''}${model.halfDiff.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
