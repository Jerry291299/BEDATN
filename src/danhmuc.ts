import mongoose,{ Schema ,Document} from "mongoose";

export interface ICategory extends Document{
    _id: number;
    name: string;
}const CategorySchema: Schema = new Schema({
    name: {type: String, required: true}
})
export default mongoose.model<ICategory>('Category',CategorySchema);