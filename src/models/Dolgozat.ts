import { Schema, model, models } from 'mongoose';

const QuestionFileSchema = new Schema(
  {
    mediaId: { type: Schema.Types.ObjectId, required: true },
    url: { type: String, required: true },
    originalName: { type: String, required: true },
    contentType: { type: String, required: true },
  },
  { _id: false }
);

const DolgozatSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    label: { type: String },
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module' },
    pageId: { type: Schema.Types.ObjectId, ref: 'Page' },
    maxPoints: { type: Number, default: 100 },
    deadlineAt: { type: Date },
    questionFile: { type: QuestionFileSchema },
    isPublished: { type: Boolean, default: false },
    allowResubmitUntilDeadline: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DolgozatSchema.index({ courseId: 1, isArchived: 1, isPublished: 1 });

const Dolgozat = models.Dolgozat || model('Dolgozat', DolgozatSchema);

export default Dolgozat;
