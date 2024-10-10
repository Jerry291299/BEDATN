
// src/index.ts
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";

import { Uploadfile } from "./upload";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import category from "./danhmuc";
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

//  Categoty : Get
app.get("/category",async(req:Request,res:Response)=>{
  try{
    const categories = await category.find();
    res.json(categories);
  }catch(error){
    console.log(error);
    res.status(500).json({message:"Lỗi khi lấy thông tin danh mục"});
  }
});
app.get("/category/:id", async (req:Request,res:Response)=>{
  try{
    const {id} =req.params;
    const Category = await category.findById(id);
    res.json(Category);
  }catch(error){
    console.log(error);
    res.status(500).json({message:"Lỗi khi lấy thông tin danh mục"});
  }
});

//  Categoty : Post
app.post("/addcategory",async(req:Request,res:Response)=>{
  try{
    const newCategory = new category(req.body);
    await newCategory.save();
    res.status(201).json({
      massege: "Thêm Category thành công",
      category: newCategory,
      status: 200,
    });
  }catch(error){
    console.log(error);
    res.status(500).json({message:"Lỗi thêm mới danh mục"});
  }
}); 

//  Categoty : Delete
app.delete("/category/:id",async (req:Request,res:Response)=>{
  try{
    const {id} =req.params;
    const del = await category.findByIdAndDelete(id);
    res.json({
      message:"Danh mục đã xoá thành công",
      id: id,
      test: del,
    });
  }catch(error){
    console.log(error);
    res.status(500).json({ message: "Lỗi khi xóa danh mục" });
  }
})



app.listen(PORT, () => {
  console.log(`Server đang lắng nghe tại cổng ${PORT}`);
});
