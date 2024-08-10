import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensures each email is unique
    },
    avatar: {
        url: { type: String }, 
        public_id: { type: String }, 
    },
    role: {
        type: String,
        required: true,
        default: "CUSTOMER", // Default role is CUSTOMER
    },
    mobile: {
        type: String,
    },
    address: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address" 
    }],
    createdAt: {
        type: Date,
        default: Date.now(), // Default value is the current timestamp
    }
});

const User = mongoose.model("User", userSchema);

export { User };
