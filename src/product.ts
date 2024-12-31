import mongoose, { Schema, Document } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// Giao diện cho biến thể sản phẩm
export interface Variant {
  size: string; // Kích thước
  quantity: number; // Số lượng
  price: number; // Giá
  discount: number; // Giảm giá (phần trăm)
}

// Giao diện cho sản phẩm
export interface Product extends Document {
  masp: string; // ID sản phẩm
  name: string; // Tên sản phẩm
  img: string[]; // Mảng URL ảnh sản phẩm
  moTa: string; // Mô tả sản phẩm
  category: mongoose.Schema.Types.ObjectId; // Tham chiếu đến danh mục
  material: mongoose.Schema.Types.ObjectId; // Tham chiếu đến chất liệu
  status: boolean; // Trạng thái sản phẩm
  variants: Variant[]; // Mảng chứa các biến thể sản phẩm
  createdAt: Date; // Thời gian tạo
  updatedAt: Date; // Thời gian cập nhật
}

// Định nghĩa schema cho biến thể sản phẩm
const VariantSchema: Schema = new Schema(
  {
    size: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
  },
  { timestamps: true } // Thêm timestamps cho từng biến thể
);

// Định nghĩa schema cho sản phẩm
const ProductSchema: Schema = new Schema(
  {
    masp: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    img: [{ type: String }],
    moTa: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    material: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    status: { type: Boolean, required: true },
    variants: [
      {
        size: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        discount: { type: Number, default: 0 },
      },
      { timestamps: true },
    ],
  },
  { timestamps: true }
);

// Cập nhật middleware `pre-save` với kiểu `this` đúng

// Trước khi lưu sản phẩm, kiểm tra kích thước trùng lặp
export function checkDuplicateSizes(variants: Variant[]): Error | null {
  const sizeSet = new Set();
  for (const variant of variants) {
    if (sizeSet.has(variant.size)) {
      return new Error(
        `Có kích thước trùng lặp trong các biến thể sản phẩm: ${variant.size}`
      );
    }
    sizeSet.add(variant.size);
  }
  return null;
}

// Tạo chỉ mục duy nhất kết hợp cho masp và name
ProductSchema.index({ masp: 1, name: 1 }, { unique: true });

// Kích hoạt phân trang cho model sản phẩm
ProductSchema.plugin(mongoosePaginate);

// Tạo và xuất model sản phẩm
const Product = mongoose.model<Product, mongoose.PaginateModel<Product>>(
  "Product",
  ProductSchema
);

export default Product;
