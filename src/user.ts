import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  userId: string;
  name: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "user", "shipper"],
    default: "user",
  },
  isActive: { type: Boolean, default: true }, // thêm trường isActive
});

export default mongoose.model<User>("User", UserSchema);
