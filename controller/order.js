import { Order } from "../models/order.js";
import { OrderItem } from "../models/orderItem.js";
import { Cart } from "../models/cart.js";
import { CartItem } from "../models/cartItem.js";

const orderController = {
  createOrder: async (req, res) => {
    try {
      // Get user from req.user
      const user = req.user._id;
  
      // Destructure shipping address and payment details from req.body
      const { shippingAddress, paymentDetails } = req.body;
      const { firstName, lastName, country, address, city, state, zipcode, mobile, email } = shippingAddress;
  
      // Find the user's cart
      const cart = await Cart.findOne({ user }).populate({
        path: 'items',
        populate: {
          path: 'product',
          model: 'Product'
        }
      });
  
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }
  
      // Create order items from cart items
      const orderItemIds = await Promise.all(
        cart.items.map(async (cartItem) => {
          const { product, quantity, size } = cartItem;
          const price = product.discountedPrice * quantity; 
          const name = product.title; 
          const orderItem = new OrderItem({ product, name, quantity, size, price });
          await orderItem.save();
          return orderItem._id;
        })
      );
  
      // Create new order with destructured shipping address fields
      const newOrder = new Order({
        user,
        orderItems: orderItemIds,
        shippingAddress: {
          firstName,
          lastName,
          country,
          address,
          city,
          state,
          zipcode,
          mobile,
          email
        },
        paymentDetails,
        totalPrice: cart.totalPrice,
        totalDiscount: cart.totalDiscount,
        totalItems: cart.totalItems,
      });
  
      // Save order to database
      await newOrder.save();
  
      // Clear the user's cart
      const cartItemIds = cart.items.map(item => item._id);
      cart.items = [];
      cart.totalPrice = 0;
      cart.totalDiscount = 0;
      cart.totalItems = 0;
      await cart.save();
  
      // Delete the cart items from the CartItem collection
      await CartItem.deleteMany({ _id: { $in: cartItemIds } });
  
      // Send response
      res.status(201).json({ success: true, order: newOrder });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to create order" });
    }
  },
  
  getUserOrders: async (req, res) => {
    try {
      const userId = req.user.id; // Assuming you have user authentication and the user ID is available in req.user
      const orders = await Order.find({ user: userId })
      .populate({
        path: 'orderItems',
        populate: {
          path: 'product',
          select: 'title imageUrl', 
        },
      });

      if (!orders) {
        return res.status(404).json({ error: 'Orders not found' });
      }

      res.status(200).json(orders); // Return user's orders
    } catch (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },
};

export default orderController;
