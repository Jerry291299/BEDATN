import mongoose, { Document, Schema } from "mongoose";
import { ICartItem } from "./cart";

// Define the interface for the order
export interface IOrder extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  items: ICartItem[];
  amount: number;
  status: string;
  paymentstatus: string;
  createdAt: Date;
  magiaodich: string;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes?: string;
  };
  paymentMethod: string; 
}


const orderSchema = new Schema<IOrder>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      img: [{ type: String, required: true }],
      quantity: { type: Number, required: true },
    },
  ],
  amount: { type: Number, required: true },
  status: { type: String, default: "pending" },
  paymentstatus: { type: String, 
    // enum: ["chưa thanh toán", "Đã thanh toán","failed"], 
    default: "chưa thanh toán"  },
  createdAt: { type: Date, default: Date.now },
  magiaodich: { type: String, required: false },
  customerDetails: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    notes: { type: String },
  },
  paymentMethod: { type: String, required: true },
});


const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
