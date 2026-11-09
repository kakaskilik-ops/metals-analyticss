import Delta from '@/components/common/Delta';
import { cn } from '@/lib/cn';
import { formatPercent, formatPrice } from '@/lib/format';
import type { MetalQuote } from '@/types/market';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  quotes?: MetalQuote[];
}

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex animate-fade-up', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[88%] md:max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'rounded-br-md bg-ink-700 text-ink-100'
              : 'rounded-bl-md border border-ink-800 bg-ink-950 text-ink-200'
          )}
        >
          {message.text}
        </div>

        {message.quotes && message.quotes.length > 0 && (
          <ul className="mt-3 divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800 bg-ink-950">
            {message.quotes.map((quote) => (
              <li key={quote.metal.symbol} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="text-ink-200">
                  {quote.metal.name}
                  <span className="ml-1.5 text-ink-500">{quote.metal.symbol}</span>
                </span>
                <span className="flex items-center gap-4 tabular-nums">
                  <span className="text-ink-100">{formatPrice(quote.price)}</span>
                  <Delta value={quote.changePct} text={formatPercent(quote.changePct)} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
