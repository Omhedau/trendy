import mongoose from "mongoose";
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true, 
  },
  quantity: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  }
});

const OrderItem = mongoose.model("OrderItem", orderItemSchema);

export { OrderItem };
