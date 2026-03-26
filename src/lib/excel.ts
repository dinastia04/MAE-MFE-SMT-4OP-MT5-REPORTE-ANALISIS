import ExcelJS from 'exceljs';
import { ModelAnalysis, TradeResult } from '../types';

export async function generateExcel(models: ModelAnalysis[], results: TradeResult[], opsFileName: string, histFileName: string) {
  const wb = new ExcelJS.Workbook();

  const titleFont = { name: 'Calibri', size: 16, bold: true };
  const headerFont = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3F66' } };
  const goodFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
  const badFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
  const yellowFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };

  const newColHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8E44AD' } }; // Purple
  const newColFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4ECF7' } }; // Light purple
  const emaHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF009688' } }; // Teal
  const emaFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2F1' } }; // Light Teal
  const emaDirHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } }; // Blue
  const emaDirFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }; // Light Blue
  const indHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3F51B5' } }; // Indigo
  const indFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EAF6' } }; // Light Indigo

  // Resumen General
  const wsRes = wb.addWorksheet('Resumen General');
  wsRes.getCell('B2').value = 'RESUMEN COMPARATIVO POR MODELO - NDX';
  wsRes.getCell('B2').font = titleFont;

  wsRes.getCell('B4').value = 'Archivos Analizados:';
  wsRes.getCell('B4').font = { bold: true };
  wsRes.getCell('B5').value = `Operaciones (MT5): ${opsFileName}`;
  wsRes.getCell('B6').value = `Histórico (M5): ${histFileName}`;

  const headers = ['Modelo', 'Ops', 'Win Rate', 'PNL Total', 'PNL Neto', 'PNL EMA 100', 'PNL EMA 200', 'MAE Prom ($)', 'MFE Prom ($)', 'Ratio', 'Mejor Min', 'Mejor SL', 'Mejor BE'];
  let row = 8;

  headers.forEach((h, i) => {
    const cell = wsRes.getCell(row, 2 + i);
    cell.value = h;
    cell.font = headerFont;
    cell.fill = headerFill;
  });

  row = 9;

  models.forEach((a) => {
    const bestSl = a.slLevels.length > 0
      ? a.slLevels.reduce((prev, current) => (prev.successRate > current.successRate) ? prev : current)
      : { nivel: 'N/A', successRate: 0 };
    
    const bestBe = a.beResults.length > 0
      ? a.beResults.reduce((prev, current) => (prev.mejora > current.mejora) ? prev : current)
      : { mejora: 0, nivel: 'N/A' };

    const data = [
      a.modelo,
      a.total,
      `${a.winRate.toFixed(1)}%`,
      `$${a.pnlTotal.toFixed(2)}`,
      `$${a.pnlNeto.toFixed(2)}`,
      `$${a.pnlEma100.toFixed(2)}`,
      `$${a.pnlEma200.toFixed(2)}`,
      `$${a.maeProm.toFixed(2)}`,
      `$${a.mfeProm.toFixed(2)}`,
      a.ratio.toFixed(2),
      a.bestMinMean,
      bestSl.nivel,
      `$${bestBe.mejora > 0 ? '+' : ''}${bestBe.mejora.toFixed(2)}`
    ];

    data.forEach((d, i) => {
      wsRes.getCell(row, 2 + i).value = d;
    });
    row++;
  });

  for (let i = 2; i <= 12; i++) {
    wsRes.getColumn(i).width = 14;
  }

  // --- HOJA DE TODAS LAS OPERACIONES JUNTAS ---
  const wsAllOps = wb.addWorksheet('Todas las Operaciones');
  
  const allOpsHeaders = [
    'Modelo', 'ID', 'Symbol', 'Type', 'Activation Time', 'Close Time', 'Volume', 'Entry Price', 'SL', 'TP', 'Commission', 'PNL', 'Duration (Min)', 'Comment',
    'MAE (Pts)', 'MFE (Pts)', 'MAE ($)', 'MFE ($)', 'PNL BE 25%', 'PNL BE 30%', 'PNL BE 50%', 'PNL BE 75%',
    'Posición vs EMA 100', 'Posición vs EMA 200', 'Dirección EMA 100', 'Dirección EMA 200', 'RSI (14)', 'MACD'
  ];

  allOpsHeaders.forEach((h, i) => {
    const cell = wsAllOps.getCell(1, i + 1);
    cell.value = h;
    cell.font = headerFont;
    if (i >= 26) {
      cell.fill = indHeaderFill;
    } else if (i >= 24) {
      cell.fill = emaDirHeaderFill;
    } else if (i >= 22) {
      cell.fill = emaHeaderFill;
    } else if (i >= 14) {
      cell.fill = newColHeaderFill;
    } else {
      cell.fill = headerFill;
    }
  });

  let allOpsRow = 2;
  results.forEach((op) => {
    const pnlBE25 = op.mfePts >= (op.tpDist * 0.25) ? (op.pnl < 0 ? 0 : op.pnl) : op.pnl;
    const pnlBE30 = op.mfePts >= (op.tpDist * 0.30) ? (op.pnl < 0 ? 0 : op.pnl) : op.pnl;
    const pnlBE50 = op.mfePts >= (op.tpDist * 0.50) ? (op.pnl < 0 ? 0 : op.pnl) : op.pnl;
    const pnlBE75 = op.mfePts >= (op.tpDist * 0.75) ? (op.pnl < 0 ? 0 : op.pnl) : op.pnl;
    
    const posicionEma100 = op.ema100 ? (op.entryPrice > op.ema100 ? 'ALCISTA' : 'BAJISTA') : 'N/A';
    const posicionEma200 = op.ema200 ? (op.entryPrice > op.ema200 ? 'ALCISTA' : 'BAJISTA') : 'N/A';
    const direccionEma100 = op.ema100Trend || 'N/A';
    const direccionEma200 = op.ema200Trend || 'N/A';
    const rsiVal = op.rsi !== undefined ? op.rsi : 'N/A';
    const macdVal = op.macd !== undefined ? op.macd : 'N/A';

    const rowData = [
      op.model,
      op.id, op.symbol, op.type.toUpperCase(), op.activationTime, op.closeTime, op.volume, op.entryPrice, op.sl, op.tp, op.commission, op.pnl, op.durationMin, op.comment,
      op.maePts, op.mfePts, op.maeDollars, op.mfeDollars, pnlBE25, pnlBE30, pnlBE50, pnlBE75,
      posicionEma100, posicionEma200, direccionEma100, direccionEma200, rsiVal, macdVal
    ];
    
    rowData.forEach((val, i) => {
      const cell = wsAllOps.getCell(allOpsRow, i + 1);
      cell.value = val;
      if (i >= 26) {
        cell.fill = indFill;
        if (typeof val === 'number') {
          cell.numFmt = '0.00';
        }
      } else if (i >= 24) {
        cell.fill = emaDirFill;
        cell.font = { bold: true, color: { argb: val === 'ALCISTA' ? 'FF1B5E20' : (val === 'BAJISTA' ? 'FFB71C1C' : 'FF000000') } };
      } else if (i >= 22) {
        cell.fill = emaFill;
        cell.font = { bold: true, color: { argb: val === 'ALCISTA' ? 'FF1B5E20' : (val === 'BAJISTA' ? 'FFB71C1C' : 'FF000000') } };
      } else if (i >= 14) {
        cell.fill = newColFill;
      }
      
      if (val instanceof Date) {
        cell.numFmt = 'yyyy-mm-dd hh:mm:ss';
      }
      if (typeof val === 'number') {
        if (i === 6) cell.numFmt = '0.00'; 
        else if (i >= 7 && i <= 9) cell.numFmt = '0.00'; 
        else if (i === 12) cell.numFmt = '0.0'; 
        else if (i === 14 || i === 15) cell.numFmt = '0.00'; 
        else if (i === 10 || i === 11 || (i >= 16 && i <= 21)) cell.numFmt = '"$"#,##0.00'; 
      }
    });
    allOpsRow++;
  });
  
  wsAllOps.columns.forEach((col, i) => {
    if (i === 0) col.width = 25; 
    else if (i === 4 || i === 5) col.width = 20; 
    else if (i === 13) col.width = 30; 
    else if (i >= 22 && i <= 25) col.width = 20; 
    else if (i >= 26) col.width = 15; 
    else col.width = 15;
  });

  // Hojas por modelo
  models.forEach((a) => {
    const ws = wb.addWorksheet(a.modelo.substring(0, 31));
    let r = 2;

    ws.getCell(r, 2).value = `MODELO: ${a.modelo}`;
    ws.getCell(r, 2).font = titleFont;
    r += 2;

    ws.getCell(r, 2).value = 'RESUMEN GENERAL';
    ws.getCell(r, 2).font = { bold: true, size: 12 };
    r += 1;

    const resumen = [
      ['Total Operaciones', a.total],
      ['Ganadoras', a.winners],
      ['Perdedoras', a.losers],
      ['Win Rate', `${a.winRate.toFixed(1)}%`],
      ['PNL Total', `$${a.pnlTotal.toFixed(2)}`],
      ['Comisiones', `$${a.comisiones.toFixed(2)}`],
      ['PNL Neto', `$${a.pnlNeto.toFixed(2)}`],
      ['PNL EMA 100', `$${a.pnlEma100.toFixed(2)}`],
      ['PNL EMA 200', `$${a.pnlEma200.toFixed(2)}`],
    ];

    resumen.forEach(([label, val]) => {
      ws.getCell(r, 2).value = label;
      ws.getCell(r, 3).value = val;
      r++;
    });
    r++;

    ws.getCell(r, 2).value = 'MAE / MFE (EN DÓLARES)';
    ws.getCell(r, 2).font = { bold: true, size: 12 };
    r += 1;

    const maeMfe = [
      ['MAE Promedio', `$${a.maeProm.toFixed(2)}`],
      ['MAE Mediana', `$${a.maeMed.toFixed(2)}`],
      ['MFE Promedio', `$${a.mfeProm.toFixed(2)}`],
      ['MFE Mediana', `$${a.mfeMed.toFixed(2)}`],
      ['MAE vs SL %', `${a.maeVsSl.toFixed(1)}%`],
      ['MFE vs TP %', `${a.mfeVsTp.toFixed(1)}%`],
      ['Ratio MFE/MAE', a.ratio.toFixed(2)],
    ];

    maeMfe.forEach(([label, val]) => {
      ws.getCell(r, 2).value = label;
      ws.getCell(r, 3).value = val;
      r++;
    });
    r++;

    ws.getCell(r, 2).value = 'TIEMPO EN BENEFICIO / PÉRDIDA (minutos)';
    ws.getCell(r, 2).font = { bold: true, size: 12 };
    r += 1;

    const tiempo = [
      ['Tiempo Beneficio Prom', a.tiempoBenProm.toFixed(1)],
      ['Tiempo Beneficio Med', a.tiempoBenMed.toFixed(1)],
      ['Tiempo Pérdida Prom', a.tiempoPerProm.toFixed(1)],
      ['Tiempo Pérdida Med', a.tiempoPerMed.toFixed(1)],
      ['% Tiempo en Beneficio', `${a.pctTiempoBen.toFixed(1)}%`],
    ];

    tiempo.forEach(([label, val]) => {
      ws.getCell(r, 2).value = label;
      ws.getCell(r, 3).value = val;
      r++;
    });
    r++;

    ws.getCell(r, 2).value = 'MEJOR MINUTO PARA CERRAR';
    ws.getCell(r, 2).font = { bold: true, size: 12 };
    r += 1;

    ws.getCell(r, 2).value = `Mejor Minuto (Prom): ${a.bestMinMean} → $${a.bestMinMeanVal.toFixed(2)}/op`;
    r += 1;
    ws.getCell(r, 2).value = `Mejor Minuto (Total): ${a.bestMinSum}`;
    r += 2;

    if (a.top10Min.length > 0) {
      ws.getCell(r, 2).value = 'TOP 10 MINUTOS';
      ws.getCell(r, 2).font = { bold: true };
      r += 1;

      ['Minuto', 'PNL Prom ($)', 'PNL Med ($)', 'Ops'].forEach((h, i) => {
        const cell = ws.getCell(r, 2 + i);
        cell.value = h;
        cell.font = headerFont;
        cell.fill = headerFill;
      });
      r += 1;

      a.top10Min.forEach((m) => {
        ws.getCell(r, 2).value = m.minute;
        ws.getCell(r, 3).value = `$${m.mean.toFixed(2)}`;
        ws.getCell(r, 4).value = `$${m.median.toFixed(2)}`;
        ws.getCell(r, 5).value = m.count;
        r++;
      });
    }
    r++;

    ws.getCell(r, 2).value = 'SIMULACIÓN: MOVER SL A BREAK-EVEN';
    ws.getCell(r, 2).font = { bold: true, size: 12 };
    r += 1;

    ['Nivel', 'PNL Total', 'Mejora', 'Trades Mod'].forEach((h, i) => {
      const cell = ws.getCell(r, 2 + i);
      cell.value = h;
      cell.font = headerFont;
      cell.fill = headerFill;
    });
    r += 1;

    a.beResults.forEach((be) => {
      ws.getCell(r, 2).value = be.nivel;
      ws.getCell(r, 3).value = `$${be.pnlTotal.toFixed(2)}`;
      const cellMejora = ws.getCell(r, 4);
      cellMejora.value = `$${be.mejora > 0 ? '+' : ''}${be.mejora.toFixed(2)}`;
      if (be.mejora > 0) cellMejora.fill = goodFill;
      ws.getCell(r, 5).value = be.tradesMod;
      r++;
    });
    r++;

    ws.getCell(r, 2).value = 'SIMULACIÓN: CERRAR 50% AL 50% TP';
    ws.getCell(r, 2).font = { bold: true, size: 12 };
    r += 1;

    ws.getCell(r, 2).value = `PNL Original: $${a.pnlTotal.toFixed(2)}`;
    r += 1;
    ws.getCell(r, 2).value = `PNL Half TP: $${a.halfPnl.toFixed(2)}`;
    r += 1;
    const cellHalfDiff = ws.getCell(r, 2);
    cellHalfDiff.value = `Diferencia: $${a.halfDiff > 0 ? '+' : ''}${a.halfDiff.toFixed(2)}`;
    cellHalfDiff.fill = a.halfDiff < 0 ? badFill : goodFill;
    r += 2;

    ws.getCell(r, 2).value = 'MEJOR NIVEL PARA MOVER SL';
    ws.getCell(r, 2).font = { bold: true, size: 12 };
    r += 1;

    ['Nivel', 'Alcanzaron', 'Llegaron TP', 'Hit SL', 'Éxito %'].forEach((h, i) => {
      const cell = ws.getCell(r, 2 + i);
      cell.value = h;
      cell.font = headerFont;
      cell.fill = headerFill;
    });
    r += 1;

    a.slLevels.forEach((sl) => {
      ws.getCell(r, 2).value = sl.nivel;
      ws.getCell(r, 3).value = sl.alcanzaron;
      ws.getCell(r, 4).value = sl.llegaronTp;
      ws.getCell(r, 5).value = sl.hitSl;
      ws.getCell(r, 6).value = `${sl.successRate.toFixed(1)}%`;
      r++;
    });

    if (a.slLevels.length > 0) {
      const best = a.slLevels.reduce((prev, current) => (prev.successRate > current.successRate) ? prev : current);
      r += 1;
      const cellRec = ws.getCell(r, 2);
      cellRec.value = `★ RECOMENDACIÓN: ${best.nivel} (${best.successRate.toFixed(1)}% éxito)`;
      cellRec.font = { bold: true, color: { argb: 'FF1B3F66' } };
    }
    r += 2;

    ws.getCell(r, 2).value = 'CLASIFICACIÓN DE OPERACIONES';
    ws.getCell(r, 2).font = { bold: true, size: 12 };
    r += 1;

    (['BIEN', 'NEUTRAL', 'MAL'] as const).forEach((cl) => {
      const c = a.clasif[cl];
      const cell = ws.getCell(r, 2);
      cell.value = `${cl}: ${c.count} ops → $${c.pnlProm.toFixed(2)}/op`;
      if (cl === 'BIEN') cell.fill = goodFill;
      else if (cl === 'MAL') cell.fill = badFill;
      else cell.fill = yellowFill;
      r++;
    });

    ws.getColumn(2).width = 28;
    ws.getColumn(3).width = 15;
    ws.getColumn(4).width = 14;
    ws.getColumn(5).width = 12;
    ws.getColumn(6).width = 12;

    // --- HOJA DE OPERACIONES INDIVIDUALES ---
    const wsOps = wb.addWorksheet(`${a.modelo.substring(0, 25)} Ops`);
    
    const opsHeaders = [
      'ID', 'Symbol', 'Type', 'Activation Time', 'Close Time', 'Volume', 'Entry Price', 'SL', 'TP', 'Commission', 'PNL', 'Duration (Min)', 'Comment',
      'MAE (Pts)', 'MFE (Pts)', 'MAE ($)', 'MFE ($)', 'PNL BE 25%', 'PNL BE 30%', 'PNL BE 50%', 'PNL BE 75%',
      'Posición vs EMA 100', 'Posición vs EMA 200', 'Dirección EMA 100', 'Dirección EMA 200', 'RSI (14)', 'MACD'
    ];
    
    // Set headers
    opsHeaders.forEach((h, i) => {
      const cell = wsOps.getCell(1, i + 1);
      cell.value = h;
      cell.font = headerFont;
      if (i >= 25) {
        cell.fill = indHeaderFill;
      } else if (i >= 23) {
        cell.fill = emaDirHeaderFill;
      } else if (i >= 21) {
        cell.fill = emaHeaderFill;
      } else if (i >= 13) {
        cell.fill = newColHeaderFill;
      } else {
        cell.fill = headerFill;
      }
    });
    
    const modelOps = results.filter(r => r.model === a.modelo);
    
    modelOps.forEach((op, index) => {
      const rowOps = index + 2;
      
      const pnlBE25 = op.mfePts >= (op.tpDist * 0.25) ? (op.pnl < 0 ? 0 : op.pnl) : op.pnl;
      const pnlBE30 = op.mfePts >= (op.tpDist * 0.30) ? (op.pnl < 0 ? 0 : op.pnl) : op.pnl;
      const pnlBE50 = op.mfePts >= (op.tpDist * 0.50) ? (op.pnl < 0 ? 0 : op.pnl) : op.pnl;
      const pnlBE75 = op.mfePts >= (op.tpDist * 0.75) ? (op.pnl < 0 ? 0 : op.pnl) : op.pnl;
      
      const posicionEma100 = op.ema100 ? (op.entryPrice > op.ema100 ? 'ALCISTA' : 'BAJISTA') : 'N/A';
      const posicionEma200 = op.ema200 ? (op.entryPrice > op.ema200 ? 'ALCISTA' : 'BAJISTA') : 'N/A';
      const direccionEma100 = op.ema100Trend || 'N/A';
      const direccionEma200 = op.ema200Trend || 'N/A';
      const rsiVal = op.rsi !== undefined ? op.rsi : 'N/A';
      const macdVal = op.macd !== undefined ? op.macd : 'N/A';

      const rowData = [
        op.id, op.symbol, op.type.toUpperCase(), op.activationTime, op.closeTime, op.volume, op.entryPrice, op.sl, op.tp, op.commission, op.pnl, op.durationMin, op.comment,
        op.maePts, op.mfePts, op.maeDollars, op.mfeDollars, pnlBE25, pnlBE30, pnlBE50, pnlBE75,
        posicionEma100, posicionEma200, direccionEma100, direccionEma200, rsiVal, macdVal
      ];
      
      rowData.forEach((val, i) => {
        const cell = wsOps.getCell(rowOps, i + 1);
        cell.value = val;
        if (i >= 25) {
          cell.fill = indFill;
          if (typeof val === 'number') {
            cell.numFmt = '0.00';
          }
        } else if (i >= 23) {
          cell.fill = emaDirFill;
          cell.font = { bold: true, color: { argb: val === 'ALCISTA' ? 'FF1B5E20' : (val === 'BAJISTA' ? 'FFB71C1C' : 'FF000000') } };
        } else if (i >= 21) {
          cell.fill = emaFill;
          cell.font = { bold: true, color: { argb: val === 'ALCISTA' ? 'FF1B5E20' : (val === 'BAJISTA' ? 'FFB71C1C' : 'FF000000') } };
        } else if (i >= 13) {
          cell.fill = newColFill;
        }
        // Format dates
        if (val instanceof Date) {
          cell.numFmt = 'yyyy-mm-dd hh:mm:ss';
        }
        // Format currency/numbers
        if (typeof val === 'number') {
          if (i === 5) cell.numFmt = '0.00'; // Volume
          else if (i >= 6 && i <= 8) cell.numFmt = '0.00'; // Prices
          else if (i === 11) cell.numFmt = '0.0'; // Duration
          else if (i === 13 || i === 14) cell.numFmt = '0.00'; // MAE/MFE Pts
          else if (i === 9 || i === 10 || (i >= 15 && i <= 20)) cell.numFmt = '"$"#,##0.00'; // PNL, Commission, MAE/MFE $, BE $
        }
      });
    });
    
    // Auto-fit columns roughly
    wsOps.columns.forEach((col, i) => {
      if (i === 3 || i === 4) col.width = 20; // Dates
      else if (i === 12) col.width = 30; // Comment
      else if (i >= 21 && i <= 24) col.width = 20; // EMA Trends
      else if (i >= 25) col.width = 15; // RSI and MACD
      else col.width = 15;
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const date = new Date();
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  // Extract first tag like [139] from opsFileName
  const match = opsFileName.match(/(\[[^\]]+\])/);
  const firstTag = match ? match[1] : '';
  
  // Remove extension from opsFileName
  const baseCsvName = opsFileName.replace(/\.[^/.]+$/, "");
  
  // Format: [ETIQUETA] [NOMBRE POR DEFECTO] [NOMBRE CSV].xlsx
  const defaultName = `[MAE MFE] [NDX] ${formattedDate}`;
  a.download = `${firstTag ? firstTag + ' ' : ''}${defaultName} ${baseCsvName}.xlsx`;
  
  a.click();
  window.URL.revokeObjectURL(url);
}
