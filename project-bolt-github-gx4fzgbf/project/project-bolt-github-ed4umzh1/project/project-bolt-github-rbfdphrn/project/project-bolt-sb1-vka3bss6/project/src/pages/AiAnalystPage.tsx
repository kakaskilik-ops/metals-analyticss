import { Bot, Info, Send } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import DemoBadge from '@/components/common/DemoBadge';
import Panel from '@/components/common/Panel';
import ChatBubble, { type ChatMessage } from '@/components/ai/ChatBubble';
import PageHeader from '@/components/layout/PageHeader';
import { cn } from '@/lib/cn';
import { sendAiRequest } from '@/services/ai';

const SUGGESTIONS = [
  'Сравни Neodymium и Praseodymium',
  'Покажи динамику Dysprosium за месяц',
  'Почему подорожал Terbium?',
  'Проанализируй историю Yttrium',
];

const GREETING: ChatMessage = {
  id: 'greeting',
  role: 'assistant',
  text: 'Здравствуйте. Я ИИ-аналитик ALPHA ANALYST. Сейчас работает демо-режим: ответы ИИ не подключены, а цены в ответах демонстрационные.',
};

interface AiAnalystPageProps {
  updatedAt: Date;
}

export default function AiAnalystPage({ updatedAt }: AiAnalystPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [draft, setDraft] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pendingQuestion) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      sendAiRequest({ question: pendingQuestion }, updatedAt)
        .then((reply) => {
          if (cancelled) return;
          setMessages((current) => [
            ...current,
            { id: `reply-${Date.now()}`, role: 'assistant', text: reply.text, quotes: reply.quotes },
          ]);
        })
        .catch(() => {
          if (cancelled) return;
          setMessages((current) => [
            ...current,
            { id: `error-${Date.now()}`, role: 'assistant', text: 'Не удалось получить ответ. Попробуйте позже.' },
          ]);
        })
        .finally(() => {
          if (!cancelled) setPendingQuestion(null);
        });
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pendingQuestion, updatedAt]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, pendingQuestion]);

  const sendQuestion = (question: string) => {
    const text = question.trim();
    if (!text || pendingQuestion) return;
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', text }]);
    setPendingQuestion(text);
    setDraft('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendQuestion(draft);
  };

  const showSuggestions = messages.length === 1 && !pendingQuestion;

  return (
    <>
      <PageHeader
        title="ИИ-аналитик"
        description="Задавайте вопросы о металлах, ценах и истории котировок."
        actions={<DemoBadge />}
      />

      <div className="mb-4 flex gap-3 rounded-xl border border-ink-800 bg-ink-900/70 px-4 py-3 text-sm leading-relaxed text-ink-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
        <p>
          Демо-режим. ИИ-модель пока не подключена, поэтому ответы не являются аналитическими выводами. Показываются
          только демонстрационные котировки ALPHA ANALYST.
        </p>
      </div>

      <Panel className="flex h-[calc(100vh-280px)] min-h-[480px] flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-ink-800 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-400">
            <Bot className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-100">ALPHA ANALYST AI</p>
            <p className="text-xs text-ink-400">Демо-режим без подключения модели</p>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 md:px-6">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}

          {pendingQuestion && (
            <div className="flex items-center gap-1.5 text-ink-400" aria-label="Ответ формируется">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-400" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-400 [animation-delay:300ms]" />
            </div>
          )}

          <div ref={endRef} />
        </div>

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 border-t border-ink-800 px-4 py-4 md:px-6">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendQuestion(suggestion)}
                className="rounded-full border border-ink-700 bg-ink-950 px-3.5 py-1.5 text-xs text-ink-300 transition-colors duration-200 hover:border-brand-500/40 hover:text-brand-400"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t border-ink-800 p-4 md:px-6">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Например: сравни Dysprosium и Terbium"
            aria-label="Вопрос ИИ-аналитику"
            className="h-11 min-w-0 flex-1 rounded-lg border border-ink-700 bg-ink-950 px-4 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition-colors duration-200 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
          />
          <button
            type="submit"
            disabled={!draft.trim() || Boolean(pendingQuestion)}
            aria-label="Отправить вопрос"
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
              draft.trim() && !pendingQuestion
                ? 'bg-brand-500 text-ink-950 hover:bg-brand-400 active:scale-95'
                : 'cursor-not-allowed bg-ink-800 text-ink-500'
            )}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </Panel>
    </>
  );
}
