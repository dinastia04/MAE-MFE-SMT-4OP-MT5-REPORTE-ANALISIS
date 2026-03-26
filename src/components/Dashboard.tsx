import React, { useState, useEffect, useCallback } from 'react';
import { ModelCard } from './ModelCard';
import { Glossary } from './Glossary';
import { FiltersView } from './filters/FiltersView';
import { parseOperations, parseHistory } from '../lib/parser';
import { analyzeOperations } from '../lib/analyzer';
import { generateExcel } from '../lib/excel';
import { ModelAnalysis, TradeResult } from '../types';
import { Download, Loader2, BarChart3, UploadCloud, FileCheck, FileWarning } from 'lucide-react';

const identifyFile = async (file: File): Promise<'ops' | 'hist' | 'unknown'> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Strip null bytes in case it's read as UTF-8 but is actually UTF-16LE
      const text = ((e.target?.result as string) || '').replace(/\0/g, '').toUpperCase();
      
      if (text.includes('SIMBOLO') || text.includes('TICKET') || text.includes('HORA ACTIVACION') || text.includes('HORA CIERRE')) {
        resolve('ops');
      } else if (/\d{4}\.\d{2}\.\d{2}/.test(text) || /\d{4}-\d{2}-\d{2}/.test(text)) {
        resolve('hist');
      } else {
        resolve('unknown');
      }
    };
    reader.readAsText(file.slice(0, 2000));
  });
};

export function Dashboard() {
  const [opsFile, setOpsFile] = useState<File | null>(null);
  const [histFile, setHistFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [models, setModels] = useState<ModelAnalysis[]>([]);
  const [results, setResults] = useState<TradeResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'filters'>('main');

  const handleAnalyze = useCallback(async (ops: File, hist: File) => {
    setAnalyzing(true);
    setError(null);

    try {
      const parsedOps = await parseOperations(ops);
      const parsedHist = await parseHistory(hist);

      if (parsedOps.length === 0) {
        throw new Error('No se encontraron operaciones de NDX válidas.');
      }
      if (parsedHist.length === 0) {
        throw new Error('No se encontraron datos históricos válidos.');
      }

      const { results: analyzedResults, models: analyzedModels } = analyzeOperations(parsedOps, parsedHist);
      setModels(analyzedModels);
      setResults(analyzedResults);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error durante el análisis.');
      // Reset files on error to allow re-uploading
      setOpsFile(null);
      setHistFile(null);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    if (opsFile && histFile && models.length === 0 && !analyzing && !error) {
      handleAnalyze(opsFile, histFile);
    }
  }, [opsFile, histFile, models.length, analyzing, error, handleAnalyze]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set dragging to false if we are leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    const files = Array.from(e.dataTransfer.files) as File[];
    const csvFiles = files.filter(f => f.name.toLowerCase().endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      setError('Por favor, arrastra archivos CSV válidos.');
      return;
    }

    let newOps: File | null = opsFile;
    let newHist: File | null = histFile;

    for (const file of csvFiles) {
      const type = await identifyFile(file);
      if (type === 'ops') newOps = file;
      else if (type === 'hist') newHist = file;
      else {
        setError(`No se pudo identificar el tipo de archivo para: ${file.name}`);
      }
    }

    if (newOps !== opsFile) setOpsFile(newOps);
    if (newHist !== histFile) setHistFile(newHist);
  };

  const handleExport = async () => {
    if (models.length === 0) return;
    try {
      await generateExcel(models, results, opsFile?.name || 'Desconocido', histFile?.name || 'Desconocido');
    } catch (err: any) {
      setError('Error al generar el Excel: ' + (err.message || ''));
    }
  };

  const reset = () => {
    setOpsFile(null);
    setHistFile(null);
    setModels([]);
    setResults([]);
    setError(null);
    setActiveTab('main');
  };

  return (
    <div 
      className={`min-h-screen bg-black text-white p-8 font-sans transition-colors duration-200 ${isDragging ? 'bg-zinc-900/50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/20 backdrop-blur-sm border-4 border-emerald-500 border-dashed m-4 rounded-3xl pointer-events-none">
          <div className="flex flex-col items-center gap-4 text-emerald-400">
            <UploadCloud className="w-24 h-24 animate-bounce" />
            <h2 className="text-3xl font-bold">Suelta tus CSVs aquí</h2>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-emerald-500" />
              <h1 className="text-3xl font-bold tracking-tight">Análisis NDX por Modelo</h1>
            </div>
            <p className="text-zinc-400 max-w-2xl">
              Arrastra tus archivos de operaciones y datos históricos en cualquier parte de la pantalla.
            </p>
          </div>
          {models.length > 0 && (
            <button
              onClick={reset}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              Nuevo Análisis
            </button>
          )}
        </header>

        {models.length === 0 && !analyzing && (
          <section className="flex flex-col items-center justify-center py-20 border-2 border-zinc-800 border-dashed rounded-3xl bg-zinc-950/50">
            <UploadCloud className="w-16 h-16 text-zinc-600 mb-6" />
            <h2 className="text-2xl font-semibold mb-2">Arrastra tus archivos CSV aquí</h2>
            <p className="text-zinc-500 mb-8 text-center max-w-md">
              Necesitamos dos archivos para el análisis: el historial de operaciones (MT5) y los datos de velas M5.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-3xl px-8">
              <div className={`flex-1 p-4 rounded-xl border flex items-center gap-3 ${opsFile ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                {opsFile ? <FileCheck className="w-6 h-6 shrink-0" /> : <FileWarning className="w-6 h-6 shrink-0" />}
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-sm">Operaciones</span>
                  <span className="text-xs truncate opacity-70">{opsFile ? opsFile.name : 'Esperando archivo...'}</span>
                </div>
              </div>
              
              <div className={`flex-1 p-4 rounded-xl border flex items-center gap-3 ${histFile ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                {histFile ? <FileCheck className="w-6 h-6 shrink-0" /> : <FileWarning className="w-6 h-6 shrink-0" />}
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-sm">Datos Históricos (M5)</span>
                  <span className="text-xs truncate opacity-70">{histFile ? histFile.name : 'Esperando archivo...'}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {analyzing && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <h2 className="text-2xl font-semibold animate-pulse">Procesando datos y calculando MAE/MFE...</h2>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {models.length > 0 && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Operaciones (MT5)</span>
                  <span className="text-sm text-emerald-400 truncate max-w-[200px] sm:max-w-xs">{opsFile?.name}</span>
                </div>
              </div>
              <div className="hidden sm:block w-px bg-zinc-800"></div>
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Datos Históricos (M5)</span>
                  <span className="text-sm text-emerald-400 truncate max-w-[200px] sm:max-w-xs">{histFile?.name}</span>
                </div>
              </div>
            </div>

            <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 pb-6 gap-4">
              <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setActiveTab('main')}
                  className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'main' 
                      ? 'bg-zinc-800 text-white shadow-md' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  Resultados por Modelo
                </button>
                <button
                  onClick={() => setActiveTab('filters')}
                  className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'filters' 
                      ? 'bg-zinc-800 text-white shadow-md' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  Filtros Avanzados
                </button>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-900/20 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                Exportar Excel
              </button>
            </section>
            
            {activeTab === 'main' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {models.map((model) => (
                  <ModelCard key={model.modelo} model={model} />
                ))}
              </div>
            ) : (
              <FiltersView results={results} models={models} />
            )}
          </div>
        )}

        {models.length > 0 && activeTab === 'main' && <Glossary />}
      </div>
    </div>
  );
}
