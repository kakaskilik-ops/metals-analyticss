import { METALS } from '@/data/metals';
import { buildQuotes } from '@/services/market';
import type { MetalQuote } from '@/types/market';

export interface AiRequest {
  question: string;
  metalIds?: string[];
  period?: string;
  context?: Record<string, unknown>;
}

export interface AiResponse {
  text: string;
  quotes: MetalQuote[];
  tables?: { title: string; rows: Record<string, string | number>[] }[];
}

export const AI_STATUS: {
  enabled: boolean;
  message: string;
} = {
  enabled: false,
  message: 'ИИ-аналитик будет доступен после подключения API.',
};

function findMentionedMetals(question: string) {
  const tokens = question.toLowerCase().split(/[^a-zа-яё]+/u).filter(Boolean);
  return METALS.filter((metal) =>
    tokens.some(
      (token) =>
        token === metal.symbol.toLowerCase() ||
        token === metal.name.toLowerCase() ||
        token === metal.nameRu.toLowerCase() ||
        metal.aliases.some((alias) => token.startsWith(alias))
    )
  );
}

export function buildDemoReply(question: string, updatedAt: Date): AiResponse {
  const mentioned = findMentionedMetals(question);

  if (mentioned.length === 0) {
    return {
      text: 'Демо-режим: ИИ-аналитика пока не подключена, поэтому ваш вопрос не анализируется. Назовите металл (например, Neodymium, Nd или неодим), и я покажу его демонстрационную котировку за месяц.',
      quotes: [],
    };
  }

  return {
    text: 'Демо-режим: ниже демонстрационные котировки за 1 месяц по упомянутым металлам. Это не аналитический вывод ИИ.',
    quotes: mentioned.map((metal) => buildQuotes([metal], '1M', updatedAt)[0]),
  };
}

export async function sendAiRequest(request: AiRequest, updatedAt: Date): Promise<AiResponse> {
  if (!AI_STATUS.enabled) {
    return buildDemoReply(request.question, updatedAt);
  }

  // Future API integration point:
  // const response = await fetch('/api/ai/analyze', { ... })
  // For now, return demo reply
  return buildDemoReply(request.question, updatedAt);
}
