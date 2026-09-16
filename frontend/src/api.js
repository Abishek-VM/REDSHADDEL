const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const fallbackProducts = [
  ["transit-jacket", "The Transit Jacket", "A soft-structured everyday layer with a generous cut.", 4890, "Outerwear", "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80", 18, true],
  ["axis-shirt", "Axis Cotton Shirt", "A crisp cotton shirt with an intentionally relaxed shoulder.", 2690, "Tops", "https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=900&q=80", 24, true],
  ["quiet-trouser", "Quiet Taper Trouser", "A fluid trouser made to move through the whole day.", 3290, "Bottoms", "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80", 15, false],
  ["signal-cap", "Signal Cap", "A low-profile cotton cap with a considered finish.", 990, "Accessories", "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80", 32, false],
  ["second-skin-tee", "Second Skin Tee", "Heavyweight jersey, clean neckline, no unnecessary noise.", 1490, "Tops", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80", 30, false],
  ["after-hours-coat", "After Hours Coat", "A longline coat for the last train home and everything after.", 6990, "Outerwear", "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=900&q=80", 8, true],
  ["redline-coat-suit", "Redline Coat Suit", "A confident red wool-blend suit for nights that need a sharper silhouette.", 8490, "Outerwear", "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=900&q=80", 10, true],
  ["studio-overshirt", "Studio Overshirt", "A workwear-inspired overshirt with a clean, easy fit.", 2990, "Outerwear", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80", 16, false],
  ["wide-leg-uniform", "Wide Leg Uniform", "A full-length wide-leg trouser with a soft structured drape.", 3590, "Bottoms", "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80", 14, false],
  ["archive-knit", "Archive Knit", "A textural knit made for quiet layering.", 3190, "Tops", "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80", 20, false],
  ["object-tote", "Object Tote", "A roomy cotton canvas tote for the things you carry daily.", 1290, "Accessories", "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80", 28, false],
  ["night-shift-tee", "Night Shift Tee", "A heavyweight tee with a boxy cut and soft hand feel.", 1690, "Tops", "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=80", 25, false]
].map(([id, name, description, price, category, image, stock, featured]) => ({
  _id: `fallback-${id}`,
  name,
  description,
  price,
  category,
  image,
  stock,
  featured,
  colors: ["Black"],
  sizes: ["S", "M", "L", "XL"]
}));

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

export const getProducts = async (query = "") => {
  try {
    return await request(`/products${query}`);
  } catch (error) {
    if (query) return fallbackProducts;
    console.warn("Product API unavailable; showing the starter catalog.", error.message);
    return fallbackProducts;
  }
};
export const register = (body) => request("/auth/register", { method: "POST", body });
export const login = (body) => request("/auth/login", { method: "POST", body });
export const createProduct = (body, token) => request("/products", { method: "POST", body, token });
export const updateProduct = (id, body, token) => request(`/products/${id}`, { method: "PUT", body, token });
export const deleteProduct = (id, token) => request(`/products/${id}`, { method: "DELETE", token });
export const createOrder = (body, token) => request("/orders", { method: "POST", body, token });
export const getMyOrders = (token) => request("/orders/my", { token });
