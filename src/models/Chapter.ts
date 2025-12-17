import mongoose, { Schema, model, models } from 'mongoose';

const ChapterSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
  pages: [{ type: Schema.Types.ObjectId, ref: 'Page' }],
  order: { type: Number, default: 0 },
  // Questions will reference Chapter, but we can index them for random selection
}, { timestamps: true });

const Chapter = models.Chapter || model('Chapter', ChapterSchema);

export default Chapter;
