import mongoose, { Schema, model, models } from 'mongoose';

const PageSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String }, // Rich text HTML content
  type: {
      type: String, 
      enum: ['text', 'video', 'image', 'pdf'],
      default: 'text'
  },
  mediaUrl: { type: String }, // Optional for video/image/pdf
  chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const Page = models.Page || model('Page', PageSchema);

export default Page;
