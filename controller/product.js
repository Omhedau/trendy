import { Product } from "../models/product.js";
import Category from "../models/category.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { Review } from "../models/review.js";

const productController = {
  getAllProducts: async (req, res) => {
    try {
      const { gender, toplevelCat, category } = req.params;
      const {
        minPrice,
        maxPrice,
        brands,
        sizes,
        colors,
        sort,
        page = 1,
        limit = 9,
      } = req.query;

      console.log(
        `Fetching products for gender: ${gender}, toplevelCat: ${toplevelCat}, category: ${category}...`
      );

      const topCategory = await Category.findOne({
        name: toplevelCat,
        parentCategory: null,
      });

      if (!topCategory) {
        return res
          .status(404)
          .json({ message: "Top-level category not found" });
      }

      const subCategory = await Category.findOne({
        name: category,
        parentCategory: topCategory._id,
      });

      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      console.log("reaching up here....");
      // Build the query
      const query = { gender, category: subCategory._id };

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      if (brands) {
        query.brand = { $in: brands.split(",") };
      }

      if (sizes) {
        query["sizes.name"] = { $in: sizes.split(",") };
      }

      if (colors) {
        query.color = { $in: colors.split(",") };
      }

      // Sorting
      const sortOptions = {};
      if (sort === "Low To High") {
        sortOptions.price = 1;
      } else if (sort === "High To Low") {
        sortOptions.price = -1;
      } else if (sort === "Newest") {
        sortOptions.createdAt = -1;
      } else if (sort === "High Rated") {
        sortOptions.rating = -1;
      }

      // Pagination
      const pageNumber = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 9;
      const skip = (pageNumber - 1) * pageSize;

      const products = await Product.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize);

      const totalProducts = await Product.countDocuments(query);

      console.log("Products fetched:", products);
      res.status(200).json({
        products,
        totalProducts,
        totalPages: Math.ceil(totalProducts / pageSize),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error("Error retrieving products:", error);
      res.status(500).json({ message: "Error retrieving products", error });
    }
  },

  addProduct: async (req, res) => {
    try {
      const {
        title,
        description,
        price,
        discountedPrice,
        brand,
        color,
        sizes,
        ratings,
        reviews,
        categoryName,
        subcategoryName,
        gender,
      } = req.body;

      let category = await Category.findOne({ name: categoryName });

      if (!category) {
        category = new Category({ name: categoryName });
        await category.save();
      }

      let subcategory;
      if (subcategoryName) {
        subcategory = await Category.findOne({
          name: subcategoryName,
          parentCategory: category._id,
        });

        if (!subcategory) {
          subcategory = new Category({
            name: subcategoryName,
            parentCategory: category._id,
          });
          await subcategory.save();
        }
      }

      // Upload images to Cloudinary
      const imageUrlPromises = req.files.map(async (file) => {
        const result = await cloudinary.v2.uploader.upload(file.path);
        return {
          url: result.secure_url,
          public_id: result.public_id,
        };
      });
      const imageUrls = await Promise.all(imageUrlPromises);

      // Create a new product with the provided data and imageUrls
      const product = new Product({
        title,
        description,
        price,
        discountedPrice,
        brand,
        color,
        sizes: sizes ? JSON.parse(sizes) : [],
        imageUrl: imageUrls,
        ratings: ratings ? parseFloat(ratings) : 0,
        reviews: reviews ? JSON.parse(reviews) : [],
        category: subcategory ? subcategory._id : category._id,
        gender,
      });

      await product.save();

      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Error creating product", error });
    }
  },

  getProductById: async (req, res) => {
    try {
      console.log("Product get by id");
      const productId = req.params.id;
      const product = await Product.findById(productId)
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          model: "User",
        },
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      console.log("Product by id->", product);

      return res.status(200).json(product);
    } catch (error) {
      console.error("Error retrieving product by ID:", error);
      return res
        .status(500)
        .json({ message: "Error retrieving product", error });
    }
  },

  getNewProducts: async (req, res) => {
    try {
      console.log("hyabefbsgngb...........");
      const AllProducts = await Product.find().sort({ createdAt: -1 }).limit(8);
      const MenProducts = await Product.find({ gender: 'Men' }).sort({ createdAt: -1 }).limit(4);
      const WomenProducts = await Product.find({ gender: 'Women' }).sort({ createdAt: -1 }).limit(4);
      const KidProducts = await Product.find({ gender: { $in: ['Boy', 'Girl'] } }).sort({ createdAt: -1 }).limit(4);
      console.log("om time out here......");
      const newProducts = {
        'All': AllProducts,
        'Mens': MenProducts,
        'Womens': WomenProducts,
        'Kids': KidProducts,
      };

      res.status(200).json({ newProducts });
    } catch (error) {
      console.error("Error retrieving new products:", error);
      res.status(500).json({ message: "Error retrieving new products", error });
    }
  },

  addReview: async (req, res) => {
    try {

      console.log("reaching up here..");

      const id = req.params.id;
      const { rating, comment } = req.body;
      const user = req.user._id;
  
      // Validate input
      if (!user || !rating || !comment || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Invalid review data" });
      }
  
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      // Create a new review
      const review = new Review({
        user,
        rating,
        comment,
        product: id,
      });
  
      await review.save();
  
      // Find the product and add the review to its reviews array
      product.reviews.push(review._id);
  
      // Update the product's average rating
      const reviews = await Review.find({ product: id });
      const totalRatings = reviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = totalRatings / reviews.length;
  
      product.ratings = averageRating;
      await product.save();
  
      // Populate the reviews
      const updatedProduct = await Product.findById(id)
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          model: "User",
        },
      });
  
      
      res.status(201).json({
        message: "Review added successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error adding review:", error);
      res.status(500).json({ message: "Error adding review", error });
    }
  },

  updateReview: async (req, res) => {
    try {
      const reviewId = req.params.id;
      const { rating, comment } = req.body;
  
      // Validate input
      if (!rating || !comment || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Invalid review data" });
      }
  
      // Find and update the review
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
  
      // Ensure the user updating the review is the original author
      if (review.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to update this review" });
      }
  
      review.rating = rating;
      review.comment = comment;
      await review.save();
  
      // Update the product's average rating
      const product = await Product.findById(review.product);
      const reviews = await Review.find({ product: review.product });
      const totalRatings = reviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = totalRatings / reviews.length;
  
      product.ratings = averageRating;
      await product.save();
  
      // Populate the reviews
      const updatedProduct = await Product.findById(review.product)
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          model: "User",
        },
      });
  
      res.status(200).json({
        message: "Review updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Error updating review", error });
    }
  },
  
  deleteReview: async (req, res) => {
    try {
      const reviewId = req.params.id;
    
      // Find the review by ID
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
    
      // Ensure the user deleting the review is the original author
      if (review.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to delete this review" });
      }
    
      // Remove the review from the product's reviews array
      const product = await Product.findById(review.product);
      product.reviews = product.reviews.filter((id) => id.toString() !== reviewId);
    
      // Remove review from the database
      await Review.deleteOne({ _id: reviewId });
    
      // Update the product's average rating
      const reviews = await Review.find({ product: review.product });
      const totalRatings = reviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = reviews.length ? (totalRatings / reviews.length) : 0;
    
      product.ratings = averageRating;
      await product.save();
    
      // Populate the reviews
      const updatedProduct = await Product.findById(review.product)
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          model: "User",
        },
      });
    
      res.status(200).json({
        message: "Review deleted successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Error deleting review", error });
    }
  },
  
};

export default productController;
