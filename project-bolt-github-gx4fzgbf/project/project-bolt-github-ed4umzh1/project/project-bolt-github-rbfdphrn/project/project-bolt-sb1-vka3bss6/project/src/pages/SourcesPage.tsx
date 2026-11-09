import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Panel from '@/components/common/Panel';
import { METALS } from '@/data/metals';
import { MARKET_TYPE_LABELS, SOURCE_STATUS_LABELS } from '@/data/sources';
import { buildSourceIntegrations } from '@/services/sources';
import { fetchSourceRows, fetchSourceCoverage, fetchUpdateLogs, triggerDataCollection } from '@/services/database';
import { getRateStatus, getRateOrigin, getRateTimestamp } from '@/services/currency';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { SourceIntegration, SourceStatus } from '@/types/market';
import type { LiveMarketData } from '@/services/liveData';
import type { UpdateLogRow } from '@/services/database';

interface SourcesPageProps {
  updatedAt: Date;
  liveData: LiveMarketData | null;
}

const STATUS_ICONS: Record<SourceStatus, typeof CheckCircle2> = {
  connected: CheckCircle2,
  pending: Clock,
  rate_limited: AlertCircle,
  error: XCircle,
  unavailable: XCircle,
  demo: Clock,
};

const STATUS_COLORS: Record<SourceStatus, string> = {
  connected: 'text-brand-400',
  pending: 'text-ink-400',
  rate_limited: 'text-yellow-400',
  error: 'text-loss-400',
  unavailable: 'text-ink-500',
  demo: 'text-ink-400',
};

export default function SourcesPage({ liveData }: SourcesPageProps) {
  const [sources, setSources] = useState<SourceIntegration[]>([]);
  const [coverage, setCoverage] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<UpdateLogRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rows, cov, updateLogs] = await Promise.all([
        fetchSourceRows(),
        fetchSourceCoverage(),
        fetchUpdateLogs(5),
      ]);
      setSources(buildSourceIntegrations(rows));
      setCoverage(cov);
      setLogs(updateLogs);
    } catch {
      setSources(buildSourceIntegrations(null));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const result = await triggerDataCollection();
      setRefreshMsg(
        result.status === 'success'
          ? `Данные обновлены: ${result.rowsWritten} записей.`
          : `Частично обновлено: ${result.rowsWritten} записей, ошибок: ${result.errors.length}.`
      );
      await loadData();
    } catch (err) {
      setRefreshMsg(err instanceof Error ? err.message : 'Ошибка обновления.');
    } finally {
      setRefreshing(false);
    }
  };

  const connectedCount = sources.filter((s) => s.status === 'connected').length;
  const liveMetalIds = liveData ? Array.from(liveData.quotes.keys()).filter((id) => liveData.quotes.get(id)?.dataStatus === 'live') : [];
  const rateStatus = getRateStatus();
  const rateOrigin = getRateOrigin();
  const rateTs = getRateTimestamp();

  return (
    <>
      <PageHeader
        title="Источники данных"
        description="Сравнение подключённых источников, матрица покрытия металлов и мониторинг сбора данных."
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-4 text-sm text-ink-200 transition-colors duration-200 hover:border-brand-500/40 hover:text-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} aria-hidden="true" />
            Запустить сбор данных
          </button>
        }
      />

      {refreshMsg && (
        <div className="mb-4 rounded-xl border border-ink-800 bg-ink-900/70 px-4 py-3 text-sm text-ink-300">
          {refreshMsg}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-ink-800 bg-ink-900/70 p-4">
          <p className="text-xs text-ink-400">Подключено источников</p>
          <p className="mt-2 text-2xl font-semibold text-brand-400">{connectedCount}</p>
          <p className="mt-1 text-xs text-ink-500">из {sources.length} зарегистрированных</p>
        </div>
        <div className="rounded-xl border border-ink-800 bg-ink-900/70 p-4">
          <p className="text-xs text-ink-400">Металлов с LIVE данными</p>
          <p className="mt-2 text-2xl font-semibold text-brand-400">{liveMetalIds.length}</p>
          <p className="mt-1 text-xs text-ink-500">из {METALS.length} в каталоге</p>
        </div>
        <div className="rounded-xl border border-ink-800 bg-ink-900/70 p-4">
          <p className="text-xs text-ink-400">Валютные курсы</p>
          <p className="mt-2 text-2xl font-semibold text-brand-400">{rateStatus === 'live' ? 'LIVE' : 'DEMO'}</p>
          <p className="mt-1 text-xs text-ink-500">{rateOrigin || 'не загружены'}</p>
        </div>
        <div className="rounded-xl border border-ink-800 bg-ink-900/70 p-4">
          <p className="text-xs text-ink-400">Последний сбор</p>
          <p className="mt-2 text-sm font-medium text-ink-100">
            {logs.length > 0 ? formatDateTime(logs[0].finishedAt ?? logs[0].startedAt) : '—'}
          </p>
          <p className="mt-1 text-xs text-ink-500">{logs.length > 0 ? `${logs[0].rowsWritten} записей` : 'нет данных'}</p>
        </div>
      </div>

      {/* Source comparison table */}
      <Panel className="mt-4 overflow-hidden">
        <div className="border-b border-ink-800 p-5 md:p-6">
          <h2 className="text-base font-semibold text-ink-100">Сравнение источников</h2>
          <p className="mt-1 text-xs text-ink-400">Статус подключения, тип рынка, регион и лицензирование</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-800 text-left text-xs font-medium uppercase tracking-[0.12em] text-ink-400">
                <th className="px-5 py-3 font-medium">Источник</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium">Тип рынка</th>
                <th className="px-5 py-3 font-medium">Регион</th>
                <th className="px-5 py-3 font-medium">API ключ</th>
                <th className="px-5 py-3 font-medium">Металлов</th>
                <th className="px-5 py-3 font-medium">Последнее обновление</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => {
                const Icon = STATUS_ICONS[source.status];
                const metalCount = METALS.filter((m) => coverage.has(`${m.id}-${source.id}`)).length;
                const liveCount = METALS.filter((m) => {
                  const ld = liveData?.quotes.get(m.id);
                  return ld && ld.sourceName === source.name && ld.dataStatus === 'live';
                }).length;
                return (
                  <tr key={source.id} className="border-b border-ink-800/70 last:border-b-0">
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink-100">{source.name}</p>
                      {source.url && (
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-ink-500 hover:text-brand-400">
                          {source.url}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', STATUS_COLORS[source.status])} />
                        <span className="text-ink-200">{SOURCE_STATUS_LABELS[source.status]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink-300">{MARKET_TYPE_LABELS[source.marketType]}</td>
                    <td className="px-5 py-4 text-ink-300">{source.region}</td>
                    <td className="px-5 py-4 text-ink-300">
                      {source.apiKeyRequired ? 'Требуется' : 'Не требуется'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-ink-100">{liveCount > 0 ? liveCount : metalCount}</span>
                      {liveCount > 0 && <span className="text-ink-500"> LIVE</span>}
                    </td>
                    <td className="px-5 py-4 text-xs text-ink-400">
                      {source.lastSuccessAt ? formatDateTime(source.lastSuccessAt) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Coverage matrix */}
      <Panel className="mt-4 overflow-hidden">
        <div className="border-b border-ink-800 p-5 md:p-6">
          <h2 className="text-base font-semibold text-ink-100">Матрица покрытия металлов</h2>
          <p className="mt-1 text-xs text-ink-400">Какие источники поставляют данные для каких металлов</p>
        </div>
        <div className="overflow-x-auto p-5 md:p-6">
          <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${sources.length}, minmax(80px, 1fr))` }}>
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-ink-400">Металл</div>
            {sources.map((s) => (
              <div key={s.id} className="truncate text-xs font-medium uppercase tracking-[0.08em] text-ink-400" title={s.name}>
                {s.id === 'yahoo-finance' ? 'Yahoo' : s.id === 'frankfurter' ? 'Frankfurter' : s.id === 'usgs' ? 'USGS' : s.name.slice(0, 12)}
              </div>
            ))}
            {METALS.filter((m) => {
              return sources.some((s) => coverage.has(`${m.id}-${s.id}`));
            }).map((metal) => (
              <div key={metal.id} className="contents">
                <div className="py-1.5 text-sm text-ink-200">
                  {metal.name} <span className="text-ink-500">{metal.symbol}</span>
                </div>
                {sources.map((source) => {
                  const isCovered = coverage.has(`${metal.id}-${source.id}`);
                  const liveData_ = liveData?.quotes.get(metal.id);
                  const isLive = liveData_ && liveData_.sourceName === source.name && liveData_.dataStatus === 'live';
                  return (
                    <div key={source.id} className="py-1.5 text-center">
                      {isLive ? (
                        <span className="inline-flex items-center rounded-md bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-400">LIVE</span>
                      ) : isCovered ? (
                        <span className="inline-flex items-center rounded-md bg-ink-800 px-2 py-0.5 text-xs text-ink-300">покрыт</span>
                      ) : (
                        <span className="text-xs text-ink-600">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Monitoring dashboard */}
      <Panel className="mt-4 overflow-hidden">
        <div className="border-b border-ink-800 p-5 md:p-6">
          <h2 className="text-base font-semibold text-ink-100">Мониторинг сбора данных</h2>
          <p className="mt-1 text-xs text-ink-400">Журнал запусков сбора данных и их результаты</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-800 text-left text-xs font-medium uppercase tracking-[0.12em] text-ink-400">
                <th className="px-5 py-3 font-medium">Задача</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium">Записей</th>
                <th className="px-5 py-3 font-medium">Начало</th>
                <th className="px-5 py-3 font-medium">Завершение</th>
                <th className="px-5 py-3 font-medium">Сообщение</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink-400">
                    Журнал пуст. Запустите сбор данных кнопкой выше.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-ink-800/70 last:border-b-0">
                  <td className="px-5 py-3 text-ink-200">{log.job}</td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-medium',
                      log.status === 'success' ? 'text-brand-400' : log.status === 'error' ? 'text-loss-400' : 'text-ink-400'
                    )}>
                      {log.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {log.status === 'error' && <XCircle className="h-3.5 w-3.5" />}
                      {log.status === 'started' && <Clock className="h-3.5 w-3.5" />}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-ink-200">{log.rowsWritten}</td>
                  <td className="px-5 py-3 text-xs text-ink-400">{formatDateTime(log.startedAt)}</td>
                  <td className="px-5 py-3 text-xs text-ink-400">{log.finishedAt ? formatDateTime(log.finishedAt) : '—'}</td>
                  <td className="px-5 py-3 text-xs text-ink-400">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Licensing info */}
      <Panel className="mt-4 p-5 md:p-6">
        <h2 className="text-base font-semibold text-ink-100">Лицензирование и атрибуция</h2>
        <div className="mt-4 space-y-3">
          {sources.map((source) => (
            <div key={source.id} className="rounded-lg border border-ink-800 bg-ink-950/60 p-3">
              <p className="text-sm font-medium text-ink-100">{source.name}</p>
              <p className="mt-1 text-xs text-ink-400">{source.license}</p>
              {source.attribution && (
                <p className="mt-0.5 text-xs text-ink-500">Атрибуция: {source.attribution}</p>
              )}
              {source.freeTierLimit && (
                <p className="mt-0.5 text-xs text-ink-500">Лимиты: {source.freeTierLimit}</p>
              )}
            </div>
          ))}
        </div>
        {rateTs > 0 && (
          <p className="mt-4 text-xs text-ink-500">
            Валютные курсы: {rateOrigin}, обновлено {formatDateTime(rateTs)}
          </p>
        )}
      </Panel>
    </>
  );
}
