import mongoose from "mongoose";
const { Schema } = mongoose;

const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderItems: [{
    type: Schema.Types.ObjectId,
    ref: "OrderItem",
    required: true
  }],
  deliveryDate: {
    type: Date,
  },
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipcode: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true }
  },
  paymentDetails: {
    paymentMethod: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
    },
    paymentStatus: {
      type: String,
      default: "PENDING"
    },
    paidAt: {
      type: Date,
    }
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  totalDiscount: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  orderStatus: {
    type: String,
    required: true,
    default: "PENDING"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Order = mongoose.model("Order", orderSchema);

export { Order };
