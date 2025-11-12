// src/components/TeamSwitcher.jsx

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTeam } from '@suite/core-context'; // Import hook kita
import { CheckIcon, ChevronsUpDownIcon } from './ui.jsx'; // Anggap ikon ni wujud

export default function TeamSwitcher() {
  // Guna hook untuk dapatkan state dari TeamProvider
  const { teams, activeTeam, switchTeam, isLoading } = useTeam();
  const location = useLocation();
  const navigate = useNavigate();

  // Handler bila user tukar team
  const handleSwitchTeam = (teamId) => {
    // Kalau klik team yang sama, tak payah buat apa
    if (!activeTeam || teamId === activeTeam.id) return;

    // Pastikan kalau switchTeam async, kita tunggu selesai dulu
    Promise
      .resolve(switchTeam(teamId))
      .finally(() => {
        // Dapatkan tool slug dari URL sekarang
        // contoh: /salestrack/manage → toolSlug = 'salestrack'
        const parts = location.pathname.split('/').filter(Boolean);
        const toolSlug = parts[0] || '';
        const basePath = toolSlug ? `/${toolSlug}` : '/';

        // Navigate balik ke root tool (contoh: /salestrack)
        navigate(basePath, { replace: true });

        // Hard reload untuk reset semua state
        window.location.reload();
      });
  };

  // Paparan semasa loading atau jika tiada team
  if (isLoading) {
    return (
      <div className="w-full h-9 rounded-md bg-slate-200 animate-pulse" />
    );
  }

  if (!activeTeam || teams.length === 0) {
    return (
      <div className="text-sm text-center text-slate-500 p-2 border rounded-md">
        No teams found.
      </div>
    );
  }

  return (
    <Menu as="div" className="relative w-full text-left">
      {/* Butang yang tunjuk team aktif */}
      <Menu.Button className="flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
        <span className="truncate">{activeTeam.name}</span>
        <ChevronsUpDownIcon className="ml-2 h-4 w-4 text-slate-500" />
      </Menu.Button>

      {/* Panel dropdown */}
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-1">
            {teams.map((team) => (
              <Menu.Item key={team.id}>
                {({ active }) => (
                  <button
                    onClick={() => handleSwitchTeam(team.id)}
                    className={`${
                      active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                    } group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                  >
                    {team.id === activeTeam.id ? (
                      <CheckIcon className="mr-2 h-4 w-4" />
                    ) : (
                      <span className="mr-2 h-4 w-4" /> // Placeholder untuk alignment
                    )}
                    <span className="truncate">{team.name}</span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
