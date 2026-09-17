import { useEffect, useMemo, useState } from "react";
import { createOrder, createProduct, deleteProduct, getAllOrders, getMyOrders, getProducts, login, register, updateOrderStatus, updateProduct } from "./api";
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

function OrderHistory({ orders, onClose, onReorder }) {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("All orders");
	const [expandedOrder, setExpandedOrder] = useState(null);
	const statuses = ["All orders", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
	const filteredOrders = orders.filter((order) => {
		const orderNumber = order._id.slice(-6).toLowerCase();
		const matchesSearch = !search || orderNumber.includes(search.toLowerCase()) || order.items.some((item) => item.name?.toLowerCase().includes(search.toLowerCase()));
		return matchesSearch && (statusFilter === "All orders" || order.status === statusFilter);
	});
	const totalSpend = orders.filter((order) => order.status !== "Cancelled").reduce((total, order) => total + Number(order.totalPrice || 0), 0);
	const totalUnits = orders.reduce((total, order) => total + order.items.reduce((units, item) => units + Number(item.quantity || 0), 0), 0);

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="history-modal history-component" onClick={(event) => event.stopPropagation()}>
				<button className="modal-close" onClick={onClose}>×</button>
				<p className="eyebrow">YOUR JOURNEY / ORDERS</p>
				<div className="history-title-row"><div><h2>Purchase history.</h2><p className="history-intro">Every order, right where you left it.</p></div><span className="history-count">{orders.length} orders</span></div>
				<div className="history-stats"><div><span>Total orders</span><strong>{orders.length}</strong></div><div><span>Pieces received</span><strong>{totalUnits}</strong></div><div><span>Total spent</span><strong>{formatPrice(totalSpend)}</strong></div></div>
				<div className="history-tools"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order or piece" aria-label="Search order history" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter orders by status">{statuses.map((status) => <option key={status}>{status}</option>)}</select></div>
				{filteredOrders.length ? <div className="order-list detailed-order-list">{filteredOrders.map((order) => { const isExpanded = expandedOrder === order._id; return <article className={`order-card detailed-order-card ${isExpanded ? "is-expanded" : ""}`} key={order._id}><button className="order-summary" onClick={() => setExpandedOrder(isExpanded ? null : order._id)}><div><strong>#{order._id.slice(-6).toUpperCase()}</strong><p>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} / {order.items.length} line items</p></div><div className="order-summary-right"><strong>{formatPrice(order.totalPrice)}</strong><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span><span className="order-chevron">{isExpanded ? "−" : "+"}</span></div></button>{isExpanded && <div className="order-details"><div className="order-detail-items">{order.items.map((item, index) => <div className="history-item" key={`${order._id}-${item.product || index}`}><img src={item.image || fallbackProductImage} alt={item.name} /><div><strong>{item.name}</strong><p>{item.size || "Standard size"} / Qty {item.quantity}</p></div><span>{formatPrice(Number(item.price) * Number(item.quantity))}</span></div>)}</div><div className="order-detail-footer"><div><span>Delivering to</span><strong>{order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</strong></div><div><span>Payment</span><strong>{order.paymentMethod || "COD"}</strong></div><button className="reorder-button" onClick={() => onReorder(order)}>Add items to bag <span>↗</span></button></div></div>}</article>; })}</div> : <p className="empty-state">No orders match this view.</p>}
				{orders.length === 0 && <p className="empty-state">Your purchase history is empty.</p>}
			</div>
		</div>
	);
}

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
	const [adminOrders, setAdminOrders] = useState([]);
	const [adminLoading, setAdminLoading] = useState(false);
	const [billing, setBilling] = useState(emptyBilling);
	const isAdmin = user?.role === "admin";

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

	const reorder = (order) => {
		setCart((current) => {
			const restoredItems = order.items.map((item) => ({ product: item.product, name: item.name, image: item.image, price: item.price, size: item.size || "M", quantity: item.quantity, stock: item.quantity }));
			return restoredItems.reduce((bag, item) => {
				const existing = bag.find((bagItem) => bagItem.product === item.product);
				return existing ? bag.map((bagItem) => bagItem.product === item.product ? { ...bagItem, quantity: bagItem.quantity + item.quantity } : bagItem) : [...bag, item];
			}, current);
		});
		setHistoryOpen(false);
		setCartOpen(true);
		setNotice("Previous order added to your bag.");
	};

	const loadAdminData = async () => {
		if (!isAdmin || !token) return;
		try {
			setAdminLoading(true);
			const [allOrders, currentProducts] = await Promise.all([getAllOrders(token), getProducts("", false)]);
			setAdminOrders(allOrders);
			setProducts(currentProducts);
		} catch (error) { setNotice(error.message); }
		finally { setAdminLoading(false); }
	};

	useEffect(() => {
		if (isAdmin) loadAdminData();
	}, [isAdmin, token]);

	const handleOrderStatus = async (orderId, status) => {
		try {
			const updatedOrder = await updateOrderStatus(orderId, status, token);
			setAdminOrders((current) => current.map((order) => order._id === updatedOrder._id ? updatedOrder : order));
			setNotice("Order status updated.");
		} catch (error) { setNotice(error.message); }
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
			if (response.user.role === "admin") {
				setAdminOpen(true);
				setTimeout(() => document.querySelector("#admin-dashboard")?.scrollIntoView({ behavior: "smooth" }), 100);
			}
			setAuthForm({ name: "", email: "", password: "" });
			setNotice(`Welcome to the atelier, ${response.user.name}.`);
		} catch (error) { setNotice(error.message); }
	};

	const handleProductSubmit = async (event) => {
		event.preventDefault();
		try {
			const body = { ...productForm, name: productForm.name.trim(), description: productForm.description.trim(), price: Number(productForm.price), stock: Number(productForm.stock) };
			if (!body.name || !body.description || !body.image || !Number.isFinite(body.price) || body.price <= 0 || !Number.isInteger(body.stock) || body.stock < 0) {
				throw new Error("Enter a name, description, image, positive price, and valid stock count.");
			}
			const savedProduct = editingId ? await updateProduct(editingId, body, token) : await createProduct(body, token);
			setProducts((current) => editingId ? current.map((product) => product._id === savedProduct._id ? savedProduct : product) : [savedProduct, ...current]);
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
		setToken(null); setUser(null); setCart(readCart(null)); setAdminOpen(false); setAdminOrders([]); setNotice("You have been signed out.");
	};

	const orderMetrics = {
		placements: adminOrders.length,
		active: adminOrders.filter((order) => !["Delivered", "Cancelled"].includes(order.status)).length,
		revenue: adminOrders.filter((order) => order.status !== "Cancelled").reduce((total, order) => total + Number(order.totalPrice || 0), 0),
		units: adminOrders.reduce((total, order) => total + order.items.reduce((itemTotal, item) => itemTotal + Number(item.quantity || 0), 0), 0)
	};
	const lowStockProducts = products.filter((product) => Number(product.stock) <= 5);

	return (
		<div className="app-shell">
			<div className="announcement">Complimentary shipping on orders over Rs. 4,000 <span>↗</span></div>
			<header className="site-header">
				<a className="wordmark" href="#top">REDSHADDEL<span>®</span></a>
				<nav><a href="#collection">Collection</a><a href="#journal">Journal</a><a href="#about">About</a></nav>
				<div className="header-actions">
					<button className="icon-button" aria-label="Search" onClick={() => document.querySelector(".search-input")?.focus()}>⌕</button>
					{user ? <><button className="account-button" onClick={openHistory}>Orders</button>{isAdmin && <button className="account-button admin-nav-button" onClick={() => { setAdminOpen(true); loadAdminData(); document.querySelector("#admin-dashboard")?.scrollIntoView({ behavior: "smooth" }); }}>Admin</button>}<button className="account-button" onClick={logout}>{user.name.split(" ")[0]} · Sign out</button></> : <button className="account-button" onClick={() => setAuthMode("login")}>Account</button>}
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
					{loading ? <p className="empty-state">Loading the collection...</p> : visibleProducts.length ? <div className="product-grid">{visibleProducts.map((product, index) => <article className="product-card" key={product._id}><div className="product-image"><img src={product.image} alt={product.name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackProductImage; }} /><span className="product-index">0{index + 1}</span>{product.featured && <span className="featured-label">Featured</span>}</div><div className="product-meta"><div><h3>{product.name}</h3><p>{product.category} / {product.colors?.[0] || "Black"}</p></div><strong>{formatPrice(product.price)}</strong></div><button className="add-button" onClick={() => addToCart(product)}>Add to bag <span>+</span></button>{isAdmin && <div className="admin-actions"><button onClick={() => startEdit(product)}>Edit</button><button onClick={() => removeProduct(product._id)}>Delete</button></div>}</article>)}</div> : <p className="empty-state">No pieces found. Add the first one from the studio.</p>}
				</section>

				<section className="journal-section" id="journal"><div className="journal-image"><img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80" alt="Redshaddel editorial styling" /></div><div className="journal-copy"><p className="eyebrow">FIELD NOTES / 001</p><h2>The shape of<br /><em>staying curious.</em></h2><p>We are interested in clothes that keep their secrets until you wear them in. A pocket in the right place. A line that only appears in motion.</p><a className="text-link" href="#about">Read the note <span>↗</span></a></div></section>

				{user?.role === "admin" && <section className="admin-section" id="admin-dashboard"><div className="section-heading"><div><p className="eyebrow">ADMIN / OPERATIONS</p><h2>Orders & stock.</h2></div><button className="close-studio" onClick={loadAdminData}>{adminLoading ? "Refreshing..." : "Refresh data"}</button></div><div className="admin-metrics"><div><span>Order placements</span><strong>{orderMetrics.placements}</strong></div><div><span>Active orders</span><strong>{orderMetrics.active}</strong></div><div><span>Gross revenue</span><strong>{formatPrice(orderMetrics.revenue)}</strong></div><div><span>Units ordered</span><strong>{orderMetrics.units}</strong></div></div><div className="admin-columns"><div><div className="admin-subheading"><p className="eyebrow">ORDER QUEUE</p><span>{adminOrders.length} total</span></div>{adminLoading ? <p className="empty-state">Loading order activity...</p> : adminOrders.length ? <div className="admin-order-list">{adminOrders.map((order) => <div className="admin-order-row" key={order._id}><div><strong>#{order._id.slice(-6).toUpperCase()}</strong><p>{order.user?.name || "Customer"} / {order.items.length} pieces / {new Date(order.createdAt).toLocaleDateString("en-IN")}</p></div><div><strong>{formatPrice(order.totalPrice)}</strong><select value={order.status} onChange={(event) => handleOrderStatus(order._id, event.target.value)} aria-label={`Update order ${order._id} status`}>{["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"].map((status) => <option key={status}>{status}</option>)}</select></div></div>)}</div> : <p className="empty-state">No orders have been placed yet.</p>}</div><div><div className="admin-subheading"><p className="eyebrow">STOCK WATCH</p><span>{lowStockProducts.length} need attention</span></div><div className="stock-list">{products.map((product) => <div className="stock-row" key={product._id}><div><strong>{product.name}</strong><p>{product.category}</p></div><span className={Number(product.stock) <= 5 ? "stock-low" : ""}>{product.stock} left</span></div>)}</div></div></div></section>}

				{user?.role === "admin" && <section className="studio-section" id="studio"><div className="section-heading"><div><p className="eyebrow">PRIVATE STUDIO</p><h2>{editingId ? "Refine a piece" : "Add to the edit"}</h2></div><button className="close-studio" onClick={() => { setAdminOpen(!adminOpen); setEditingId(null); setProductForm(emptyForm); }}>{adminOpen ? "Close studio" : "Open studio"}</button></div>{adminOpen && <form className="product-form" onSubmit={handleProductSubmit}>{["name", "description", "price", "image", "stock"].map((field) => <label key={field}>{field}<input required value={productForm[field]} onChange={(event) => setProductForm({ ...productForm, [field]: event.target.value })} placeholder={field === "image" ? "Image URL" : field === "price" ? "Price in INR" : field === "stock" ? "Stock count" : field === "description" ? "A short description" : "Piece name"} /></label>)}<label>category<select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="checkbox-label"><input type="checkbox" checked={productForm.featured} onChange={(event) => setProductForm({ ...productForm, featured: event.target.checked })} /> Featured piece</label><button className="submit-button" type="submit">{editingId ? "Save changes" : "Create piece"} <span>↗</span></button></form>}</section>}
			</main>

			<footer><a className="wordmark" href="#top">REDSHADDEL<span>®</span></a><p>Made for the wonderfully unfinished.</p><div><a href="#collection">Shop</a><a href="#journal">Journal</a><a href="mailto:hello@redshaddel.com">Contact</a></div></footer>

			{cartOpen && <div className="drawer-backdrop" onClick={() => setCartOpen(false)}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-heading"><div><p className="eyebrow">YOUR SELECTION</p><h2>Bag / {cart.length}</h2></div><button onClick={() => setCartOpen(false)}>×</button></div>{cart.length ? <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.product}><img src={item.image} alt={item.name} /><div><h3>{item.name}</h3><p>{formatPrice(item.price)} / {item.size}</p><div className="quantity"><button onClick={() => changeQuantity(item.product, -1)}>-</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.product, 1)}>+</button><button className="remove-item" onClick={() => removeFromCart(item.product)}>Remove</button></div></div></div>)}</div><div className="cart-summary"><p><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></p><p><span>Shipping</span><strong>{shipping ? formatPrice(shipping) : "Complimentary"}</strong></p><p><span>GST</span><strong>{formatPrice(tax)}</strong></p><p className="total-line"><span>Total</span><strong>{formatPrice(grandTotal)}</strong></p><button className="submit-button" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Proceed to billing <span>↗</span></button></div></> : <p className="empty-state">Your bag is waiting for a first layer.</p>}</aside></div>}

			{checkoutOpen && <div className="modal-backdrop" onClick={() => setCheckoutOpen(false)}><div className="checkout-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setCheckoutOpen(false)}>×</button><p className="eyebrow">CHECKOUT / BILLING</p><h2>Where should we send it?</h2><p className="checkout-total">Pay on delivery · {formatPrice(grandTotal)}</p><form className="billing-form" onSubmit={handleCheckout}>{[["address", "Address"], ["city", "City"], ["state", "State"], ["postalCode", "Postal code"], ["country", "Country"]].map(([field, label]) => <label key={field}>{label}<input required value={billing[field]} onChange={(event) => setBilling({ ...billing, [field]: event.target.value })} /></label>)}<button className="submit-button" type="submit">Place order <span>↗</span></button></form></div></div>}

			{historyOpen && <OrderHistory orders={orders} onClose={() => setHistoryOpen(false)} onReorder={reorder} />}

			{authMode && <div className="modal-backdrop" onClick={() => setAuthMode(null)}><div className="auth-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAuthMode(null)}>×</button><p className="eyebrow">REDSHADDEL / {authMode === "login" ? "WELCOME BACK" : "JOIN THE EDIT"}</p><h2>{authMode === "login" ? "Enter the studio." : "Make an account."}</h2><form onSubmit={handleAuth}>{authMode === "register" && <input required placeholder="Name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} />}<input required type="email" placeholder="Email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /><input required minLength="6" type="password" placeholder="Password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /><button className="submit-button" type="submit">{authMode === "login" ? "Sign in" : "Create account"} <span>↗</span></button></form><button className="switch-auth" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button></div></div>}
		</div>
	);
}

export default App;
