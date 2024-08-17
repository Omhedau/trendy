// product.model.js

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    discountedPrice: {
        type: Number,
        required: true,
    },
    brand: {
        type: String,
    },
    color: {
        type: String,
    },
    sizes: [{
        name: { type: String },
        quantity: { type: Number },
    }],
    imageUrl: [{
        url: { type: String }, 
        public_id: { type: String }, 
    }],
    ratings: {
        type: Number,
        default: 0,
      },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review', 
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', 
    },
    gender: {
        type: String,
        enum: ['Men', 'Women', 'Boy', 'Girl'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Product = mongoose.model('Product', productSchema);

export { Product };
