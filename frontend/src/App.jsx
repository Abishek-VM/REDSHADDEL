import { useEffect, useMemo, useState } from "react";
import { createOrder, createProduct, deleteProduct, getMyOrders, getProducts, login, register, updateProduct } from "./api";
import "./App.css";

const emptyForm = {
	name: "",
	description: "",
	price: "",
	category: "Outerwear",
	image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80",
	stock: "10",
	featured: false
};
const categories = ["All pieces", "Outerwear", "Tops", "Bottoms", "Accessories"];
const formatPrice = (price) => `Rs. ${Number(price).toLocaleString("en-IN")}`;
const emptyBilling = { address: "", city: "", state: "", postalCode: "", country: "India" };
const fallbackProductImage = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";
const cartStorageKey = (currentUser) => `redshaddel_cart_${currentUser?.id || currentUser?._id || currentUser?.email || "guest"}`;
const readCart = (currentUser) => JSON.parse(localStorage.getItem(cartStorageKey(currentUser)) || "[]");

function App() {
	const [products, setProducts] = useState([]);
	const [category, setCategory] = useState("All pieces");
	const [query, setQuery] = useState("");
	const [authMode, setAuthMode] = useState(null);
	const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
	const [adminOpen, setAdminOpen] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [productForm, setProductForm] = useState(emptyForm);
	const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("redshaddel_user") || "null"));
	const [token, setToken] = useState(() => localStorage.getItem("redshaddel_token"));
	const [notice, setNotice] = useState("");
	const [loading, setLoading] = useState(true);
	const [cart, setCart] = useState(() => readCart(JSON.parse(localStorage.getItem("redshaddel_user") || "null")));
	const [cartOpen, setCartOpen] = useState(false);
	const [checkoutOpen, setCheckoutOpen] = useState(false);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [orders, setOrders] = useState([]);
	const [billing, setBilling] = useState(emptyBilling);

	const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
	const shipping = subtotal >= 4000 || subtotal === 0 ? 0 : 199;
	const tax = Math.round(subtotal * 0.05);
	const grandTotal = subtotal + shipping + tax;

	const visibleProducts = useMemo(() => products.filter((product) => {
		return (category === "All pieces" || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase());
	}), [products, category, query]);

	const loadProducts = async () => {
		try { setLoading(true); setProducts(await getProducts()); }
		catch (error) { setNotice(error.message); }
		finally { setLoading(false); }
	};
	useEffect(() => { loadProducts(); }, []);
	useEffect(() => { setCart(readCart(user)); }, [user]);
	useEffect(() => { localStorage.setItem(cartStorageKey(user), JSON.stringify(cart)); }, [cart, user]);

	const addToCart = (product) => {
		setCart((current) => {
			const existing = current.find((item) => item.product === product._id);
			if (existing) return current.map((item) => item.product === product._id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item);
			return [...current, { product: product._id, name: product.name, image: product.image, price: product.price, size: product.sizes?.[0] || "M", quantity: 1, stock: product.stock }];
		});
		setCartOpen(true);
	};

	const changeQuantity = (id, amount) => setCart((current) => current.map((item) => item.product === id ? { ...item, quantity: Math.max(1, Math.min(item.quantity + amount, item.stock)) } : item));
	const removeFromCart = (id) => setCart((current) => current.filter((item) => item.product !== id));

	const openHistory = async () => {
		if (!token) { setAuthMode("login"); return; }
		try { setOrders(await getMyOrders(token)); setHistoryOpen(true); }
		catch (error) { setNotice(error.message); }
	};

	const handleCheckout = async (event) => {
		event.preventDefault();
		if (!token) { setCheckoutOpen(false); setAuthMode("login"); return; }
		try {
			await createOrder({ items: cart.map(({ product, name, image, price, quantity, size }) => ({ product, name, image, price, quantity, size })), shippingAddress: billing, totalPrice: grandTotal, paymentMethod: "COD" }, token);
			setCart([]); setBilling(emptyBilling); setCheckoutOpen(false); setCartOpen(false); setNotice("Order placed. We will send your confirmation shortly.");
		} catch (error) { setNotice(error.message); }
	};

	const handleAuth = async (event) => {
		event.preventDefault();
		try {
			const response = authMode === "login" ? await login(authForm) : await register(authForm);
			localStorage.setItem("redshaddel_token", response.token);
			localStorage.setItem("redshaddel_user", JSON.stringify(response.user));
			setToken(response.token); setUser(response.user); setCart(readCart(response.user)); setAuthMode(null);
			setAuthForm({ name: "", email: "", password: "" });
			setNotice(`Welcome to the atelier, ${response.user.name}.`);
		} catch (error) { setNotice(error.message); }
	};

	const handleProductSubmit = async (event) => {
		event.preventDefault();
		try {
			const body = { ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) };
			if (editingId) await updateProduct(editingId, body, token); else await createProduct(body, token);
			setProductForm(emptyForm); setEditingId(null); await loadProducts();
			setNotice(editingId ? "Piece updated." : "New piece added to the collection.");
		} catch (error) { setNotice(error.message); }
	};

	const startEdit = (product) => {
		setEditingId(product._id);
		setProductForm({ ...product, price: product.price.toString(), stock: product.stock.toString() });
		setAdminOpen(true); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
	};

	const removeProduct = async (id) => {
		if (!window.confirm("Remove this piece from the collection?")) return;
		try { await deleteProduct(id, token); await loadProducts(); setNotice("Piece removed."); }
		catch (error) { setNotice(error.message); }
	};

	const logout = () => {
		localStorage.removeItem("redshaddel_token"); localStorage.removeItem("redshaddel_user");
		setToken(null); setUser(null); setCart(readCart(null)); setAdminOpen(false); setNotice("You have been signed out.");
	};

	return (
		<div className="app-shell">
			<div className="announcement">Complimentary shipping on orders over Rs. 4,000 <span>↗</span></div>
			<header className="site-header">
				<a className="wordmark" href="#top">REDSHADDEL<span>®</span></a>
				<nav><a href="#collection">Collection</a><a href="#journal">Journal</a><a href="#about">About</a></nav>
				<div className="header-actions">
					<button className="icon-button" aria-label="Search" onClick={() => document.querySelector(".search-input")?.focus()}>⌕</button>
					{user ? <><button className="account-button" onClick={openHistory}>Orders</button><button className="account-button" onClick={logout}>{user.name.split(" ")[0]} · Sign out</button></> : <button className="account-button" onClick={() => setAuthMode("login")}>Account</button>}
					<button className="bag" onClick={() => setCartOpen(true)}>Bag <span>{cart.reduce((total, item) => total + item.quantity, 0)}</span></button>
				</div>
			</header>

			<main id="top">
				<section className="hero-section">
					<div className="hero-copy"><p className="eyebrow">SS26 / A NEW LAYER</p><h1>Clothing with<br /><em>another point of view.</em></h1><p className="hero-intro">Objects for the in-between. Considered silhouettes, tactile materials, and a little more room to move.</p><a className="text-link" href="#collection">Explore the collection <span>↗</span></a></div>
					<div className="hero-image"><img src="https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=1800&q=85" alt="Man wearing a full red coat suit" /><span className="image-note">01 / 06</span></div>
				</section>

				<section className="manifesto" id="about"><p className="eyebrow">THE REDSHADDEL METHOD</p><p className="manifesto-copy">Less noise. Better things. We make everyday uniforms for people who make their own rules.</p></section>

				<section className="collection-section" id="collection">
					<div className="section-heading"><div><p className="eyebrow">THE EDIT / {new Date().getFullYear()}</p><h2>Current pieces</h2></div><div className="collection-tools"><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pieces" /><span>{visibleProducts.length} results</span></div></div>
					<div className="category-list">{categories.map((item) => <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
					{notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
					{loading ? <p className="empty-state">Loading the collection...</p> : visibleProducts.length ? <div className="product-grid">{visibleProducts.map((product, index) => <article className="product-card" key={product._id}><div className="product-image"><img src={product.image} alt={product.name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackProductImage; }} /><span className="product-index">0{index + 1}</span>{product.featured && <span className="featured-label">Featured</span>}</div><div className="product-meta"><div><h3>{product.name}</h3><p>{product.category} / {product.colors?.[0] || "Black"}</p></div><strong>{formatPrice(product.price)}</strong></div><button className="add-button" onClick={() => addToCart(product)}>Add to bag <span>+</span></button>{user?.role === "admin" && <div className="admin-actions"><button onClick={() => startEdit(product)}>Edit</button><button onClick={() => removeProduct(product._id)}>Delete</button></div>}</article>)}</div> : <p className="empty-state">No pieces found. Add the first one from the studio.</p>}
				</section>

				<section className="journal-section" id="journal"><div className="journal-image"><img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80" alt="Redshaddel editorial styling" /></div><div className="journal-copy"><p className="eyebrow">FIELD NOTES / 001</p><h2>The shape of<br /><em>staying curious.</em></h2><p>We are interested in clothes that keep their secrets until you wear them in. A pocket in the right place. A line that only appears in motion.</p><a className="text-link" href="#about">Read the note <span>↗</span></a></div></section>

				{user?.role === "admin" && <section className="studio-section" id="studio"><div className="section-heading"><div><p className="eyebrow">PRIVATE STUDIO</p><h2>{editingId ? "Refine a piece" : "Add to the edit"}</h2></div><button className="close-studio" onClick={() => { setAdminOpen(!adminOpen); setEditingId(null); setProductForm(emptyForm); }}>{adminOpen ? "Close studio" : "Open studio"}</button></div>{adminOpen && <form className="product-form" onSubmit={handleProductSubmit}>{["name", "description", "price", "image", "stock"].map((field) => <label key={field}>{field}<input required={field !== "description"} value={productForm[field]} onChange={(event) => setProductForm({ ...productForm, [field]: event.target.value })} placeholder={field === "image" ? "Image URL" : field === "price" ? "Price in INR" : field === "stock" ? "Stock count" : field === "description" ? "A short description" : "Piece name"} /></label>)}<label>category<select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="checkbox-label"><input type="checkbox" checked={productForm.featured} onChange={(event) => setProductForm({ ...productForm, featured: event.target.checked })} /> Featured piece</label><button className="submit-button" type="submit">{editingId ? "Save changes" : "Create piece"} <span>↗</span></button></form>}</section>}
			</main>

			<footer><a className="wordmark" href="#top">REDSHADDEL<span>®</span></a><p>Made for the wonderfully unfinished.</p><div><a href="#collection">Shop</a><a href="#journal">Journal</a><a href="mailto:hello@redshaddel.com">Contact</a></div></footer>

			{cartOpen && <div className="drawer-backdrop" onClick={() => setCartOpen(false)}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-heading"><div><p className="eyebrow">YOUR SELECTION</p><h2>Bag / {cart.length}</h2></div><button onClick={() => setCartOpen(false)}>×</button></div>{cart.length ? <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.product}><img src={item.image} alt={item.name} /><div><h3>{item.name}</h3><p>{formatPrice(item.price)} / {item.size}</p><div className="quantity"><button onClick={() => changeQuantity(item.product, -1)}>-</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.product, 1)}>+</button><button className="remove-item" onClick={() => removeFromCart(item.product)}>Remove</button></div></div></div>)}</div><div className="cart-summary"><p><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></p><p><span>Shipping</span><strong>{shipping ? formatPrice(shipping) : "Complimentary"}</strong></p><p><span>GST</span><strong>{formatPrice(tax)}</strong></p><p className="total-line"><span>Total</span><strong>{formatPrice(grandTotal)}</strong></p><button className="submit-button" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Proceed to billing <span>↗</span></button></div></> : <p className="empty-state">Your bag is waiting for a first layer.</p>}</aside></div>}

			{checkoutOpen && <div className="modal-backdrop" onClick={() => setCheckoutOpen(false)}><div className="checkout-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setCheckoutOpen(false)}>×</button><p className="eyebrow">CHECKOUT / BILLING</p><h2>Where should we send it?</h2><p className="checkout-total">Pay on delivery · {formatPrice(grandTotal)}</p><form className="billing-form" onSubmit={handleCheckout}>{[["address", "Address"], ["city", "City"], ["state", "State"], ["postalCode", "Postal code"], ["country", "Country"]].map(([field, label]) => <label key={field}>{label}<input required value={billing[field]} onChange={(event) => setBilling({ ...billing, [field]: event.target.value })} /></label>)}<button className="submit-button" type="submit">Place order <span>↗</span></button></form></div></div>}

			{historyOpen && <div className="modal-backdrop" onClick={() => setHistoryOpen(false)}><div className="history-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setHistoryOpen(false)}>×</button><p className="eyebrow">YOUR JOURNEY / ORDERS</p><h2>Purchase history.</h2>{orders.length ? <div className="order-list">{orders.map((order) => <div className="order-card" key={order._id}><div><strong>#{order._id.slice(-6).toUpperCase()}</strong><p>{new Date(order.createdAt).toLocaleDateString("en-IN")} / {order.items.length} pieces</p></div><div><strong>{formatPrice(order.totalPrice)}</strong><p className="order-status">{order.status}</p></div></div>)}</div> : <p className="empty-state">Your purchase history is empty.</p>}</div></div>}

			{authMode && <div className="modal-backdrop" onClick={() => setAuthMode(null)}><div className="auth-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAuthMode(null)}>×</button><p className="eyebrow">REDSHADDEL / {authMode === "login" ? "WELCOME BACK" : "JOIN THE EDIT"}</p><h2>{authMode === "login" ? "Enter the studio." : "Make an account."}</h2><form onSubmit={handleAuth}>{authMode === "register" && <input required placeholder="Name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} />}<input required type="email" placeholder="Email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /><input required minLength="6" type="password" placeholder="Password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /><button className="submit-button" type="submit">{authMode === "login" ? "Sign in" : "Create account"} <span>↗</span></button></form><button className="switch-auth" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button></div></div>}
		</div>
	);
}

export default App;
