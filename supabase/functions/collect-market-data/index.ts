import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MetalCoverage {
  metalId: string;
  sourceId: string;
  sourceSymbol: string;
  exchangeName: string;
  unit: string;
  currency: string;
  marketType: string;
  region: string;
}

const YAHOO_COVERAGE: MetalCoverage[] = [
  { metalId: "gold", sourceId: "yahoo-finance", sourceSymbol: "GC=F", exchangeName: "COMEX", unit: "ozt", currency: "USD", marketType: "exchange", region: "США" },
  { metalId: "silver", sourceId: "yahoo-finance", sourceSymbol: "SI=F", exchangeName: "COMEX", unit: "ozt", currency: "USD", marketType: "exchange", region: "США" },
  { metalId: "platinum", sourceId: "yahoo-finance", sourceSymbol: "PL=F", exchangeName: "NYMEX", unit: "ozt", currency: "USD", marketType: "exchange", region: "США" },
  { metalId: "palladium", sourceId: "yahoo-finance", sourceSymbol: "PA=F", exchangeName: "NYMEX", unit: "ozt", currency: "USD", marketType: "exchange", region: "США" },
  { metalId: "copper", sourceId: "yahoo-finance", sourceSymbol: "HG=F", exchangeName: "COMEX", unit: "lb", currency: "USD", marketType: "exchange", region: "США" },
  { metalId: "aluminum", sourceId: "yahoo-finance", sourceSymbol: "ALI=F", exchangeName: "COMEX", unit: "ton", currency: "USD", marketType: "exchange", region: "США" },
  { metalId: "hot-rolled", sourceId: "yahoo-finance", sourceSymbol: "HRC=F", exchangeName: "CME", unit: "ton", currency: "USD", marketType: "exchange", region: "США" },
];

const QUOTE_STALE_AFTER_MS = 4 * 24 * 60 * 60 * 1000;
const FRANKFURTER_CURRENCIES = ["EUR", "GBP", "CNY", "SEK", "RUB"];

const UNIT_TO_KG: Record<string, number> = {
  ton: 1000,
  kg: 1,
  g: 0.001,
  ozt: 0.0311035,
  lb: 0.453592,
};

interface YahooChartMeta {
  regularMarketPrice: number;
  regularMarketTime: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  exchangeName: string;
  currency: string;
  symbol: string;
}

interface YahooChartResult {
  meta: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: number[];
      high?: number[];
      low?: number[];
      close?: number[];
      volume?: number[];
    }>;
  };
}

async function fetchYahooQuote(symbol: string): Promise<{ meta: YahooChartMeta; candles: Array<{ ts: number; o: number; h: number; l: number; c: number }> }> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MetalsAnalytics/1.0)" },
  });
  if (!resp.ok) {
    throw new Error(`Yahoo Finance returned ${resp.status} for ${symbol}`);
  }
  const body = await resp.json();
  const result: YahooChartResult | undefined = body?.chart?.result?.[0];
  if (!result || !result.meta) {
    throw new Error(`Yahoo Finance returned no data for ${symbol}`);
  }
  const ts = result.timestamp ?? [];
  const quotes = result.indicators?.quote?.[0];
  const candles: Array<{ ts: number; o: number; h: number; l: number; c: number }> = [];
  if (quotes) {
    for (let i = 0; i < ts.length; i++) {
      const o = quotes.open?.[i];
      const h = quotes.high?.[i];
      const l = quotes.low?.[i];
      const c = quotes.close?.[i];
      if (o != null && h != null && l != null && c != null && Number.isFinite(o) && Number.isFinite(h) && Number.isFinite(l) && Number.isFinite(c)) {
        candles.push({ ts: ts[i], o, h, l, c });
      }
    }
  }
  return { meta: result.meta, candles };
}

async function fetchFrankfurterRates(): Promise<{ rates: Record<string, number>; date: string }> {
  const resp = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,CNY,SEK,RUB", {
    headers: { "User-Agent": "MetalsAnalytics/1.0" },
  });
  if (!resp.ok) {
    throw new Error(`Frankfurter returned ${resp.status}`);
  }
  const body = await resp.json();
  if (!body?.rates) {
    throw new Error("Frankfurter returned no rates");
  }
  return { rates: body.rates as Record<string, number>, date: body.date as string };
}

function normalizePriceToUsdPerKg(price: number, unit: string, currency: string): number {
  const pricePerKg = price / (UNIT_TO_KG[unit] ?? 1);
  return pricePerKg;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Server not configured: missing Supabase credentials." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: authorized, error: authError } = await supabase.rpc("verify_collector_token", {
    p_token: req.headers.get("x-collector-token") ?? "",
  });
  if (authError || authorized !== true) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const jobStartedAt = new Date().toISOString();
  let totalRows = 0;
  const errors: string[] = [];
  const successes: string[] = [];

  try {
    // === 1. Collect Yahoo Finance metal quotes ===
    let yahooSuccess = false;
    let yahooError: string | null = null;

    for (const coverage of YAHOO_COVERAGE) {
      try {
        const { meta, candles } = await fetchYahooQuote(coverage.sourceSymbol);

        if (!Number.isFinite(meta.regularMarketPrice) || meta.regularMarketPrice <= 0) {
          throw new Error(`Invalid price for ${coverage.sourceSymbol}`);
        }

        const quotedAt = meta.regularMarketTime
          ? new Date(meta.regularMarketTime * 1000).toISOString()
          : new Date().toISOString();
        const quoteAgeMs = Date.now() - new Date(quotedAt).getTime();
        const validationStatus = quoteAgeMs > QUOTE_STALE_AFTER_MS ? "stale" : "valid";

        const normalizedPrice = normalizePriceToUsdPerKg(meta.regularMarketPrice, coverage.unit, coverage.currency);

        const { error: quoteError } = await supabase
          .from("price_quotations")
          .upsert(
            {
              metal_id: coverage.metalId,
              source_id: coverage.sourceId,
              original_price: meta.regularMarketPrice,
              original_currency: coverage.currency,
              original_unit: coverage.unit,
              normalized_price: Math.round(normalizedPrice * 10000) / 10000,
              normalized_currency: "USD",
              normalized_unit: "kg",
              grade: "Futures",
              product_form: `${meta.exchangeName} ${coverage.sourceSymbol}`,
              region: coverage.region,
              market_type: coverage.marketType,
              exchange_name: meta.exchangeName,
              bid_price: null,
              ask_price: null,
              transaction_price: meta.regularMarketPrice,
              price_type: "futures",
              quality_score: 0.82,
              data_status: "live",
              validation_status: validationStatus,
              quoted_at: quotedAt,
              retrieved_at: new Date().toISOString(),
              source_url: "https://finance.yahoo.com",
              attribution: "Yahoo Finance (unofficial)",
            },
            { onConflict: "metal_id,source_id,quoted_at" }
          );

        if (quoteError) {
          errors.push(`Quote insert ${coverage.sourceSymbol}: ${quoteError.message}`);
        } else {
          totalRows++;
        }

        // Store price history candles
        for (const candle of candles) {
          const tradeDate = new Date(candle.ts * 1000).toISOString().slice(0, 10);
          const { error: histError } = await supabase
            .from("price_history")
            .upsert(
              {
                metal_id: coverage.metalId,
                source_id: coverage.sourceId,
                trade_date: tradeDate,
                open: candle.o,
                high: candle.h,
                low: candle.l,
                close: candle.c,
                currency: coverage.currency,
                unit: coverage.unit,
                data_status: "live",
              },
              { onConflict: "metal_id,source_id,trade_date" }
            );

          if (histError) {
            errors.push(`History ${coverage.sourceSymbol} ${tradeDate}: ${histError.message}`);
          } else {
            totalRows++;
          }
        }

        successes.push(`${coverage.sourceSymbol}: $${meta.regularMarketPrice}`);
        yahooSuccess = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Yahoo ${coverage.sourceSymbol}: ${msg}`);
        yahooError = msg;
      }
    }

    // Update Yahoo Finance source status
    if (yahooSuccess) {
      await supabase
        .from("data_sources")
        .update({
          status: "connected",
          last_success_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "yahoo-finance");
    } else {
      await supabase
        .from("data_sources")
        .update({
          status: "error",
          last_error: yahooError,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "yahoo-finance");
    }

    // === 2. Collect Frankfurter exchange rates ===
    try {
      const { rates, date } = await fetchFrankfurterRates();
      const rateDate = new Date(date).toISOString();

      for (const currency of FRANKFURTER_CURRENCIES) {
        if (!(currency in rates)) errors.push(`Frankfurter: no ${currency} rate returned`);
      }

      for (const [quote, rate] of Object.entries(rates)) {
        if (!Number.isFinite(rate) || rate <= 0) continue;
        await supabase
          .from("exchange_rates")
          .upsert(
            {
              base_currency: "USD",
              quote_currency: quote,
              rate: rate,
              rate_date: rateDate,
              origin: "Frankfurter API (ECB)",
              data_status: "live",
            },
            { onConflict: "base_currency,quote_currency,rate_date" }
          );
        totalRows++;
        successes.push(`USD/${quote}: ${rate}`);
      }

      // Also store inverse rates
      for (const [quote, rate] of Object.entries(rates)) {
        if (!Number.isFinite(rate) || rate <= 0) continue;
        await supabase
          .from("exchange_rates")
          .upsert(
            {
              base_currency: quote,
              quote_currency: "USD",
              rate: 1 / rate,
              rate_date: rateDate,
              origin: "Frankfurter API (ECB, inverse)",
              data_status: "live",
            },
            { onConflict: "base_currency,quote_currency,rate_date" }
          );
        totalRows++;
      }

      await supabase
        .from("data_sources")
        .update({
          status: "connected",
          last_success_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "frankfurter");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Frankfurter: ${msg}`);
      await supabase
        .from("data_sources")
        .update({
          status: "error",
          last_error: msg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "frankfurter");
    }

    // === 3. Log the ingestion run ===
    await supabase.from("update_logs").insert({
      source_id: null,
      job: "market-data-collection",
      status: errors.length === 0 ? "success" : "error",
      started_at: jobStartedAt,
      finished_at: new Date().toISOString(),
      rows_written: totalRows,
      message: errors.length === 0
        ? `Collected ${successes.length} quotes/rates. ${totalRows} rows written.`
        : `Partial: ${successes.length} ok, ${errors.length} errors. ${totalRows} rows written.`,
    });

    return new Response(
      JSON.stringify({
        status: errors.length === 0 ? "success" : "partial",
        rowsWritten: totalRows,
        successes,
        errors,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase.from("update_logs").insert({
      source_id: null,
      job: "market-data-collection",
      status: "error",
      started_at: jobStartedAt,
      finished_at: new Date().toISOString(),
      rows_written: totalRows,
      message: msg,
    });
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
