import mongoose, { Schema, model, models } from 'mongoose';

const ExamResultSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' }, // Optional if it's a general practice
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  answers: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
    selectedOptions: [{ type: Number }], // Array of selected indices
    isCorrect: { type: Boolean },
  }],
  type: {
    type: String,
    enum: ['practice', 'final', 'module'],
    required: true,
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }, // Null if in progress
}, { timestamps: true });

const ExamResult = models.ExamResult || model('ExamResult', ExamResultSchema);

export default ExamResult;
