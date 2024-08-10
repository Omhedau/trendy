import { connectDb } from './config/db.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import productRouter from './routes/product.js';
import userRouter from './routes/user.js';
import cartRouter from './routes/cart.js';
import orderRouter from './routes/order.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Resolve __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use product routes
app.use('/product', productRouter);
app.use('/user', userRouter);
app.use('/cart', cartRouter);
app.use('/order', orderRouter);

app.listen(process.env.PORT, async () => {
  await connectDb();
  console.log("listening on the port ", process.env.PORT);
});
