const Product = require("../models/Product");

exports.getProducts = async (req, res) => {
  try {
    const { category, search, featured } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (featured) {
      filter.featured = true;
    }

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i"
      };
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;
    if (!name?.trim() || !description?.trim() || !category?.trim() || !image?.trim() || !Number.isFinite(Number(price)) || Number(price) <= 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
      return res.status(400).json({
        message: "Name, description, category, image, positive price, and valid stock are required"
      });
    }

    const product = await Product.create(req.body);

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({
      message: "Product deleted"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};