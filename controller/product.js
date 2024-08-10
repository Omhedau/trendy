import { Product } from "../models/product.js";
import Category from "../models/category.js";
import cloudinary from "../config/cloudinaryConfig.js";

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
      const product = await Product.findById(productId);
      //.populate('ratings reviews category');

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
};

export default productController;
