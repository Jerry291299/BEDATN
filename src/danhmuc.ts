import mongoose,{ Schema ,Document} from "mongoose";

export interface ICategoty extends Document{
    _id: number;
    name: string;
}const CategorySchema: Schema = new Schema({
    name: {type: String, required: true}
})
export default mongoose.model<ICategoty>('Category',CategorySchema);