import { User } from "../models/user.js";
import { Cart } from "../models/cart.js";
import { Address } from "../models/address.js";
import bcrypt from "bcrypt";
import jwtProvider from "../config/jwtProvider.js";

const userController = {
  createUser: async (req, res) => {
    try {
      let { firstName, lastName, email, password } = req.body;
  
      // Check if user with the same email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
  
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user instance
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
      });
  
      // Save the new user to the database
      await newUser.save();
  
      // Log the newUser._id to ensure it's generated
      console.log("New User ID:", newUser._id);
  
      // Create a new cart for the user
      const newCart = new Cart({ user: newUser._id });
      await newCart.save();
  
      console.log("Cart created successfully for user:", newUser._id);
  
      // Generate JWT token
      const jwt = jwtProvider.generateToken(newUser._id);
  
      // Return success response with JWT and user info
      res.status(201).json({ message: "User created successfully", jwt, user: newUser });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  },
  
  loginUser: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check if user with the provided email exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare provided password with the stored hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const jwt = jwtProvider.generateToken(user._id);

      // Return success response with JWT and user info
      console.log("login success--->>>");
      res.status(200).json({ message: "Login successful", jwt, user });
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).json({ message: "Failed to log in user" });
    }
  },

  getUser: async (req, res) => {
    try {
      console.log(req.headers);
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).send({ error: "Authorization header not found" });
      }
  
      const jwt = authHeader.split(" ")[1];
  
      if (!jwt) {
        return res.status(401).send({ error: "Token not found" });
      }

  
      const userId = await jwtProvider.getUserIdFromToken(jwt);
      const user = await User.findById(userId);
      // .populate("address");

     // console.log(user);
  
      if (!user) {
        return res.status(404).send({ error: `User not found with id: ${userId}` });
      }
      console.log("exexcuteed succcck");
      return res.status(200).json({ user });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to get user" });
    }
  },

  getUserById: async (userId) => {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error(`User not found with id: ${userId}`);
      }

      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  },

  getAllAddresses: async (req, res) => {
    try {
      
      const userId = req.user._id; 
  
      const addresses = await Address.find({ user: userId });
      console.log("getting all addresses",addresses);
      res.json({
        success: true,
        addresses,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message,
      });
    }
  },

  createAddress: async (req, res) => {
    try {
      const userId = req.user._id; 
  
      const {
        firstName,
        lastName,
        country,
        address,
        city,
        state,
        zipcode,
        mobile,
        email,
      } = req.body;
  
      const newAddress = new Address({
        firstName,
        lastName,
        country,
        address,
        city,
        state,
        zipcode,
        mobile,
        email,
        user: userId,
      });
  
      const savedAddress = await newAddress.save();
  
      // Update the user's address list
      await User.findByIdAndUpdate(userId, {
        $push: { address: savedAddress._id },
      });
  
      res.status(201).json({
        success: true,
        address: savedAddress,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message,
      });
    }
  },

  removeAddress: async (req, res) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.addressId;

      // Remove the address from the Address collection
      const deletedAddress = await Address.findByIdAndDelete(addressId);
      if (!deletedAddress) {
        return res.status(404).json({ message: "Address not found" });
      }

      // Remove the reference of the address from the user's address array
      await User.findByIdAndUpdate(userId, {
        $pull: { address: addressId },
      });

      res.status(200).json({ message: "Address removed successfully" });
    } catch (error) {
      console.error("Error removing address:", error);
      res.status(500).json({ message: "Failed to remove address" });
    }
  },

  testingVercel : async(req, res) =>{
    try {
      console.log("here i am trying to get the om .... mongodb.....");
      // const user = await User.findOne({});
      res.status(200).json({ message: "backen works fine ....." });
    } catch (error) {
      res.state(500).json({error});
    }
  }

};


export default userController;
