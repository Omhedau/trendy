import express from 'express';
import Stripe from 'stripe';
import { OrderItem } from '../models/orderItem.js';
import { authenticate } from "../middlewares/authenticate.js";
import { Cart } from '../models/cart.js';

const stripe = new Stripe(process.env.SECRET_STRIPE_KEY); 
const router = express.Router();
const endpointSecret = process.env.WEBHOOK_SECRET;

// Route to create the payment intent
router.post('/create-payment-intent', authenticate, async (req, res) => {
  console.log('reaching the payment backend intent.....');
  
  const { cart, shippingAddress } = req.body;
  const user = req.user._id.toString(); // Convert user ID to string

  try {
    // Create the Stripe checkout session with the cart and shipping data
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cart.items.map(item => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.product.title,
          },
          unit_amount: item.product.discountedPrice * 100, 
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/order/success`,
      cancel_url: `${process.env.FRONTEND_URL}/order/fail`,
      // Pass userId and shipping address in metadata
      metadata: {
        user: user, // Ensure user ID is a string
        shippingAddress: JSON.stringify(shippingAddress) // Shipping address passed as metadata
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating payment session', error);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
});

// Webhook to handle the Stripe session completion
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // Verify that the event is from Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Retrieve metadata (user ID and shipping address from frontend)
    const user = session.metadata.user;
    const shippingAddress = JSON.parse(session.metadata.shippingAddress); // Parse the shipping address from metadata

    const paymentDetails = {
      paymentMethod: 'card', // Payment method (assumed 'card' for this case)
      transactionId: session.payment_intent, // Stripe's transaction ID for the payment
      paymentStatus: 'PAID', // Payment status (e.g., 'PAID')
      paidAt: new Date(session.created * 1000), // Convert timestamp to Date
    };

    try {
      // Find the user's cart
      const cart = await Cart.findOne({ user: user }).populate({
        path: 'items',
        populate: {
          path: 'product',
          model: 'Product'
        }
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
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

      // Create new order with the shipping address from the frontend and payment details
      const newOrder = new Order({
        user: mongoose.Types.ObjectId(user),
        orderItems: orderItemIds,
        shippingAddress, // Use the shipping address provided by the frontend
        paymentDetails,  // Payment details
        totalPrice: cart.totalPrice,
        totalDiscount: cart.totalDiscount,
        totalItems: cart.totalItems,
      });

      // Save the order to the database
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
      return res.status(201).json({ success: true, order: newOrder });
    } catch (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({ success: false, message: 'Failed to create order' });
    }
  }

  // Return 200 status for all webhook events
  res.status(200).send();
});

export default router;
