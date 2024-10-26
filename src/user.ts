import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  userId: string;
  name: string;
  email: string;
  password: string;
  role:string;
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

});

export default mongoose.model<User>("User", UserSchema);
