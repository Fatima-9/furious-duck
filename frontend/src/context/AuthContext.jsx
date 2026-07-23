import { useCallback, useEffect, useMemo, useState } from 'react';
import { clearSession, getMyProfile, getStoredToken, getStoredUser, login, register, storeSession } from '../services/api';
import { AuthContext } from './authContextInstance';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [checkingSession, setCheckingSession] = useState(() => Boolean(getStoredToken() && !getStoredUser()));
  const [authenticating, setAuthenticating] = useState(false);

  const refreshProfile = useCallback(async ({ silent = true } = {}) => {
    if (!getStoredToken()) {
      return null;
    }

    if (!silent) {
      setCheckingSession(true);
    }

    try {
      const profile = await getMyProfile();
      setUser(profile);
      storeSession({ token: getStoredToken(), user: profile });
      return profile;
    } catch {
      clearSession();
      setToken(null);
      setUser(null);
      return null;
    } finally {
      if (!silent) {
        setCheckingSession(false);
      }
    }
  }, []);

  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) return undefined;

    let active = true;

    getMyProfile()
      .then((profile) => {
        if (!active) return;
        setUser(profile);
        storeSession({ token: storedToken, user: profile });
      })
      .catch(() => {
        if (!active) return;
        clearSession();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!active) return;
        setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (payload) => {
    setAuthenticating(true);
    try {
      const session = await login(payload);
      storeSession(session);
      setToken(session.token);
      setUser(session.user);
      return session;
    } finally {
      setAuthenticating(false);
    }
  }, []);

  const signUp = useCallback(async (payload) => {
    setAuthenticating(true);
    try {
      const session = await register(payload);
      storeSession(session);
      setToken(session.token);
      setUser(session.user);
      return session;
    } finally {
      setAuthenticating(false);
    }
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      checkingSession,
      authenticating,
      loading: checkingSession || authenticating,
      isAuthenticated: Boolean(token && user),
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [token, user, checkingSession, authenticating, signIn, signUp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
