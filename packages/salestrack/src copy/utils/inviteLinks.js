//src/utils/inviteLinks.js
import sha1 from 'js-sha1';

export function hashTeamName(name) {
  const norm = (name || '').trim().toLowerCase();
  return sha1(norm).slice(0, 8);
}

export function buildInviteLinkBase({ teamId, teamName }) {
  const h = hashTeamName(teamName);
  return `/salestrack/invite/${teamId}/${h}`;
}

// Owner/Admin (with role)
export function buildInviteLinkWithRole({ teamId, teamName, role, inviterUserId }) {
  const base = buildInviteLinkBase({ teamId, teamName });
  return `${base}/${role.toUpperCase()}/${inviterUserId}`;
}

// Manager → member under that manager (no role segment; default will be SALES_REP)
export function buildInviteLinkForManager({ teamId, teamName, inviterUserId }) {
  const base = buildInviteLinkBase({ teamId, teamName });
  return `${base}/${inviterUserId}`;
}
