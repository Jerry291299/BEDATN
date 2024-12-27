import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  active: boolean;
  reason:String;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin", "shipper"],
      default: "user",
    },
    active: { type: Boolean, default: true },
    reason: { type: String, default: null },
  },
  { timestamps: true } // Thêm timestamps
);



export default mongoose.model<User>("User", UserSchema);
