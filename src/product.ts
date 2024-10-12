import mongoose, { Schema, Document } from "mongoose";
import { ICategory } from "./danhmuc";

export interface Product extends Document {
  _id: number;
  name: string;
  price: number;
  img: string;
  category: mongoose.Schema.Types.ObjectId;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String, required: false },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
});

export default mongoose.model<Product>("Product", ProductSchema);