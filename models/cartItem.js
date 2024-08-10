import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  });
  
  const CartItem = mongoose.model('CartItem', CartItemSchema);

  export {CartItem};