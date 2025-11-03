// packages/salestrack/src/utils/teamCounts.js
export function summarizeTeams(teams) {
    const arr = Array.isArray(teams) ? teams : [];
    const isOwner = (t) => t?.role ? t.role === 'OWNER' : (t?.TeamMembers?.[0]?.role === 'OWNER');
    const ownedTeamCount = arr.filter(isOwner).length;
    const teamsCount = arr.length;
    return { ownedTeamCount, teamsCount };
  }
  