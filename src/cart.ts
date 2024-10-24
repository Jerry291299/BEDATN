import mongoose, { Document, Schema } from "mongoose";

export interface ICartItem {
  productId: mongoose.Schema.Types.ObjectId; // Reference to the Product
  name: string; // Name of the product
  price: number; // Price of the product
  img: string; // Image URL of the product
  quantity: number; // Quantity of the product in the cart
}

export interface ICart extends Document {
  userId: mongoose.Schema.Types.ObjectId; // Reference to the User
  items: ICartItem[]; // Array of cart items
}

const cartSchema = new Schema<ICart>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: { type: String, required: true }, // Change to String
      price: { type: Number, required: true }, // Change to Number
      img: { type: String, required: true }, // Change to String
      quantity: { type: Number, required: true },
    },
  ],
});

const Cart = mongoose.model<ICart>("Cart", cartSchema);

export default Cart;