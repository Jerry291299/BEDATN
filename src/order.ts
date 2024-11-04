// models/Order.ts
import mongoose, { Document, Schema } from "mongoose";
import { ICartItem } from "./cart";


export interface IOrder extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
  status: string;
  createdAt: Date;
}

const orderSchema = new Schema<IOrder>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      img: { type: String, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
