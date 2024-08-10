import { Cart } from "../models/cart.js";
import { CartItem } from "../models/cartItem.js";

// Helper functions to calculate cart totals
const calculateTotalPrice = (cart) => {
  return cart.items.reduce((total, item) => {
    const price = item.product?.discountedPrice || 0;
    return total + item.quantity * price;
  }, 0);
};

const calculateTotalItems = (cart) => {
  return cart.items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
};

const calculateTotalDiscount = (cart) => {
  return cart.items.reduce((total, item) => {
    const price = item.product?.price || 0;
    const discountedPrice = item.product?.discountedPrice || 0;
    const discountPerItem = item.quantity * (price - discountedPrice);
    return total + discountPerItem;
  }, 0);
};

const cartController = {
  getUserCart: async (req, res) => {
    const userId = req.user._id;

    try {
      const cart = await Cart.findOne({ user: userId }).populate({
        path: "items",
        populate: {
          path: "product",
          model: "Product",
        },
      });

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      return res.json(cart);
    } catch (error) {
      console.error("Error fetching user cart:", error);
      return res.status(500).json({ message: "Error fetching user cart" });
    }
  },

  addItemToCart: async (req, res) => {
    const userId = req.user._id;
    const { productId, size, quantity } = req.body;

    try {
      let cart = await Cart.findOne({ user: userId }).populate({
        path: "items",
        populate: {
          path: "product",
          model: "Product",
        },
      });

      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
          totalPrice: 0,
          totalItems: 0,
          totalDiscount: 0,
        });
      }

      const existingItem = cart.items.find(
        (item) => item.product._id.toString() === productId && item.size === size
      );

      if (existingItem) {
        return res.status(400).json({ message: "Item already in cart" });
      } else {
        const newItem = new CartItem({ product: productId, size, quantity });
        await newItem.save();
        cart.items.push(newItem);
      }

      await Cart.populate(cart, { path: "items.product" });

      cart.totalPrice = calculateTotalPrice(cart);
      cart.totalItems = calculateTotalItems(cart);
      cart.totalDiscount = calculateTotalDiscount(cart);

      await cart.save();

      return res.status(201).json(cart);
    } catch (error) {
      console.error("Error adding item to cart:", error);
      return res.status(500).json({ message: "Error adding item to cart" });
    }
  },

  updateCartItem: async (req, res) => {
    const { cartItemId, quantity } = req.body;

    try {
      const cartItem = await CartItem.findById(cartItemId);

      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      cartItem.quantity = quantity;
      await cartItem.save();

      const cart = await Cart.findOne({
        items: { $in: [cartItemId] },
      }).populate({
        path: "items",
        populate: {
          path: "product",
          model: "Product",
        },
      });

      if (cart) {
        cart.totalPrice = calculateTotalPrice(cart);
        cart.totalItems = calculateTotalItems(cart);
        cart.totalDiscount = calculateTotalDiscount(cart);
        await cart.save();
      }

      return res.json(cart);
    } catch (error) {
      console.error("Error updating cart item:", error);
      return res.status(500).json({ message: "Error updating cart item" });
    }
  },

  deleteCartItem: async (req, res) => {
    const { cartItemId } = req.params;

    try {
      const cartItem = await CartItem.findById(cartItemId);

      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      const cart = await Cart.findOneAndUpdate(
        { user: req.user._id, items: { $in: [cartItemId] } },
        { $pull: { items: cartItemId } },
        { new: true }
      ).populate({
        path: "items",
        populate: {
          path: "product",
          model: "Product",
        },
      });

      if (cart) {
        cart.totalPrice = calculateTotalPrice(cart);
        cart.totalItems = calculateTotalItems(cart);
        cart.totalDiscount = calculateTotalDiscount(cart);
        await cart.save();
      }

      await CartItem.deleteOne({ _id: cartItemId });

      return res.json(cart);
    } catch (error) {
      console.error("Error deleting cart item:", error);
      return res.status(500).json({ message: "Error deleting cart item" });
    }
  },
};

export default cartController;