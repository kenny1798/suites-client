//toolsApi.js
import axios from "axios";

// ===== ENV (tanpa '/api' di hujung) =====
// VITE_SALESTRACK=http://localhost:3002
// VITE_HROTG=http://localhost:3003
// (Optional kalau nak refresh token di server auth utama)
// VITE_SERVER=http://localhost:3001

function addAuthInterceptor(instance, { useCookie = false } = {}) {
  // Kalau auth via cookie (httpOnly), enable withCredentials
  if (useCookie) {
    instance.defaults.withCredentials = true;
  }

  // === REQUEST ===
  instance.interceptors.request.use(
    (config) => {
      if (!useCookie) {
        // Ambil token dari localStorage (samakan key dengan app kau)
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      // Default JSON
      config.headers = config.headers || {};
      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }
      return config;
    },
    (err) => Promise.reject(err)
  );

  // === RESPONSE ===
  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const status = error?.response?.status;
      if (status === 401) {
        // Optional: cuba silent refresh kalau kau ada endpoint refresh
        // const baseAuth = import.meta.env.VITE_SERVER;
        // try {
        //   await axios.post(`${baseAuth}/api/auth/refresh`, {}, { withCredentials: true });
        //   // retry sekali
        //   return instance.request(error.config);
        // } catch (e) {
        //   // jatuh ke logout
        // }

        // Token invalid/expired — logout ringan
        localStorage.removeItem("accessToken");
        const ret = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?returnTo=${ret}`;
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

// ===== Client per microservice =====
const clients = {
  // Kalau auth via Bearer token
  salestrack: addAuthInterceptor(axios.create({ baseURL: import.meta.env.VITE_SALESTRACK })),
  hrotg:      addAuthInterceptor(axios.create({ baseURL: import.meta.env.VITE_HROTG })),

  // // Kalau auth via cookie httpOnly (contoh):
  // salestrack: addAuthInterceptor(axios.create({ baseURL: import.meta.env.VITE_SALESTRACK }), { useCookie: true }),
  // hrotg:      addAuthInterceptor(axios.create({ baseURL: import.meta.env.VITE_HROTG }), { useCookie: true }),
};

// Pilih sama ada nak kekal prefix tool dalam path bila forward
const TOOL_RULES = {
  salestrack: { keepPrefix: true },
  hrotg:      { keepPrefix: true },
};

// /api/{tool}/rest -> { client, path }
function route(url = "") {
  const m = url.match(/^\/api\/([^/]+)(\/.*)?$/);
  if (!m) throw new Error(`Invalid URL for toolsApi (expect "/api/{tool}/..."): "${url}"`);
  const tool = m[1];
  const rest = m[2] || "";
  const client = clients[tool];
  const rule = TOOL_RULES[tool];
  if (!client || !rule) throw new Error(`Unknown tool "${tool}" in "${url}"`);
  const path = rule.keepPrefix ? `/api/${tool}${rest}` : `/api${rest}`;
  return { client, path };
}

const toolsApi = {
  get:    (url, config)       => { const { client, path } = route(url); return client.get(path, config); },
  post:   (url, data, config) => { const { client, path } = route(url); return client.post(path, data, config); },
  put:    (url, data, config) => { const { client, path } = route(url); return client.put(path, data, config); },
  delete: (url, config)       => { const { client, path } = route(url); return client.delete(path, config); },
  patch:  (url, data, config) => { const { client, path } = route(url); 
    if (typeof client.patch === 'function') {
      return client.patch(path, data, config);
    }
    // Fallback kalau client tak expose patch (rare)
    return client.post(path, data, { ...(config||{}), headers: { ...(config?.headers||{}), 'X-HTTP-Method-Override': 'PATCH' }});
  },
};

export default toolsApi;
