import { useId, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatAxisLabel, formatDateTime } from '@/lib/format';
import type { PeriodKey, PricePoint } from '@/types/market';

const AXIS_TICK_COUNT = 6;

interface PriceChartProps {
  data: PricePoint[];
  period: PeriodKey;
  positive: boolean;
  valueFormatter: (value: number) => string;
  height?: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: PricePoint }[];
  valueFormatter: (value: number) => string;
}

function ChartTooltip({ active, payload, valueFormatter }: ChartTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-950/95 px-3 py-2 shadow-xl backdrop-blur">
      <p className="text-[11px] text-ink-400">{formatDateTime(point.date)}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-ink-100">{valueFormatter(point.price)}</p>
    </div>
  );
}

export default function PriceChart({
  data,
  period,
  positive,
  valueFormatter,
  height = 280,
}: PriceChartProps) {
  const gradientId = `price-fill-${useId().replace(/:/g, '')}`;
  const color = positive ? '#00C781' : '#F04452';

  const ticks = useMemo(() => {
    const step = Math.max(1, Math.ceil(data.length / AXIS_TICK_COUNT));
    return data.filter((_, index) => index % step === 0).map((point) => point.date);
  }, [data]);

  const axisTick = { fill: '#8A94A3', fontSize: 11 };

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#1C222B" />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={(value: number) => formatAxisLabel(value, period)}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(value: number) => valueFormatter(value)}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            cursor={{ stroke: '#3A4453', strokeDasharray: '3 3' }}
            content={<ChartTooltip valueFormatter={valueFormatter} />}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: '#090B0E', strokeWidth: 2 }}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
