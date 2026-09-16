const Order = require("../models/Order");

exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      totalPrice,
      paymentMethod
    } = req.body;

    if (!items?.length || !shippingAddress?.address || !shippingAddress?.city || !shippingAddress?.postalCode) {
      return res.status(400).json({
        message: "Order items and complete shipping details are required"
      });
    }

    if (!Number.isFinite(Number(totalPrice)) || Number(totalPrice) <= 0) {
      return res.status(400).json({
        message: "A valid order total is required"
      });
    }

    const order = await Order.create({
      user: req.user.id,
      items,
      shippingAddress,
      totalPrice,
      paymentMethod
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id
    })
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status
      },
      {
        new: true
      }
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};