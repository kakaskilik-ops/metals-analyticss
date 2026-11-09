import type { MetalCategory } from '@/types/market';

export const CATEGORIES: MetalCategory[] = [
  {
    id: 'non-ferrous',
    name: 'Цветные металлы',
    shortName: 'Цветные',
    description: 'Основные промышленные цветные металлы, торгуемые на биржах LME, COMEX, SHFE.',
  },
  {
    id: 'precious',
    name: 'Драгоценные металлы',
    shortName: 'Драгоценные',
    description: 'Драгоценные металлы, котируемые на LBMA, COMEX и спотовом рынке.',
  },
  {
    id: 'rare-strategic',
    name: 'Редкие и стратегические металлы',
    shortName: 'Редкие',
    description: 'Редкие и стратегические металлы, критичные для высокотехнологичных отраслей.',
  },
  {
    id: 'rare-earth',
    name: 'Редкоземельные элементы',
    shortName: 'РЗЭ',
    description: 'Лантаноиды, иттрий и скандий — редкоземельные элементы для магнитов и электроники.',
  },
  {
    id: 'ferrous',
    name: 'Черные металлы и сырье',
    shortName: 'Черные',
    description: 'Железо, сталь и сырье для черной металлургии.',
  },
  {
    id: 'ferroalloys',
    name: 'Ферросплавы',
    shortName: 'Ферросплавы',
    description: 'Ферросплавы для легирования стали и чугуна.',
  },
  {
    id: 'scrap',
    name: 'Вторичные металлы и лом',
    shortName: 'Лом',
    description: 'Вторичные металлы и лом — цены на переработку и утилизацию.',
  },
  {
    id: 'special-alloys',
    name: 'Специальные сплавы',
    shortName: 'Сплавы',
    description: 'Специальные сплавы для особых условий эксплуатации.',
  },
];

export const CATEGORY_MAP: Record<string, MetalCategory> = Object.fromEntries(
  CATEGORIES.map((cat) => [cat.id, cat])
);
