import express from 'express';
import productController from '../controller/product.js';
import upload from '../config/mutlerConfig.js';

const router = express.Router();

router.get('/:gender/:toplevelCat/:category', productController.getAllProducts);
router.post('/', upload.array('images'), productController.addProduct); 
router.get('/id/:id', productController.getProductById);
router.get('/new',productController.getNewProducts);

export default router;
