import express from 'express';
import userController from "../controller/user.js";
import {authenticate} from "../middlewares/authenticate.js"
const router = express.Router();

router.post("/signup",userController.createUser);
router.post("/signin",userController.loginUser);
router.get("/profile",userController.getUser);
router.get('/addresses',authenticate,userController.getAllAddresses);
router.post('/address',authenticate,userController.createAddress);
router.delete('/address/:addressId',authenticate,userController.removeAddress);
router.get("/test",userController.testingVercel);


export default router;