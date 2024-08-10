import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    }
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
