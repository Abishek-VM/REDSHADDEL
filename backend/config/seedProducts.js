const Product = require("../models/Product");

const starterProducts = [
  {
    name: "The Transit Jacket",
    description: "A soft-structured everyday layer with a generous cut.",
    price: 4890,
    category: "Outerwear",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80",
    stock: 18,
    featured: true,
    colors: ["Ink"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Axis Cotton Shirt",
    description: "A crisp cotton shirt with an intentionally relaxed shoulder.",
    price: 2690,
    category: "Tops",
    image: "https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=900&q=80",
    stock: 24,
    featured: true,
    colors: ["Cloud"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Quiet Taper Trouser",
    description: "A fluid trouser made to move through the whole day.",
    price: 3290,
    category: "Bottoms",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80",
    stock: 15,
    colors: ["Stone"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Signal Cap",
    description: "A low-profile cotton cap with a considered finish.",
    price: 990,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80",
    stock: 32,
    colors: ["Black"],
    sizes: ["One size"]
  },
  {
    name: "Second Skin Tee",
    description: "Heavyweight jersey, clean neckline, no unnecessary noise.",
    price: 1490,
    category: "Tops",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    stock: 30,
    colors: ["Off-white"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "After Hours Coat",
    description: "A longline coat for the last train home and everything after.",
    price: 6990,
    category: "Outerwear",
    image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=900&q=80",
    stock: 8,
    featured: true,
    colors: ["Charcoal"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Redline Coat Suit",
    description: "A confident red wool-blend suit for nights that need a sharper silhouette.",
    price: 8490,
    category: "Outerwear",
    image: "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=900&q=80",
    stock: 10,
    featured: true,
    colors: ["Red"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Studio Overshirt",
    description: "A workwear-inspired overshirt with a clean, easy fit.",
    price: 2990,
    category: "Outerwear",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80",
    stock: 16,
    colors: ["Olive"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Wide Leg Uniform",
    description: "A full-length wide-leg trouser with a soft structured drape.",
    price: 3590,
    category: "Bottoms",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80",
    stock: 14,
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Archive Knit",
    description: "A textural knit made for quiet layering.",
    price: 3190,
    category: "Tops",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80",
    stock: 20,
    colors: ["Rust"],
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Object Tote",
    description: "A roomy cotton canvas tote for the things you carry daily.",
    price: 1290,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80",
    stock: 28,
    colors: ["Natural"],
    sizes: ["One size"]
  },
  {
    name: "Night Shift Tee",
    description: "A heavyweight tee with a boxy cut and soft hand feel.",
    price: 1690,
    category: "Tops",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=80",
    stock: 25,
    colors: ["Charcoal"],
    sizes: ["S", "M", "L", "XL"]
  }
];

const seedProducts = async () => {
  let added = 0;
  let repaired = 0;
  for (const product of starterProducts) {
    const existing = await Product.findOne({ name: product.name });
    if (!existing) {
      await Product.create(product);
      added += 1;
    } else if (existing.image !== product.image && ["Wide Leg Uniform", "Night Shift Tee"].includes(product.name)) {
      await Product.updateOne({ _id: existing._id }, { $set: { image: product.image } });
      repaired += 1;
    }
  }

  if (added > 0) {
    console.log(`${added} REDSHADDEL catalog products added`);
  }
  if (repaired > 0) {
    console.log(`${repaired} REDSHADDEL product images repaired`);
  }
};

module.exports = seedProducts;
