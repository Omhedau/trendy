import express from 'express';
import cartController from '../controller/cart.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();

router.get("/", authenticate, cartController.getUserCart);
router.post('/', authenticate, cartController.addItemToCart);
router.put("/", authenticate, cartController.updateCartItem);
router.delete("/:cartItemId", authenticate, cartController.deleteCartItem);

export default router;
