import React, { useMemo } from 'react';
import { useAuth } from '@suite/auth';
import { useTools } from '../hooks/useTools';
import { useMySubs } from '../hooks/useMySubs';
import ToolDashboardCard from '../components/ToolDashboardCard.jsx';
import { useMySubs } from '@suite/hooks';


export default function Dashboard() {
  const { user } = useAuth();
  const { data: allTools, loading: loadingTools } = useTools();
  const { map: subsMap, loading: loadingSubs } = useMySubs();

  const isLoading = loadingTools || loadingSubs;

  console.log(useMySubs('salestrack'))

  // =================================================================
  // BLOK KRITIKAL: Punca ralat selalunya di sini.
  // Pastikan blok 'useMemo' hang sebijik macam di bawah.
  // =================================================================
  const { ownedTools, discoverTools } = useMemo(() => {
    if (!allTools || !user?.entitlements?.tools) {
      return { ownedTools: [], discoverTools: allTools || [] };
    }
    
    const owned = allTools.filter(tool => user.entitlements.tools.includes(tool.slug));
    const discover = allTools.filter(tool => !user.entitlements.tools.includes(tool.slug));
    
    return { ownedTools: owned, discoverTools: discover };

  }, [allTools, user]); // <-- Dependency MESTI 'allTools' dan 'user' sahaja.

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-8">
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
                    subscription={subsMap[tool.slug] || null}
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