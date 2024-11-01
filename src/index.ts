// src/index.ts
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import User from "./user";
import Product from "./product";
// import upload from "./upload";
import { Uploadfile } from "./upload";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import category from "./danhmuc";
import Cart from "./cart";

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

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

app.post(
  "/upload",
  uploadPhoto.array("images", 10),
  async (req: any, res: any) => {
    try {
      const uploader = (path: any) => cloudinaryUploadImg(path);
      const urls = [];
      const files = req.files;
      for (const file of files) {
        const { path } = file;
        const newpath = await uploader(path);

        urls.push(newpath);
        fs.unlinkSync(path);
      }
      const images = urls.map((file) => {
        return file;
      });
      res.status(201).json({
        payload: images,
        status: 200,
      });
    } catch (error: any) {
      throw new Error(error);
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

app.put("/user/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật thông tin người dùng" });
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
        cart.items.splice(productIndex, 1); // Remove the item from the cart
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
      return res.status(404).json({ message: "Cart is Empty", isEmpty : true });
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

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(user);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password!" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: process.env.EXPIRES_TOKEN,
    });

    // Kiểm tra vai trò của người dùng
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
    res.status(500).json({ message: "Error Logging in!" });
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
    const { name, price, img, soLuong, moTa, categoryID } = req.body;
    console.log(categoryID);

    const Category = await category.findById(categoryID);

    if (!Category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    const newProduct = new Product({ name, price, img, soLuong, moTa, category: categoryID });
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
    const products = await Product.find().populate("category", "name");
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin sản phẩm" });
  }
});

app.get("/product/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate("category", "name");
    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin sản phẩm" });
  }
});

app.put("/update/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateProduct = await Product.findByIdAndUpdate(id, req.body, {
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
    const test = await Product.findByIdAndDelete(id);

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
// Vô hiệu hóa người dùng
app.put("/user/deactivate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { active: false }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng để vô hiệu hóa" });
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
    const user = await User.findByIdAndUpdate(id, { active: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng để kích hoạt lại" });
    }
    res.json({ message: "Người dùng đã được kích hoạt lại", user });
  } catch (error) {
    console.error("Error activating user:", error);
    res.status(500).json({ message: "Lỗi khi kích hoạt lại người dùng" });
  }
});


























app.listen(PORT, () => {
  console.log(`Server đang lắng nghe tại cổng ${PORT}`);
});
