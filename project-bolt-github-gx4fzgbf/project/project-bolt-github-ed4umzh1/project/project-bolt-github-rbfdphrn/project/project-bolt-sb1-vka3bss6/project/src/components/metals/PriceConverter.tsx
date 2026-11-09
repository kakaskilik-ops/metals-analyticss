import { useState } from 'react';
import DataStatusBadge from '@/components/common/DataStatusBadge';
import { CURRENCY_CODES, CURRENCY_LABELS, UNIT_LABELS, convertPrice, getRateStatus, getRateOrigin, getRateTimestamp } from '@/services/currency';
import { formatDateTime, formatIndex } from '@/lib/format';
import type { CurrencyCode, UnitCode } from '@/types/market';

const UNITS: UnitCode[] = ['kg', 'ton', 'g', 'ozt', 'lb'];

const SELECT_CLASS =
  'h-10 w-full rounded-lg border border-ink-700 bg-ink-950 px-3 text-sm text-ink-100 outline-none transition-colors duration-200 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15';

interface PriceConverterProps {
  pricePerKg: number;
  currency: CurrencyCode;
}

export default function PriceConverter({ pricePerKg, currency }: PriceConverterProps) {
  const [targetCurrency, setTargetCurrency] = useState<CurrencyCode>(currency);
  const [targetUnit, setTargetUnit] = useState<UnitCode>('kg');

  const converted = convertPrice(pricePerKg, currency, targetCurrency, 'kg', targetUnit);
  const rateStatus = getRateStatus();
  const rateOrigin = getRateOrigin();
  const rateTs = getRateTimestamp();

  return (
    <div className="rounded-xl border border-ink-800 bg-ink-950/60 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-ink-200">Пересчёт валюты и единиц</h3>
        <DataStatusBadge status={rateStatus === 'live' ? 'live' : 'demo'} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs text-ink-400">Валюта</span>
          <select
            value={targetCurrency}
            onChange={(event) => setTargetCurrency(event.target.value as CurrencyCode)}
            className={SELECT_CLASS}
          >
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {CURRENCY_LABELS[code]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-ink-400">Единица</span>
          <select
            value={targetUnit}
            onChange={(event) => setTargetUnit(event.target.value as UnitCode)}
            className={SELECT_CLASS}
          >
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-4 text-lg font-semibold tabular-nums text-ink-100">
        {formatIndex(converted)} {CURRENCY_LABELS[targetCurrency]} / {UNIT_LABELS[targetUnit]}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-400">
        {rateStatus === 'live'
          ? `Курсы валют: ${rateOrigin}${rateTs > 0 ? `, обновлено ${formatDateTime(rateTs)}` : ''}.`
          : 'Курсы валют зафиксированы как демонстрационные (индикативные). Они не обновляются и не являются актуальными курсами ЦБ или биржи.'}
      </p>
    </div>
  );
}
