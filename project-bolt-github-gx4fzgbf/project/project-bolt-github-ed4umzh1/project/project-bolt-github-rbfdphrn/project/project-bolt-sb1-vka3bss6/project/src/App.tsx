import { useEffect, useState } from 'react';
import AiAnalystPage from '@/pages/AiAnalystPage';
import MarketPage from '@/pages/MarketPage';
import MetalsPage from '@/pages/MetalsPage';
import SourcesPage from '@/pages/SourcesPage';
import Sidebar, { type Section } from '@/components/layout/Sidebar';
import { useFavorites } from '@/hooks/useFavorites';
import { loadLiveMarketData, type LiveMarketData } from '@/services/liveData';

export default function App() {
  const [section, setSection] = useState<Section>('market');
  const [updatedAt] = useState(() => new Date());
  const favorites = useFavorites();
  const [liveData, setLiveData] = useState<LiveMarketData | null>(null);

  useEffect(() => {
    loadLiveMarketData().then(setLiveData);
  }, []);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar active={section} onChange={setSection} />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-10">
        <div key={section} className="mx-auto max-w-7xl animate-fade-up">
          {section === 'market' && <MarketPage updatedAt={updatedAt} favorites={favorites} liveData={liveData} />}
          {section === 'metals' && <MetalsPage updatedAt={updatedAt} favorites={favorites} liveData={liveData} />}
          {section === 'sources' && <SourcesPage updatedAt={updatedAt} liveData={liveData} />}
          {section === 'ai' && <AiAnalystPage updatedAt={updatedAt} />}
        </div>
      </main>
    </div>
  );
}
