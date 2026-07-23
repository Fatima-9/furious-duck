export const ROLE_IDS = {
  CLIENT: 1,
  ADMIN: 2,
  EMPLOYE_BOUTIQUE: 3,
};

export function getRoleLabel(user) {
  if (!user) return null;
  if (user?.role) return user.role;

  switch (Number(user?.role_id)) {
    case ROLE_IDS.ADMIN:
      return 'admin';
    case ROLE_IDS.EMPLOYE_BOUTIQUE:
      return 'employe_boutique';
    case ROLE_IDS.CLIENT:
      return 'client';
    default:
      return null;
  }
}

export function getRoleDisplayName(user) {
  const role = getRoleLabel(user);

  if (role === 'admin') return 'Administrateur';
  if (role === 'employe_boutique') return 'Employe boutique';
  if (role === 'client') return 'Client';
  return 'Compte';
}

export function canParticipate(user) {
  return getRoleLabel(user) === 'client';
}

export function isAdmin(user) {
  return getRoleLabel(user) === 'admin';
}
