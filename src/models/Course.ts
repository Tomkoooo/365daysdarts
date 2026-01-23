import mongoose, { Schema, model, models } from 'mongoose';

const CourseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, default: 0 },
  thumbnail: { type: String },
  isPublished: { type: Boolean, default: false },
  modules: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
  // chapters: removed in favor of modules
  authorId: { type: Schema.Types.ObjectId, ref: 'User' },
  // Final Exam Settings
  finalExamSettings: {
      passingScore: { type: Number, default: 75 },
      questionCount: { type: Number, default: 20 },
      timeLimit: { type: Number, default: 60 }, // in minutes
      maxRetries: { type: Number, default: 3 }, 
  }
}, { timestamps: true });

const Course = models.Course || model('Course', CourseSchema);

export default Course;
