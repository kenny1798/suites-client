export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async ({ token, profile }) => {
    localStorage.setItem("accessToken", token);
    setUser(profile);
    await refreshEntitlements();
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setEntitlements(null);
  };

  const refreshEntitlements = async () => {
    try {
      const { data } = await api.get("/billing/me/entitlements");
      setEntitlements(data);
    } catch {
      setEntitlements(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setLoading(false); return; }
    refreshEntitlements().finally(() => setLoading(false));
  }, []);

  return (
    <AuthCtx.Provider value={{ user, entitlements, login, logout, refreshEntitlements, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}