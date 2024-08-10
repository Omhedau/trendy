import express from 'express';
import {authenticate} from "../middlewares/authenticate.js"
import orderController  from '../controller/order.js';

const router = express.Router();

router.post('/',authenticate,orderController.createOrder);
router.get('/user',authenticate,orderController.getUserOrders);

export default router;

