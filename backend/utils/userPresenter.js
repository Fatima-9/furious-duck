function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { mot_de_passe, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  sanitizeUser,
};
