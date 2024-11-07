import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  userId: string;
  name: string;
  email: string;
  password: string;
  role: string;
  active: boolean;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "admin", "shipper"],
    default: "user",
  },
  active: { type: Boolean, default: true },
});


export default mongoose.model<User>("User", UserSchema);
