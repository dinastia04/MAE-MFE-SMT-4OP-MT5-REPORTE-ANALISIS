import Papa from 'papaparse';
import { Operation, Candle } from '../types';
import { parse, isValid } from 'date-fns';

export function parseOperations(file: File): Promise<Operation[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const ops: Operation[] = results.data
            .map((row: any) => {
              // Handle different date formats if needed, assuming YYYY.MM.DD HH:mm:ss
              const activationStr = row['Hora Activacion'] || row['Time'] || '';
              const closeStr = row['Hora Cierre'] || row['Time close'] || '';
              
              const activationTime = new Date(activationStr.replace(/\./g, '-'));
              const closeTime = new Date(closeStr.replace(/\./g, '-'));

              if (!isValid(activationTime) || !isValid(closeTime)) {
                return null;
              }

              return {
                id: row['ID Orden'] || row['Ticket'] || '',
                symbol: row['Simbolo'] || row['Symbol'] || '',
                activationTime,
                closeTime,
                comment: row['Comentario'] || row['Comment'] || '',
                entryPrice: parseFloat(row['Entrada'] || row['Price'] || '0'),
                type: (row['Tipo'] || row['Type'] || '').toLowerCase().includes('buy') ? 'buy' : 'sell',
                volume: parseFloat(row['Volumen'] || row['Volume'] || '0'),
                sl: parseFloat(row['STL'] || row['S/L'] || '0'),
                tp: parseFloat(row['TP'] || row['T/P'] || '0'),
                pnl: parseFloat(row['PNL'] || row['Profit'] || '0'),
                commission: parseFloat(row['Comision'] || row['Commission'] || '0'),
                durationSec: parseFloat(row['Duracion Posicion (seg)'] || '0'),
                model: extractModel(row['Comentario'] || row['Comment'] || ''),
              };
            })
            .filter((op): op is Operation => op !== null && op.symbol.toUpperCase().includes('NDX'));
          
          resolve(ops);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}

function extractModel(comment: string): string {
  if (!comment) return 'OTHER';
  const c = comment.toUpperCase();
  if (c.includes('LITE 3.1 3V') || c.includes('LITE 3.1[3V]')) return 'LITE 3.1 3V';
  if (c.includes('LITE 3.1')) return 'LITE 3.1';
  if (c.includes('LITE')) return 'LITE';
  if (c.includes('G3.1 3B')) return 'G3.1 3B';
  if (c.includes('G3.1')) return 'G3.1';
  return 'OTHER';
}

export function parseHistory(file: File): Promise<Candle[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.trim().split('\n');
        const candles: Candle[] = [];
        
        // Skip header if present, but usually MT5 history might or might not have one.
        // We check if the first line starts with a date-like string.
        let startIndex = 0;
        if (lines.length > 0 && !lines[0].match(/^\d{4}\.\d{2}\.\d{2}/)) {
          startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].trim().split(/[\s,;]+/);
          if (parts.length >= 6) {
            // parts[0] = YYYY.MM.DD, parts[1] = HH:MM
            const dateStr = `${parts[0].replace(/\./g, '-')}T${parts[1]}:00`;
            const dt = new Date(dateStr);
            if (isValid(dt)) {
              // Try to find the first numeric column after time
              let openIdx = 2;
              while (openIdx < parts.length && isNaN(parseFloat(parts[openIdx]))) {
                openIdx++;
              }
              
              if (openIdx + 3 < parts.length) {
                candles.push({
                  datetime: dt,
                  open: parseFloat(parts[openIdx]),
                  high: parseFloat(parts[openIdx + 1]),
                  low: parseFloat(parts[openIdx + 2]),
                  close: parseFloat(parts[openIdx + 3]),
                });
              }
            }
          }
        }
        
        // Sort by datetime
        candles.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

        // Calculate EMAs, RSI, and MACD
        let ema100 = 0;
        let ema200 = 0;
        let ema12 = 0;
        let ema26 = 0;
        const k100 = 2 / (100 + 1);
        const k200 = 2 / (200 + 1);
        const k12 = 2 / (12 + 1);
        const k26 = 2 / (26 + 1);

        let avgGain = 0;
        let avgLoss = 0;

        for (let i = 0; i < candles.length; i++) {
          const close = candles[i].close;
          
          // EMAs and MACD
          if (i === 0) {
            ema100 = close;
            ema200 = close;
            ema12 = close;
            ema26 = close;
          } else {
            ema100 = (close - ema100) * k100 + ema100;
            ema200 = (close - ema200) * k200 + ema200;
            ema12 = (close - ema12) * k12 + ema12;
            ema26 = (close - ema26) * k26 + ema26;
          }
          candles[i].ema100 = ema100;
          candles[i].ema200 = ema200;
          candles[i].macd = ema12 - ema26;

          // EMA Trends (based on 50 periods ago)
          if (i >= 50) {
            candles[i].ema100Trend = ema100 > candles[i - 50].ema100! ? 'ALCISTA' : 'BAJISTA';
            candles[i].ema200Trend = ema200 > candles[i - 50].ema200! ? 'ALCISTA' : 'BAJISTA';
          }

          // RSI
          if (i > 0) {
            const change = close - candles[i - 1].close;
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? -change : 0;

            if (i <= 14) {
              avgGain += gain / 14;
              avgLoss += loss / 14;
              if (i === 14) {
                const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
                candles[i].rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
              }
            } else {
              avgGain = (avgGain * 13 + gain) / 14;
              avgLoss = (avgLoss * 13 + loss) / 14;
              const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
              candles[i].rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
            }
          }
        }

        resolve(candles);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    // MT5 history files are often UTF-16 LE, but FileReader reads as UTF-8 by default.
    // Let's try to read as UTF-16LE first, if it fails or looks weird, we could fallback.
    // For web, it's safer to read as text and let the browser handle it, or specify encoding.
    reader.readAsText(file, 'UTF-16LE');
  });
}
