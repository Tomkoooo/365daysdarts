import mongoose, { Schema, model, models } from 'mongoose';

const QuestionSchema = new Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }], // e.g. ["A", "B", "C", "D"]
  correctOptions: [{ type: Number, required: true }], // Array of correct indices (0-3)
  chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter' }, // Legacy / Optional
  moduleId: { type: Schema.Types.ObjectId, ref: 'Module' }, // New: Module Pools
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  explanation: { type: String }, // Optional explanation for the answer
}, { timestamps: true });

const Question = models.Question || model('Question', QuestionSchema);

export default Question;
