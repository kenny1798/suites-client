import React, { useMemo } from 'react';
import { useAuth } from '@suite/auth';
import { useTools } from '../hooks/useTools'; // <- Hang kena ada hook ni
import ToolDashboardCard from '../components/ToolDashboardCard.jsx';

// --- 1. IMPORT HOOK YANG BETUL ---
import { useMySubs } from '@suite/hooks'; // <-- DIUBAH


export default function Dashboard() {
  const { user } = useAuth();
  const { data: allTools, loading: loadingTools } = useTools();

  // --- 2. GUNA HOOK useMySubs ---
  const { map: subsMap, loading: loadingSubs } = useMySubs(); // <-- DIUBAH

  const isLoading = loadingTools || loadingSubs;

  // --- 3. LOGIK DI FIX (GUNA subsMap) ---
  const { ownedTools, discoverTools } = useMemo(() => {
    if (!allTools) {
      return { ownedTools: [], discoverTools: [] };
    }
    
    // "Owned" = Ada rekod dalam subsMap (tak kira status)
    const owned = allTools.filter(tool => subsMap[tool.slug] != null);
    
    // "Discover" = TAK ADA rekod dalam subsMap
    const discover = allTools.filter(tool => subsMap[tool.slug] == null);
    
    return { ownedTools: owned, discoverTools: discover };

  }, [allTools, subsMap]); // <-- Dependency ditukar ke subsMap

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-8">
        {/* ... (kod yang lain semua sama) ... */}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome, {user?.name || 'User'}!
        </h1>
        <p className="mt-1 text-slate-600">
          Here are the tools available in your suite.
        </p>
      </header>

      {isLoading ? (
        <p>Loading your dashboard...</p>
      ) : (
        <>
          <div>
            <h2 className="text-xl font-bold mb-4">Your Tools</h2>
            {ownedTools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedTools.map(tool => (
                  <ToolDashboardCard
                    key={tool.slug}
                    tool={tool}
                    subscription={subsMap[tool.slug] || null} // <-- Hantar data subscription
                    isOwned={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 px-6 bg-white rounded-lg border-2 border-dashed">
                <h3 className="text-lg font-semibold">Your suite is empty!</h3>
                <p className="text-slate-500 mt-1">Browse our marketplace to add your first tool.</p>
                <a href="/marketplace" className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-white font-semibold hover:bg-slate-700">
                  Go to Marketplace
                </a>
              </div>
            )}
          </div>

          {discoverTools.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-4">Discover More Tools</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {discoverTools.map(tool => (
                  <ToolDashboardCard
                    key={tool.slug}
                    tool={tool}
                    subscription={null}
                    isOwned={false}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

