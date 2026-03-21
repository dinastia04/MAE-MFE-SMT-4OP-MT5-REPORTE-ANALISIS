import React from 'react';
import { BookOpen, Info } from 'lucide-react';

export function Glossary() {
  const terms = [
    {
      term: 'MAE (Maximum Adverse Excursion)',
      definition: 'Es lo máximo que la operación estuvo "en rojo" (en contra) antes de cerrarse o darse la vuelta. Te dice cuánto aguantaste de pérdida temporal.'
    },
    {
      term: 'MFE (Maximum Favorable Excursion)',
      definition: 'Es lo máximo que la operación estuvo "en azul" (a favor) antes de cerrarse. Te dice cuánto dinero podrías haber ganado si hubieras cerrado en el punto más alto.'
    },
    {
      term: 'Win Rate',
      definition: 'El porcentaje de operaciones que terminaron con ganancias sobre el total de operaciones realizadas.'
    },
    {
      term: 'PNL Neto',
      definition: 'Tu ganancia o pérdida real después de restar las comisiones del broker.'
    },
    {
      term: 'PNL EMA 100',
      definition: 'El PNL (ganancia/pérdida) de las operaciones que se tomaron a favor de la tendencia según la Media Móvil Exponencial (EMA) de 100 periodos. Se calcula usando la EMA de la vela anterior a la entrada para ser justo.'
    },
    {
      term: 'PNL EMA 200',
      definition: 'El PNL de las operaciones que se tomaron a favor de la tendencia según la EMA de 200 periodos. Te ayuda a saber si operar solo a favor de la tendencia a largo plazo mejora tus resultados.'
    },
    {
      term: 'Ratio MFE/MAE',
      definition: 'Compara cuánto ganas cuando el precio va a tu favor vs cuánto arriesgas cuando va en contra. Un ratio mayor a 1 significa que tus movimientos a favor son más grandes que los que van en contra.'
    },
    {
      term: 'MAE vs SL',
      definition: 'Indica qué tan cerca estuvo el precio de tocar tu Stop Loss. Si es un 90%, estuviste a punto de ser sacado por pérdida. Si es bajo (ej. 20%), tu Stop Loss estaba muy lejos para ese movimiento.'
    },
    {
      term: 'MFE vs TP',
      definition: 'Indica qué tan cerca estuvo el precio de tocar tu Take Profit. Si es un 95% y la operación terminó en pérdida, significa que casi tocas tu meta pero dejaste que se regresara.'
    },
    {
      term: 'Break-Even (BE)',
      definition: 'Es el punto de equilibrio. Mover a BE significa proteger la operación para que, si el precio se regresa, no pierdas dinero (sales con $0).'
    },
    {
      term: 'Half TP (Cerrar 50%)',
      definition: 'Una estrategia donde cierras la mitad de tu posición cuando vas ganando una cantidad razonable, asegurando algo de ganancia y dejando el resto correr.'
    }
  ];

  return (
    <section className="mt-20 border-t border-zinc-800 pt-12 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="w-6 h-6 text-emerald-500" />
        <h2 className="text-2xl font-bold tracking-tight">Glosario de Términos</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {terms.map((item, index) => (
          <div key={index} className="space-y-2">
            <h3 className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">{item.term}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{item.definition}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Info className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">¿Qué significa todo esto en conjunto?</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Este análisis no solo te dice cuánto ganaste, sino <strong>cómo</strong> lo hiciste. 
              Al mirar el MAE y el MFE juntos, puedes descubrir si tus Stop Loss son demasiado grandes (arriesgas mucho para lo que el precio se mueve) 
              o si tus Take Profit son demasiado ambiciosos (el precio casi llega y luego se regresa). 
              Las simulaciones de Break-Even te ayudan a ver si proteger tus operaciones antes de tiempo te haría ganar más dinero a largo plazo 
              o si simplemente estarías cortando operaciones que luego habrían sido ganadoras. 
              En resumen: es una herramienta para <strong>optimizar tu gestión de riesgo</strong> basándote en el comportamiento real del precio mientras tú estabas dentro del mercado.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
