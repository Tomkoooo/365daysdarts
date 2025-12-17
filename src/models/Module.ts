import mongoose, { Schema, model, models } from 'mongoose';

const ModuleSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  chapters: [{ type: Schema.Types.ObjectId, ref: 'Chapter' }],
  order: { type: Number, default: 0 },
  // Exam Settings
  quizSettings: {
      passingScore: { type: Number, default: 75 }, // Percentage
      questionCount: { type: Number, default: 10 },
      timeLimit: { type: Number, default: 30 }, // Minutes
  }
}, { timestamps: true });

const Module = models.Module || model('Module', ModuleSchema);

export default Module;
