const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

export const getProducts = (query = "") => request(`/products${query}`);
export const register = (body) => request("/auth/register", { method: "POST", body });
export const login = (body) => request("/auth/login", { method: "POST", body });
export const createProduct = (body, token) => request("/products", { method: "POST", body, token });
export const updateProduct = (id, body, token) => request(`/products/${id}`, { method: "PUT", body, token });
export const deleteProduct = (id, token) => request(`/products/${id}`, { method: "DELETE", token });
export const createOrder = (body, token) => request("/orders", { method: "POST", body, token });
export const getMyOrders = (token) => request("/orders/my", { token });
