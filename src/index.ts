// src/index.ts
import express, { Request, Response, Router } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import User from "./user";
// import upload from "./upload";
import { Uploadfile } from "./upload";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import category from "./danhmuc";
import Cart from "./cart";
import product from "./product";
import Order from "./order";
import material from "./material";
import Tintuc from "./posts";

import crypto from "crypto";
import { createVNPayPaymentUrl, sortObject } from "./service/VNPay";
import qs from "qs";
import Product from "./product";
var cors = require("cors");
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const app = express();
const { uploadPhoto } = require("./middleware/uploadImage.js");
const PORT = process.env.PORT || 28017;
const {
  cloudinaryUploadImg,
  cloudinaryDeleteImg,
} = require("./utils/Cloudinary");
const JWT_SECRET = process.env.JWT_SECRET as string;
const router = Router();
mongoose
  .connect(
    "mongodb+srv://ungductrungtrung:Jerry2912@cluster0.4or3syc.mongodb.net/",
    {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
    }
  )
  .then(() => console.log("DB connection successful"))
  .catch((err) => console.log(err));

app.use(cors());
app.use(bodyParser.json());

app.post(
  "/upload",
  uploadPhoto.array("images", 10),
  async (req: any, res: any) => {
    console.log("Files received in backend:", req.files);
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    try {
      const uploader = (path: any) => cloudinaryUploadImg(path);
      const urls = [];
      for (const file of req.files) {
        const { path } = file;
        const newpath = await uploader(path);
        urls.push(newpath);
        fs.unlinkSync(path); // Remove file after upload
      }

      res.status(201).json({
        payload: urls,
        status: 200,
      });
    } catch (error: any) {
      console.error("Upload error:", error.message);
      res.status(500).json({ error: error.message });
    }
  }
);
app.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error getting user information!",
    });
  }
});
app.get("/usersaccount", async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error getting user information!",
    });
  }
});

app.put("/user/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Lỗi khi cập nhật thông tin người dùng",
    });
  }
});

app.put("/:id/cartupdate", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { productId, newQuantity } = req.body;

  if (!productId || newQuantity == null || newQuantity <= 0) {
    return res.status(400).json({ message: "Invalid product ID or quantity" });
  }

  try {
    const cart = await Cart.findOne({ userId: id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const productIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.items[productIndex].quantity = newQuantity;
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/cart/add", async (req: Request, res: Response) => {
  const { userId, items } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId format" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "ko được để trống elements" });
  }
  const { productId, name, price, img, quantity } = items[0];
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid productId format" });
  }
  if (quantity <= 0) {
    return res.status(400).json({ message: "Số lượng phải lớn hơn 0" });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      const productIndex = cart.items.findIndex(
        (p) => p.productId.toString() === productId
      );

      if (productIndex > -1) {
        let productItem = cart.items[productIndex];
        productItem.quantity += quantity;
        cart.items[productIndex] = productItem;
      } else {
        cart.items.push({ productId, name, price, img, quantity });
      }

      cart = await cart.save();
      return res.status(200).json(cart);
    } else {
      const newCart = await Cart.create({
        userId,
        items: [{ productId, name, price, img, quantity }],
      });

      return res.status(201).json(newCart);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding to cart" });
  }
});

app.delete("/cart/remove", async (req: Request, res: Response) => {
  const { userId, productId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId format" });
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid productId format" });
  }

  try {
    let cart = await Cart.findOne({ userId });
    if (cart) {
      const productIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (productIndex > -1) {
        cart.items.splice(productIndex, 1);
        await cart.save();
        return res.status(200).json(cart);
      } else {
        return res.status(404).json({ message: "Product not found in cart" });
      }
    } else {
      return res.status(404).json({ message: "Cart not found" });
    }
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/Cart/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`Fetching cart for userId: ${id}`);
    const giohang = await Cart.findOne({ userId: id }).populate("items");
    console.log(`Cart fetched:`, giohang);

    if (!giohang) {
      return res.status(404).json({ message: "Cart is Empty", isEmpty: true });
    }

    res.json(giohang);
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login
app.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found!",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message: "Account is disabled. Please contact support.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password!" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: process.env.EXPIRES_TOKEN,
    });

    if (user.role === "admin") {
      res.json({
        message: "Welcome Admin!",
        id: user._id,
        info: {
          email: user.email,
          role: user.role,
          name: user.name,
        },
        token: token,
        expiresIn: process.env.EXPIRES_TOKEN,
      });
    } else if (user.role === "shipper") {
      res.json({
        message: "Welcome Shipper!",
        id: user._id,
        info: {
          email: user.email,
          role: user.role,
          name: user.name,
        },
        token: token,
        expiresIn: process.env.EXPIRES_TOKEN,
      });
    } else {
      res.json({
        message: "Welcome User!",
        id: user._id,
        info: {
          email: user.email,
          role: user.role,
          name: user.name,
        },
        token: token,
        expiresIn: process.env.EXPIRES_TOKEN,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in!" });
  }
});

app.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({
      message: "Thêm người dùng thành công",
      user: newUser,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tạo người dùng mới" });
  }
});

app.post("/product/add", async (req: Request, res: Response) => {
  try {
    const { name, price, img, soLuong, moTa, categoryID, materialID, status } =
      req.body;

    const Category = await category.findById(categoryID);
    const Material = await material.findById(materialID);
    if (!Category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    if (!Material) {
      return res.status(404).json({ message: "Không tìm thấy chat lieu" });
    }
    const newProduct = new product({
      name,
      price,
      img,
      soLuong,
      moTa,
      category: categoryID,
      material: materialID,
      status,
    });
    await newProduct.save();
    res.status(201).json({
      message: "Thêm sản phẩm thành công",
      product: newProduct,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi thêm mới" });
  }
});

app.get("/product", async (req: Request, res: Response) => {
  try {
    const products = await product.find().populate("material", "name");

    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin sản phẩm" });
  }
});

app.get("/product-test", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, admin } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      populate: [
        { path: "category", select: "name" },
        { path: "material", select: "name" },
      ],
    };

    // Kiểm tra query parameter 'admin'
    const filter = admin === "true" ? { status: true } : {};

    const products = await product.paginate(filter, options);

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Error retrieving product information",
    });
  }
});

app.get("/product/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Product = await product
      .findById(id)
      .populate("category", "name")
      .populate("material", "name");
    res.json(Product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin sản phẩm" });
  }
});

app.put("/update/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateProduct = await product.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updateProduct);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm" });
  }
});

app.put("/updatecategory/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateCategory = await category.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updateCategory);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi cập nhật Danh mục" });
  }
});

app.delete("/product/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const test = await product.findByIdAndDelete(id);

    res.json({
      message: "Sản phẩm đã được xóa thành công",
      id: id,
      test: test,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "lỗi khi xóa sản phẩm" });
  }
});

// active product
app.put("/product/deactivate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productToUpdate = await product.findByIdAndUpdate(
      id,
      { status: false },
      { new: true }
    );

    if (!productToUpdate) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm để vô hiệu hóa" });
    }

    res.json({
      message: "Sản phẩm đã được vô hiệu hóa",
      product: productToUpdate,
    });
  } catch (error) {
    console.error("Error deactivating product:", error);
    res.status(500).json({ message: "Lỗi khi vô hiệu hóa sản phẩm" });
  }
});

// deactive product
app.put("/product/activate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productToUpdate = await product.findByIdAndUpdate(
      id,
      { status: true },
      { new: true }
    );

    if (!productToUpdate) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm để kích hoạt lại" });
    }

    res.json({
      message: "Sản phẩm đã được kích hoạt lại",
      product: productToUpdate,
    });
  } catch (error) {
    console.error("Error activating product:", error);
    res.status(500).json({ message: "Lỗi khi kích hoạt lại sản phẩm" });
  }
});

//  Categoty : Get
app.get("/category", async (req: Request, res: Response) => {
  try {
    const categories = await category.find();
    res.json(categories);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin danh mục" });
  }
});
app.get("/category/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Category = await category.findById(id);
    res.json(Category);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin danh mục" });
  }
});

//  Categoty : Post
app.post("/addcategory", async (req: Request, res: Response) => {
  try {
    const newCategory = new category(req.body);
    await newCategory.save();
    res.status(201).json({
      massege: "Thêm Category thành công",
      category: newCategory,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi thêm mới danh mục" });
  }
});

//  Categoty : Delete
app.delete("/category/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const del = await category.findByIdAndDelete(id);
    res.json({
      message: "Danh mục đã xoá thành công",
      id: id,
      test: del,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi xóa danh mục" });
  }
});

app.delete("/product/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const del = await product.findByIdAndDelete(id);
    res.json({
      message: "Sp đã xoá thành công",
      id: id,
      test: del,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi xóa SP" });
  }
});
//
// app.put('/categories/:id/deactivate', (req, res) => {
//   const categoryId = req.params.id;
//   res.json({ message: 'Category deactivated' });
// });
// Vô hiệu hóa người dùng
app.put("/user/deactivate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người dùng để vô hiệu hóa" });
    }
    res.json({ message: "Người dùng đã được vô hiệu hóa", user });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ message: "Lỗi khi vô hiệu hóa người dùng" });
  }
});

// Kích hoạt lại người dùng
app.put("/user/activate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { active: true },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng để kích hoạt lại",
      });
    }
    res.json({ message: "Người dùng đã được kích hoạt lại", user });
  } catch (error) {
    console.error("Error activating user:", error);
    res.status(500).json({ message: "Lỗi khi kích hoạt lại người dùng" });
  }
});

// Thêm danh mục
app.post("/addcategory", async (req: Request, res: Response) => {
  try {
    const newCategory = new category({ ...req.body, status: "active" });
    await newCategory.save();
    res.status(201).json({
      message: "Thêm Category thành công",
      category: newCategory,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi thêm mới danh mục" });
  }
});

// Vô hiệu hóa danh mục
app.put("/category/deactivate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Deactivate the category
    const categoryToUpdate = await category.findByIdAndUpdate(
      id,
      { status: "deactive" },
      { new: true }
    );

    if (!categoryToUpdate) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy danh mục để vô hiệu hóa" });
    }

    // Deactivate all products in the category
    const updatedProducts = await product.updateMany(
      { category: id }, // Tìm tất cả sản phẩm có category trùng với id danh mục
      { status: false } // Đặt trạng thái của sản phẩm thành 'false'
    );

    res.json({
      message: "Danh mục và các sản phẩm liên quan đã được vô hiệu hóa",
      category: categoryToUpdate,
    });
  } catch (error) {
    console.error("Error deactivating category:", error);
    res.status(500).json({ message: "Lỗi khi vô hiệu hóa danh mục" });
  }
});

// Kích hoạt lại danh mục
app.put("/category/activate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Activate the category
    const categoryToUpdate = await category.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true }
    );

    if (!categoryToUpdate) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy danh mục để kích hoạt lại" });
    }

    // Activate all products in the category
    const updatedProducts = await product.updateMany(
      { category: id }, // Tìm tất cả sản phẩm có category trùng với id danh mục
      { status: true } // Đặt trạng thái của sản phẩm thành 'true'
    );

    res.json({
      message: "Danh mục và các sản phẩm liên quan đã được kích hoạt lại",
      category: categoryToUpdate,
    });
  } catch (error) {
    console.error("Error activating category:", error);
    res.status(500).json({ message: "Lỗi khi kích hoạt lại danh mục" });
  }
});

// Lấy danh mục
app.get("/category", async (req: Request, res: Response) => {
  try {
    const categories = await category.find({ status: "active" }); // Chỉ lấy danh mục hoạt động
    res.json(categories);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin danh mục" });
  }
});

app.get("/deactive/:id", (req, res) => {
  const itemId = req.params.id;
  // Gọi hàm để deactive item với id là itemId
  res.send(`Deactivating item with ID ${itemId}`);
});

// Materal
app.post("/addmaterial", async (req: Request, res: Response) => {
  try {
    const newMaterial = new material({ ...req.body, status: "active" });
    await newMaterial.save();
    res.status(201).json({
      message: "Thêm Material thành công",
      material: newMaterial,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi thêm mới vật liệu" });
  }
});

// Vô hiệu hóa vật liệu
app.put("/material/deactivate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const materialToUpdate = await material.findByIdAndUpdate(
      id,
      { status: "deactive" },
      { new: true }
    );
    if (!materialToUpdate) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy vật liệu để vô hiệu hóa" });
    }
    res.json({
      message: "Vật liệu đã được vô hiệu hóa",
      material: materialToUpdate,
    });
  } catch (error) {
    console.error("Error deactivating material:", error);
    res.status(500).json({ message: "Lỗi khi vô hiệu hóa vật liệu" });
  }
});

// Kích hoạt lại vật liệu
app.put("/material/activate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const materialToUpdate = await material.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true }
    );
    if (!materialToUpdate) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy vật liệu để kích hoạt lại" });
    }
    res.json({
      message: "Vật liệu đã được kích hoạt lại",
      material: materialToUpdate,
    });
  } catch (error) {
    console.error("Error activating material:", error);
    res.status(500).json({ message: "Lỗi khi kích hoạt lại vật liệu" });
  }
});

// Lấy vật liệu
app.get("/material", async (req: Request, res: Response) => {
  try {
    const materials = await material.find();
    res.json(materials);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin vật liệu" });
  }
});

app.put("/updatematerial/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Lấy ID từ params
    const updateMaterial = await material.findByIdAndUpdate(id, req.body, {
      new: true, // Trả về tài liệu đã được cập nhật
    });
    res.json(updateMaterial); // Gửi lại tài liệu đã cập nhật
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi cập nhật Chất liệu" });
  }
});

app.get("/deactive/:id", (req, res) => {
  const itemId = req.params.id;
  // Gọi hàm để deactive item với id là itemId
  res.send(`Deactivating item with ID ${itemId}`);
});

// tìm kiếm và lọc sản phẩm theo tên sản phẩm và theo danh mục và theo giá
// app.get('/products/search', async (rep, res) => {
//   try {
//     const { name, category, minPrice, maxPrice } = rep.query;
//     let products = await product.find();
//     // Lọc sản phẩm theo tên sản phẩm
//     if (name) {
//       products = products.filter(product => product.name.toLowerCase().includes(name.toLowerCase()));
//     }
//     // Lọc sản phẩm theo danh mục
//     if (category) {
//       products = products.filter(product => product.category === category);
//     }
//     // Lọc sản phẩm theo giá
//     if (minPrice && maxPrice) {
//       products = products.filter(product => product.price >= parseInt(minPrice) && product.price <= parseInt(maxPrice));
//     } res.json(products);

//   }catch(error){
//     res.status(500).json({error:'Lỗi máy chủ nội bộ'});
//   }
// });

app.put("/product/deactivate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productToUpdate = await product.findByIdAndUpdate(
      id,
      { status: false },
      { new: true }
    );

    if (!productToUpdate) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm để vô hiệu hóa" });
    }

    res.json({
      message: "Sản phẩm đã được vô hiệu hóa",
      product: productToUpdate,
    });
  } catch (error) {
    console.error("Error deactivating product:", error);
    res.status(500).json({ message: "Lỗi khi vô hiệu hóa sản phẩm" });
  }
});

app.put("/product/activate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productToUpdate = await product.findByIdAndUpdate(
      id,
      { status: true },
      { new: true }
    );

    if (!productToUpdate) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm để kích hoạt lại" });
    }

    res.json({
      message: "Sản phẩm đã được kích hoạt lại",
      product: productToUpdate,
    });
  } catch (error) {
    console.error("Error activating product:", error);
    res.status(500).json({ message: "Lỗi khi kích hoạt lại sản phẩm" });
  }
});

app.get("/orders", async (req: Request, res: Response) => {
  const { userId } = req.query; // Optional query parameter to filter by userId

  try {
    // Find orders, optionally filter by userId if provided
    const query = userId ? { userId } : {};
    const orders = await Order.find(query)
      .populate("userId", "name email")
      .exec();

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to retrieve orders", error });
  }
});

app.get("/posts", async (req: Request, res: Response) => {
  try {
    const query = await Tintuc.find();

    if (query.length === 0) {
      return res.status(404).json({
        message: "Chưa có bài viết nào!",
      });
    }

    return res.status(200).json(query);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve orders", error });
  }
});
app.get("/post/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Tintuc.findById(id); // Thay 'product' bằng 'Tintuc'

    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    res.json(post);
  } catch (error) {
    console.error("Lỗi khi lấy bài viết:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin tin tức" });
  }
});

app.post("/posts/create", async (req: Request, res: Response) => {
  const { title, content, descriptions, img } = req.body;
  try {
    if (title.length === 0) {
      return res.status(403).json({
        message: "Tiêu đề bài viết không được để trống",
      });
    }

    if (content.length === 0) {
      return res.status(403).json({
        message: "Nội dung bài viết không được để trống",
      });
    }

    // Xử lí ảnh bài viết

    // -------------------

    const newTintuc = await Tintuc.create({
      title,
      content,
      descriptions,
      img,
    });

    if (!newTintuc) {
      return res.status(403).json({
        message: "Thêm bài viết không thành công!",
      });
    }

    return res.status(200).json({
      data: newTintuc,
      message: "Thêm bài viết thành công!",
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve orders", error });
  }
});
app.delete("/posts/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Tìm và xóa bài viết theo ID
    const deletedPost = await Tintuc.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    res.status(200).json({
      message: "Xóa bài viết thành công",
      deletedPost,
    });
  } catch (error) {
    console.error("Lỗi khi xóa bài viết:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});
app.put("/updatePost/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ." });
    }

    // Tiến hành cập nhật
    const updatedPost = await Tintuc.findByIdAndUpdate(
      id,
      req.body, // Dữ liệu cần cập nhật
      { new: true, runValidators: true } // Tùy chọn trả về tài liệu mới và xác thực
    );

    // Kiểm tra nếu không tìm thấy bài viết
    if (!updatedPost) {
      return res.status(404).json({ message: "Không tìm thấy bài viết." });
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Lỗi khi cập nhật bài viết:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật bài viết." });
  }
});

app.get("/orders-list", async (req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("items.productId", "name price img")
      .exec();

    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to retrieve orders", error });
  }
});

app.get("/orders/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const orders = await Order.find({ userId })
      .populate("items.productId", "name price")
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const totalOrders = await Order.countDocuments({ userId });

    res.status(200).json({
      orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / +limit),
      currentPage: +page,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders", error });
  }
});

app.put("/orders-list/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status, paymentstatus } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status === "failed") {
      const updatePromises = order.items.map((item) =>
        Product.findByIdAndUpdate(
          item.productId,
          { $inc: { quantity: item.quantity } },
          { new: true }
        )
      );

      await Promise.all(updatePromises);
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status, paymentstatus },
      { new: true }
    );

    if (updatedOrder) {
      res.status(200).json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found after update" });
    }
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/admin/stats", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();

    const totalOrders = await Order.countDocuments();

    const deliveredOrders = await Order.countDocuments({
      status: "delivered",
    });

    const canceledOrders = await Order.countDocuments({ status: "failed" });

    const statistics = {
      totalProducts,
      totalOrders,
      deliveredOrders,
      canceledOrders,
    };

    res.json(statistics);
  } catch (err) {
    console.error("Error fetching statistics:", err);
    res.status(500).json({
      message: "Failed to fetch statistics. Please try again later.",
    });
  }
});

//vnpay

app.post("/create-payment", async (req: Request, res: Response) => {
  const { userId, amount, paymentMethod, bankCode, customerDetails, Items } =
    req.body;
  console.log("Payload received:", req.body);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.log("Invalid orderId format");
    return res.status(400).json({ message: "Invalid orderId format" });
  }

  try {
    // const order = await Order.create({
    //   userId: req.body.userId,
    //   items: req.body.items,
    //   amount: Number(req.body.amount) / 100,
    //   customerDetails: req.body.customerDetails,
    //   paymentMethod: req.body.paymentMethod,
    // });
    // console.log(order, "order");

    const paymentUrl = createVNPayPaymentUrl({
      Id: userId,
      customerDetails: customerDetails,
      items: Items,
      amount: amount,
      bankCode,
      req,
    });
    console.log("Payment URL generated:", paymentUrl);

    return res.status(200).json({ paymentUrl });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Có lỗi xảy ra, vui lòng thử lại" });
  }
});

const vnp_TmnCode = process.env.VNP_TMNCODE || "6KV33Z7O";
const vnp_HashSecret =
  process.env.VNP_HASHSECRET || "HID072I1H7DJ6HO5O92JMV2WX2HMDQRD";
let vnp_Url: any =
  process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl =
  process.env.VNP_RETURNURL || "http://localhost:3000/success";

app.get("/vnpay_return", function (req, res, next) {
  let vnp_Params = req.query;

  let secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);

  let config = require("config");
  let tmnCode = vnp_TmnCode;
  let secretKey = vnp_TmnCode;

  let querystring = require("qs");
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let crypto = require("crypto");
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
  console.log("tsest vpay", vnp_Params["vnp_ResponseCode"]);

  if (secureHash === signed) {
    res.render("success", { code: vnp_Params["vnp_ResponseCode"] });
  } else {
    res.render("success", { code: "97" });
  }
});

app.post("/order/confirm", async (req: Request, res: Response) => {
  // tien mat
  const { userId, items, amount, paymentMethod, customerDetails } = req.body;

  try {
    if (!userId || !items || !amount || !paymentMethod || !customerDetails) {
      return res.status(400).json({ message: "Missing order data" });
    }

    // Create a new order document
    const order = new Order({
      userId: userId,
      items,
      amount,
      paymentMethod,
      status: "pending",
      createdAt: new Date(),
      customerDetails,
    });

    await order.save();
    await Cart.findOneAndUpdate({ userId }, { items: [] });
    res.status(201).json({
      message: "Order confirmed and cart reset",
      orderId: order._id,
    });
  } catch (error) {
    console.error("Order confirmation error:", error);
    res.status(500).json({ message: "Order confirmation failed", error });
  }
});

app.post("/order/confirmvnpay", async (req: Request, res: Response) => {
  try {
    const {
      userId,
      vnp_Amount,
      vnp_OrderInfo,
      vnp_ResponseCode,
      vnp_TransactionNo,
      paymentMethod,
    } = req.body;

    if (
      !userId ||
      !vnp_Amount ||
      !vnp_ResponseCode ||
      !vnp_TransactionNo ||
      !paymentMethod
    ) {
      return res.status(400).json({ message: "thiếu thông tin" });
    }

    if (vnp_ResponseCode !== "00") {
      return res.status(400).json({ message: "thanh toán thất bại" });
    }

    const cartUpdate = await Cart.findOneAndUpdate({ userId }, { items: [] });
    if (!cartUpdate) {
      return res.status(404).json({ message: "không tìm thấy giỏ hàng" });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { userId, status: "pending" },
      { paymentstatus: "Đã Thanh toán", magiaodich: vnp_TransactionNo },
      { new: true, sort: { createdAt: -1 } }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Đơn hàng ko tồn tại." });
    }

    return res
      .status(201)
      .json({ message: "Đơn hàng đặt thành công.", order: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    return res
      .status(500)
      .json({ message: "Failed to update the order.", error });
  }
});
app.post("/api/orders/:orderId/cancel", async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    order.status = "cancelled"; 
    await order.save();

    res.json(order); 
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error cancelling order"});
  }
});

app.listen(PORT, () => {
  console.log(`Server đang lắng nghe tại cổng ${PORT}`);
});

// Ngân hàng	NCB
// Số thẻ	9704198526191432198
// Tên chủ thẻ	NGUYEN VAN A
// Ngày phát hành	07/15
// Mật khẩu OTP	123456
