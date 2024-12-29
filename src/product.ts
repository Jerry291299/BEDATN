import mongoose, { Schema, Document } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { ICategory } from "./danhmuc";

// Giao diện cho biến thể sản phẩm
export interface Variant {
    size: string;      // Kích thước
    quantity: number;  // Số lượng
    price: number;     // Giá
    discount: number;  // Giảm giá (phần trăm)
}

// Giao diện cho sản phẩm
export interface Product extends Document {
    _id: number;
    masp: string;                           // ID sản phẩm
    name: string;                            // Tên sản phẩm
    img: string[];                           // Mảng URL ảnh sản phẩm
    moTa: string;                            // Mô tả sản phẩm
    category: mongoose.Schema.Types.ObjectId; // Tham chiếu đến danh mục
    material: mongoose.Schema.Types.ObjectId; // Tham chiếu đến chất liệu
    status: boolean;                         // Trạng thái sản phẩm
    variants: Variant[];                     // Mảng chứa các biến thể sản phẩm
}

// Định nghĩa schema cho sản phẩm
const ProductSchema: Schema = new Schema({
    masp: { type: String, required: true },
    name: { type: String, required: true },                // Tên sản phẩm
    img: [{ type: String }],                               // Mảng ảnh sản phẩm
    moTa: { type: String, required: true },                // Mô tả sản phẩm
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true }, // Danh mục sản phẩm
    material: { type: Schema.Types.ObjectId, ref: "Material", required: true }, // Chất liệu sản phẩm
    status: { type: Boolean, required: true },             // Trạng thái sản phẩm
    variants: [{                                           // Biến thể sản phẩm
        size: { type: String, required: true },           // Kích thước của biến thể
        quantity: { type: Number, required: true },       // Số lượng của biến thể
        price: { type: Number, required: true },          // Giá của biến thể
        discount: { type: Number, default: 0 },           // Giảm giá (mặc định là 0 nếu không có)
    }],
});

// Kích hoạt phân trang cho model sản phẩm
ProductSchema.plugin(mongoosePaginate);

// Tạo và xuất model sản phẩm
const Product = mongoose.model<Product, mongoose.PaginateModel<Product>>(
    "Product",
    ProductSchema
);

export default Product;