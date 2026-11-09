/*
# Seed metal categories and data source registry

Plain-English summary
Adds the eight metal categories and the eleven price source definitions as reference data. These are
descriptions of where prices would come from, not price values. No quotation, history or rate is added.

1. Modified Tables
- `metal_categories`: eight rows with fixed ids.
- `data_sources`: eleven rows with status `pending` (no connection has been tested). Sources without a public URL are marked `unavailable`.

2. Security
- No security changes. Existing read-only policies apply.

3. Important notes
- Uses fixed text ids and ON CONFLICT DO NOTHING, so re-running this migration does not duplicate or overwrite rows.
- Source status is only changed by the ingestion server after a real connection test succeeds.
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

INSERT INTO data_sources (id, name, url, market_type, region, quality_score, status) VALUES
  ('lme', 'London Metal Exchange', 'https://www.lme.com', 'exchange', 'Глобальный', 0.95, 'pending'),
  ('comex', 'COMEX / CME', 'https://www.cmegroup.com', 'exchange', 'США', 0.94, 'pending'),
  ('shfe', 'Shanghai Futures Exchange', 'https://www.shfe.com.cn', 'exchange', 'Китай', 0.92, 'pending'),
  ('lbma', 'London Bullion Market Association', 'https://www.lbma.org.uk', 'spot', 'Глобальный', 0.96, 'pending'),
  ('kitco', 'Kitco Metals', 'https://www.kitco.com', 'spot', 'Глобальный', 0.88, 'pending'),
  ('fastmarkets', 'Fastmarkets MB', 'https://www.fastmarkets.com', 'wholesale', 'Глобальный', 0.90, 'pending'),
  ('asian-metal', 'Asian Metal', 'https://www.asianmetal.com', 'regional', 'Азия', 0.85, 'pending'),
  ('metals-api', 'MetalsAPI (commercial)', 'https://metalsapi.com', 'spot', 'Глобальный', 0.87, 'pending'),
  ('scrap-sources', 'Региональные источники лома', '', 'scrap', 'Региональный', 0.75, 'unavailable'),
  ('raw-sources', 'Источники цен на сырье', '', 'raw', 'Региональный', 0.78, 'unavailable'),
  ('ferroalloy-sources', 'Источники цен на ферросплавы', '', 'wholesale', 'Региональный', 0.80, 'unavailable')
ON CONFLICT (id) DO NOTHING;
