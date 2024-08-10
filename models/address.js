import mongoose from "mongoose";
const Schema = mongoose.Schema;

const addressSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  country: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipcode: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const Address = mongoose.model('Address', addressSchema);

export {Address};
