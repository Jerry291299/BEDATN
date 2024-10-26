import mongoose, { Schema, Document } from "mongoose";
import { ICategory } from "./danhmuc";

export interface Product extends Document {
  _id: number;
  name: string;
  price: number;
  img: string;
  soLuong: number;
  moTa: string;
  chatLieu: string;
  category: mongoose.Schema.Types.ObjectId;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String, required: false },
  soLuong: { type: Number, required: true },
  moTa: { type: String, required: true },
  chatLieu: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
});

export default mongoose.model<Product>("Product", ProductSchema);