import React, { useState, useMemo } from 'react';
import { TradeResult, ModelAnalysis } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Search, FilterX } from 'lucide-react';

interface FiltersViewProps {
  results: TradeResult[];
  models: ModelAnalysis[];
}

export function FiltersView({ results, models }: FiltersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell' | null>(null);
  const [ema100Pos, setEma100Pos] = useState<'ALCISTA' | 'BAJISTA' | null>(null);
  const [ema200Pos, setEma200Pos] = useState<'ALCISTA' | 'BAJISTA' | null>(null);
  const [ema100Trend, setEma100Trend] = useState<'ALCISTA' | 'BAJISTA' | null>(null);
  const [ema200Trend, setEma200Trend] = useState<'ALCISTA' | 'BAJISTA' | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const clearFilters = () => {
    setSearchTerm('');
    setTradeType(null);
    setEma100Pos(null);
    setEma200Pos(null);
    setEma100Trend(null);
    setEma200Trend(null);
    setSelectedModel(null);
  };

  const filteredResults = useMemo(() => {
    return results.filter((op) => {
      // 1. Search Term Filter (ignore brackets in comment)
      if (searchTerm.trim() !== '') {
        const cleanComment = op.comment.replace(/[\[\]]/g, '').toLowerCase();
        const searchTerms = searchTerm.replace(/[\[\]]/g, '').toLowerCase().split(' ').filter(t => t.trim() !== '');
        const matchesSearch = searchTerms.every(term => cleanComment.includes(term));
        if (!matchesSearch) return false;
      }

      // 2. Trade Type Filter
      if (tradeType && op.type.toLowerCase() !== tradeType) return false;

      // 3. Model Filter
      if (selectedModel && op.model !== selectedModel) return false;

      // 4. EMA 100 Position Filter
      if (ema100Pos) {
        const pos100 = op.ema100 ? (op.entryPrice > op.ema100 ? 'ALCISTA' : 'BAJISTA') : 'N/A';
        if (pos100 !== ema100Pos) return false;
      }

      // 5. EMA 200 Position Filter
      if (ema200Pos) {
        const pos200 = op.ema200 ? (op.entryPrice > op.ema200 ? 'ALCISTA' : 'BAJISTA') : 'N/A';
        if (pos200 !== ema200Pos) return false;
      }

      // 6. EMA 100 Trend Filter
      if (ema100Trend) {
        const trend100 = op.ema100Trend || 'N/A';
        if (trend100 !== ema100Trend) return false;
      }

      // 7. EMA 200 Trend Filter
      if (ema200Trend) {
        const trend200 = op.ema200Trend || 'N/A';
        if (trend200 !== ema200Trend) return false;
      }

      return true;
    }).sort((a, b) => a.activationTime.getTime() - b.activationTime.getTime());
  }, [results, searchTerm, tradeType, ema100Pos, ema200Pos, ema100Trend, ema200Trend, selectedModel]);

  const chartData = useMemo(() => {
    let cumulative = 0;
    return filteredResults.map((op, index) => {
      cumulative += op.pnl;
      return {
        index: index + 1,
        time: op.activationTime.toLocaleString(),
        pnl: op.pnl,
        cumulativePnl: cumulative,
        model: op.model,
      };
    });
  }, [filteredResults]);

  const totalPnl = chartData.length > 0 ? chartData[chartData.length - 1].cumulativePnl : 0;
  const winRate = filteredResults.length > 0 
    ? (filteredResults.filter(r => r.pnl > 0).length / filteredResults.length) * 100 
    : 0;

  const FilterButton = ({ active, onClick, children, colorClass = 'bg-emerald-600 hover:bg-emerald-500 text-white' }: any) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
        active 
          ? `${colorClass} shadow-lg ring-2 ring-offset-2 ring-offset-zinc-950 ring-emerald-500` 
          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-zinc-500" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar en comentarios (ej. 'rebote', 'fuerte tendencia')..."
          className="w-full pl-12 pr-4 py-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl">
        
        {/* Trade Type */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Tipo de Operación</h3>
          <div className="flex flex-wrap gap-2">
            <FilterButton 
              active={tradeType === 'buy'} 
              onClick={() => setTradeType(tradeType === 'buy' ? null : 'buy')}
              colorClass="bg-blue-600 hover:bg-blue-500 text-white"
            >
              COMPRAS
            </FilterButton>
            <FilterButton 
              active={tradeType === 'sell'} 
              onClick={() => setTradeType(tradeType === 'sell' ? null : 'sell')}
              colorClass="bg-red-600 hover:bg-red-500 text-white"
            >
              VENTAS
            </FilterButton>
          </div>
        </div>

        {/* Model */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Modelo</h3>
          <div className="flex flex-wrap gap-2">
            {models.map(m => (
              <FilterButton 
                key={m.modelo}
                active={selectedModel === m.modelo} 
                onClick={() => setSelectedModel(selectedModel === m.modelo ? null : m.modelo)}
                colorClass="bg-purple-600 hover:bg-purple-500 text-white"
              >
                {m.modelo}
              </FilterButton>
            ))}
          </div>
        </div>

        {/* EMA 100 Position */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Posición vs EMA 100</h3>
          <div className="flex flex-wrap gap-2">
            <FilterButton 
              active={ema100Pos === 'ALCISTA'} 
              onClick={() => setEma100Pos(ema100Pos === 'ALCISTA' ? null : 'ALCISTA')}
              colorClass="bg-teal-600 hover:bg-teal-500 text-white"
            >
              ALCISTA
            </FilterButton>
            <FilterButton 
              active={ema100Pos === 'BAJISTA'} 
              onClick={() => setEma100Pos(ema100Pos === 'BAJISTA' ? null : 'BAJISTA')}
              colorClass="bg-orange-600 hover:bg-orange-500 text-white"
            >
              BAJISTA
            </FilterButton>
          </div>
        </div>

        {/* EMA 200 Position */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Posición vs EMA 200</h3>
          <div className="flex flex-wrap gap-2">
            <FilterButton 
              active={ema200Pos === 'ALCISTA'} 
              onClick={() => setEma200Pos(ema200Pos === 'ALCISTA' ? null : 'ALCISTA')}
              colorClass="bg-teal-600 hover:bg-teal-500 text-white"
            >
              ALCISTA
            </FilterButton>
            <FilterButton 
              active={ema200Pos === 'BAJISTA'} 
              onClick={() => setEma200Pos(ema200Pos === 'BAJISTA' ? null : 'BAJISTA')}
              colorClass="bg-orange-600 hover:bg-orange-500 text-white"
            >
              BAJISTA
            </FilterButton>
          </div>
        </div>

        {/* EMA 100 Trend */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Dirección EMA 100</h3>
          <div className="flex flex-wrap gap-2">
            <FilterButton 
              active={ema100Trend === 'ALCISTA'} 
              onClick={() => setEma100Trend(ema100Trend === 'ALCISTA' ? null : 'ALCISTA')}
              colorClass="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              ALCISTA
            </FilterButton>
            <FilterButton 
              active={ema100Trend === 'BAJISTA'} 
              onClick={() => setEma100Trend(ema100Trend === 'BAJISTA' ? null : 'BAJISTA')}
              colorClass="bg-rose-600 hover:bg-rose-500 text-white"
            >
              BAJISTA
            </FilterButton>
          </div>
        </div>

        {/* EMA 200 Trend */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Dirección EMA 200</h3>
          <div className="flex flex-wrap gap-2">
            <FilterButton 
              active={ema200Trend === 'ALCISTA'} 
              onClick={() => setEma200Trend(ema200Trend === 'ALCISTA' ? null : 'ALCISTA')}
              colorClass="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              ALCISTA
            </FilterButton>
            <FilterButton 
              active={ema200Trend === 'BAJISTA'} 
              onClick={() => setEma200Trend(ema200Trend === 'BAJISTA' ? null : 'BAJISTA')}
              colorClass="bg-rose-600 hover:bg-rose-500 text-white"
            >
              BAJISTA
            </FilterButton>
          </div>
        </div>
        
        {/* Clear Filters */}
        <div className="space-y-3 flex flex-col justify-end">
          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-xl transition-colors border border-zinc-700"
          >
            <FilterX className="w-4 h-4" />
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center">
          <span className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Operaciones Filtradas</span>
          <span className="text-4xl font-bold text-white">{filteredResults.length}</span>
        </div>
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center">
          <span className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">PNL Total (Filtro)</span>
          <span className={`text-4xl font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${totalPnl.toFixed(2)}
          </span>
        </div>
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center">
          <span className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Win Rate (Filtro)</span>
          <span className="text-4xl font-bold text-blue-400">{winRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl h-[500px] flex flex-col">
        <h3 className="text-xl font-semibold text-white mb-6">Evolución del PNL</h3>
        {filteredResults.length > 0 ? (
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="index" 
                  stroke="#71717a" 
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#71717a" 
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'PNL Acumulado']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `Operación #${label} - ${payload[0].payload.time}`;
                    }
                    return `Operación #${label}`;
                  }}
                />
                <ReferenceLine y={0} stroke="#52525b" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="cumulativePnl" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#18181b', strokeWidth: 2 }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            No hay operaciones que coincidan con los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  );
}
