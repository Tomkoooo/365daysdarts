import mongoose, { Schema, model, models } from 'mongoose';

const LectureSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['video', 'pdf', 'text', 'quiz'],
    required: true,
  },
  contentUrl: { type: String }, // For video/pdf
  textContent: { type: String }, // For text type
  duration: { type: Number, default: 0 }, // In minutes
  isFree: { type: Boolean, default: false }, // For preview
  order: { type: Number, default: 0 },
}, { timestamps: true });

const Lecture = models.Lecture || model('Lecture', LectureSchema);

export default Lecture;
