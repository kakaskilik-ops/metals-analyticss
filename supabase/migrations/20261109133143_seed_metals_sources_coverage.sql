/*
# Seed metal catalog, data sources, and source coverage

Seeds 8 metal categories, the metal catalog (about 45 metals), the data source
registry (Yahoo Finance and Frankfurter as connected-capable free sources, plus
reference entries for LME, COMEX, SHFE, LBMA and USGS), and the coverage map of
7 metals that Yahoo Finance provides futures for.

Security: no changes. Existing read-only policies apply.
Idempotent: ON CONFLICT DO NOTHING, so re-running does not duplicate rows.
Source status starts as pending and is only changed by the ingestion function.
*/

INSERT INTO metal_categories (id, name, short_name, description, sort_order) VALUES
  ('non-ferrous', 'Цветные металлы', 'Цветные', 'Основные промышленные цветные металлы, торгуемые на биржах LME, COMEX, SHFE.', 1),
  ('precious', 'Драгоценные металлы', 'Драгоценные', 'Драгоценные металлы, котируемые на LBMA, COMEX и спотовом рынке.', 2),
  ('rare-strategic', 'Редкие и стратегические металлы', 'Редкие', 'Редкие и стратегические металлы, критичные для высокотехнологичных отраслей.', 3),
  ('rare-earth', 'Редкоземельные элементы', 'РЗЭ', 'Лантаноиды, иттрий и скандий — редкоземельные элементы для магнитов и электроники.', 4),
  ('ferrous', 'Черные металлы и сырье', 'Черные', 'Железо, сталь и сырье для черной металлургии.', 5),
  ('ferroalloys', 'Ферросплавы', 'Ферросплавы', 'Ферросплавы для легирования стали и чугуна.', 6),
  ('scrap', 'Вторичные металлы и лом', 'Лом', 'Вторичные металлы и лом — цены на переработку и утилизацию.', 7),
  ('special-alloys', 'Специальные сплавы', 'Сплавы', 'Специальные сплавы для особых условий эксплуатации.', 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO metals (id, category_id, symbol, name, name_ru, aliases, atomic_number, unit, currency, base_price, volatility, trend, description) VALUES
  ('copper', 'non-ferrous', 'Cu', 'Copper', 'Медь', ARRAY['медь','меди'], 29, 'kg', 'USD', 9.2, 0.018, 0.0003, 'Один из важнейших промышленных металлов.'),
  ('aluminum', 'non-ferrous', 'Al', 'Aluminum', 'Алюминий', ARRAY['алюминий','алюминия'], 13, 'kg', 'USD', 2.4, 0.015, 0.0001, 'Лёгкий цветной металл.'),
  ('nickel', 'non-ferrous', 'Ni', 'Nickel', 'Никель', ARRAY['никель','никеля'], 28, 'kg', 'USD', 16.8, 0.025, 0.0002, 'Тугоплавкий цветной металл.'),
  ('zinc', 'non-ferrous', 'Zn', 'Zinc', 'Цинк', ARRAY['цинк','цинка'], 30, 'kg', 'USD', 2.7, 0.017, 0.0001, 'Цветной металл для цинкования.'),
  ('lead', 'non-ferrous', 'Pb', 'Lead', 'Свинец', ARRAY['свинец','свинца'], 82, 'kg', 'USD', 2.1, 0.014, -0.0001, 'Тяжёлый цветной металл.'),
  ('tin', 'non-ferrous', 'Sn', 'Tin', 'Олово', ARRAY['олово','олова'], 50, 'kg', 'USD', 28.5, 0.02, 0.0002, 'Мягкий цветной металл.'),
  ('cobalt', 'non-ferrous', 'Co', 'Cobalt', 'Кобальт', ARRAY['кобальт','кобальта'], 27, 'kg', 'USD', 33.5, 0.03, -0.0002, 'Стратегический металл.'),
  ('gold', 'precious', 'Au', 'Gold', 'Золото', ARRAY['золото','золота'], 79, 'ozt', 'USD', 78000, 0.012, 0.0004, 'Традиционное средство сохранения стоимости.'),
  ('silver', 'precious', 'Ag', 'Silver', 'Серебро', ARRAY['серебро','серебра'], 47, 'ozt', 'USD', 950, 0.02, 0.0003, 'Драгоценный металл с промышленной долей.'),
  ('platinum', 'precious', 'Pt', 'Platinum', 'Платина', ARRAY['платина','платины'], 78, 'ozt', 'USD', 31000, 0.016, 0.0001, 'Металл группы платины.'),
  ('palladium', 'precious', 'Pd', 'Palladium', 'Палладий', ARRAY['палладий','палладия'], 46, 'ozt', 'USD', 34000, 0.025, -0.0002, 'Металл группы платины.'),
  ('rhodium', 'precious', 'Rh', 'Rhodium', 'Родий', ARRAY['родий','родия'], 45, 'ozt', 'USD', 145000, 0.04, -0.0003, 'Самый редкий металл группы платины.'),
  ('molybdenum', 'rare-strategic', 'Mo', 'Molybdenum', 'Молибден', ARRAY['молибден','молибдена'], 42, 'kg', 'USD', 24, 0.02, 0.0002, 'Стратегический тугоплавкий металл.'),
  ('tungsten', 'rare-strategic', 'W', 'Tungsten', 'Вольфрам', ARRAY['вольфрам','вольфрама'], 74, 'kg', 'USD', 35, 0.018, 0.0001, 'Самый тугоплавкий металл.'),
  ('lithium', 'rare-strategic', 'Li', 'Lithium', 'Литий', ARRAY['литий','лития'], 3, 'kg', 'USD', 85, 0.035, -0.0003, 'Ключевой металл для аккумуляторов.'),
  ('titanium', 'rare-strategic', 'Ti', 'Titanium', 'Титан', ARRAY['титан','титана'], 22, 'kg', 'USD', 6.8, 0.015, 0.0001, 'Лёгкий прочный металл.'),
  ('vanadium', 'rare-strategic', 'V', 'Vanadium', 'Ванадий', ARRAY['ванадий','ванадия'], 23, 'kg', 'USD', 13.5, 0.028, 0.0002, 'Металл для упрочнения стали.'),
  ('neodymium', 'rare-earth', 'Nd', 'Neodymium', 'Неодим', ARRAY['неодим','неодима'], 60, 'kg', 'USD', 82.5, 0.012, 0.0004, 'Редкоземельный металл для магнитов.'),
  ('praseodymium', 'rare-earth', 'Pr', 'Praseodymium', 'Празеодим', ARRAY['празеодим','празеодима'], 59, 'kg', 'USD', 78.2, 0.011, 0.0003, 'Редкоземельный металл.'),
  ('dysprosium', 'rare-earth', 'Dy', 'Dysprosium', 'Диспрозий', ARRAY['диспрозий','диспрозия'], 66, 'kg', 'USD', 208, 0.014, -0.0002, 'Тяжёлый редкоземельный металл.'),
  ('terbium', 'rare-earth', 'Tb', 'Terbium', 'Тербий', ARRAY['тербий','тербия'], 65, 'kg', 'USD', 325, 0.016, 0.0005, 'Тяжёлый редкоземельный металл.'),
  ('yttrium', 'rare-earth', 'Y', 'Yttrium', 'Иттрий', ARRAY['иттрий','иттрия'], 39, 'kg', 'USD', 12.8, 0.01, 0.0002, 'Редкоземельный металл.'),
  ('iron-ore', 'ferrous', 'Fe₂O₃', 'Iron Ore', 'Железная руда', ARRAY['железная руда','руда'], NULL, 'ton', 'USD', 0.1, 0.03, 0.0001, 'Сырьё для выплавки чугуна и стали.'),
  ('steel', 'ferrous', '—', 'Steel', 'Сталь', ARRAY['сталь','стали'], NULL, 'kg', 'USD', 0.7, 0.018, 0.0001, 'Основной конструкционный сплав.'),
  ('hot-rolled', 'ferrous', 'HRC', 'Hot Rolled Coil', 'Горячекатаный прокат', ARRAY['горячекатаный прокат','hrc'], NULL, 'ton', 'USD', 700, 0.019, 0.0001, 'Горячекатаный листовой прокат.'),
  ('ferrochromium', 'ferroalloys', 'FeCr', 'Ferrochromium', 'Феррохром', ARRAY['феррохром'], NULL, 'kg', 'USD', 2.5, 0.022, 0.0001, 'Ферросплав для нержавеющей стали.'),
  ('ferromanganese', 'ferroalloys', 'FeMn', 'Ferromanganese', 'Ферромарганец', ARRAY['ферромарганец'], NULL, 'kg', 'USD', 1.2, 0.02, 0.0001, 'Ферросплав для раскисления стали.'),
  ('scrap-copper', 'scrap', 'Cu', 'Copper Scrap', 'Лом меди', ARRAY['лом меди'], 29, 'kg', 'USD', 7.8, 0.02, 0.0002, 'Вторичная медь.'),
  ('scrap-aluminum', 'scrap', 'Al', 'Aluminum Scrap', 'Лом алюминия', ARRAY['лом алюминия'], 13, 'kg', 'USD', 1.8, 0.018, 0.0001, 'Вторичный алюминий.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO data_sources (id, name, url, api_endpoint, market_type, region, quality_score, status, api_key_required, api_key_configured, attribution, license, free_tier_limit) VALUES
  ('yahoo-finance', 'Yahoo Finance (Unofficial)', 'https://finance.yahoo.com', 'https://query2.finance.yahoo.com/v8/finance/chart', 'exchange', 'США', 0.82, 'pending', false, false, 'Yahoo Finance', 'Unofficial — no official API license. Data is publicly accessible but ToS restricts automated access. For demonstration only.', 'No key required. Informal rate limits apply.'),
  ('frankfurter', 'Frankfurter API (ECB Rates)', 'https://frankfurter.app', 'https://api.frankfurter.app', 'spot', 'Глобальный', 0.90, 'pending', false, false, 'European Central Bank reference rates via Frankfurter API', 'MIT (API), ECB public data (rates). Commercial use permitted.', 'No key required. No documented hard limit.'),
  ('lme', 'London Metal Exchange', 'https://www.lme.com', '', 'exchange', 'Глобальный', 0.95, 'unavailable', true, false, 'LME', 'Requires paid data license. No free public API.', 'No free tier.'),
  ('comex', 'COMEX / CME', 'https://www.cmegroup.com', '', 'exchange', 'США', 0.94, 'unavailable', true, false, 'CME Group', 'Requires paid data license. No free public API.', 'No free tier.'),
  ('shfe', 'Shanghai Futures Exchange', 'https://www.shfe.com.cn', '', 'exchange', 'Китай', 0.92, 'unavailable', true, false, 'SHFE', 'Requires paid data license. No free public API.', 'No free tier.'),
  ('lbma', 'London Bullion Market Association', 'https://www.lbma.org.uk', '', 'spot', 'Глобальный', 0.96, 'unavailable', true, false, 'LBMA', 'Requires paid data license. No free public API.', 'No free tier.'),
  ('usgs', 'USGS Mineral Commodity Data', 'https://www.usgs.gov', '', 'wholesale', 'США', 0.80, 'pending', false, false, 'U.S. Geological Survey', 'Public domain (U.S. Government work). Commercial use permitted.', 'No key required. Annual/monthly publications, not real-time.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO metal_source_coverage (metal_id, source_id, source_symbol, grade, product_form) VALUES
  ('gold', 'yahoo-finance', 'GC=F', 'Futures', 'COMEX Gold Futures'),
  ('silver', 'yahoo-finance', 'SI=F', 'Futures', 'COMEX Silver Futures'),
  ('platinum', 'yahoo-finance', 'PL=F', 'Futures', 'NYMEX Platinum Futures'),
  ('palladium', 'yahoo-finance', 'PA=F', 'Futures', 'NYMEX Palladium Futures'),
  ('copper', 'yahoo-finance', 'HG=F', 'Futures', 'COMEX Copper Futures'),
  ('aluminum', 'yahoo-finance', 'ALI=F', 'Futures', 'COMEX Aluminum Futures'),
  ('hot-rolled', 'yahoo-finance', 'HRC=F', 'Futures', 'CME HRC Steel Futures')
ON CONFLICT (metal_id, source_id) DO NOTHING;
