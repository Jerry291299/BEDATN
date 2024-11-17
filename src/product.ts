import mongoose, { Schema, Document } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { ICategory } from "./danhmuc";

export interface Product extends Document {
  _id: number;
  name: string;
  price: number;
  img: string;
  soLuong: number;
  moTa: string;
  category: mongoose.Schema.Types.ObjectId;
  status: boolean;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String }, 
  soLuong: { type: Number, required: true },
  moTa: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  status: { type: Boolean, required: true }
});



ProductSchema.plugin(mongoosePaginate);

const Product = mongoose.model<Product, mongoose.PaginateModel<Product>>("Product", ProductSchema);

export default Product;