import ExcelJS from 'exceljs';
import { ModelAnalysis } from '../types';

export async function generateExcel(models: ModelAnalysis[]) {
  const wb = new ExcelJS.Workbook();

  const titleFont = { name: 'Calibri', size: 16, bold: true };
  const headerFont = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3F66' } };
  const goodFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
  const badFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
  const yellowFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };

  // Resumen General
  const wsRes = wb.addWorksheet('Resumen General');
  wsRes.getCell('B2').value = 'RESUMEN COMPARATIVO POR MODELO - NDX';
  wsRes.getCell('B2').font = titleFont;

  const headers = ['Modelo', 'Ops', 'Win Rate', 'PNL Total', 'PNL Neto', 'MAE Prom ($)', 'MFE Prom ($)', 'Ratio', 'Mejor Min', 'Mejor SL', 'Mejor BE'];
  let row = 4;

  headers.forEach((h, i) => {
    const cell = wsRes.getCell(row, 2 + i);
    cell.value = h;
    cell.font = headerFont;
    cell.fill = headerFill;
  });

  row = 5;

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
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Analisis_NDX_Por_Modelo_Completo.xlsx';
  a.click();
  window.URL.revokeObjectURL(url);
}
