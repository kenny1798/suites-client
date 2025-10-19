// Dalam pages/Marketplace.jsx

import React from 'react';
import ToolCard from '../components/ToolCard.jsx';

// 1. Import hooks yang baru kita buat
import { useTools } from '../hooks/useTools.js';
import { useMySubs } from '../hooks/useMySubs.js';

export default function Marketplace() {
  // 2. Panggil hooks tu untuk dapatkan state
  const { loading: loadingTools, data: tools, error: errorTools } = useTools();
  const { loading: loadingSubs, map: subsMap, error: errorSubs } = useMySubs();

  const isLoading = loadingTools || loadingSubs;
  const error = errorTools || errorSubs;

  if (isLoading) {
    return <div className="p-6">Loading tools...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Tools Marketplace
        </h1>
        <p className="mt-1 text-slate-600">
          Explore and subscribe to tools that power up your business.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* 3. Guna data dari hooks */}
        {tools.map(tool => (
          <ToolCard
            key={tool.slug}
            tool={tool}
            subscription={subsMap[tool.slug] || null}
          />
        ))}
      </div>
    </div>
  );
}