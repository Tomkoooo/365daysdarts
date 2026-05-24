import { Schema, model, models } from 'mongoose';

const PhotoSchema = new Schema(
  {
    order: { type: Number, required: true },
    mediaId: { type: Schema.Types.ObjectId, required: true },
    url: { type: String, required: true },
    originalName: { type: String },
    contentType: { type: String, required: true },
    kind: { type: String, enum: ['image', 'document'], default: 'image' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const DolgozatSubmissionSchema = new Schema(
  {
    dolgozatId: { type: Schema.Types.ObjectId, ref: 'Dolgozat', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    photos: { type: [PhotoSchema], default: [] },
    submittedAt: { type: Date },
    isLate: { type: Boolean, default: false },
    points: { type: Number },
    feedback: { type: String },
    gradedAt: { type: Date },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedOnBehalfBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedOnBehalfAt: { type: Date },
    deadlineReminderSentAt: { type: Date },
  },
  { timestamps: true }
);

DolgozatSubmissionSchema.index({ dolgozatId: 1, userId: 1 }, { unique: true });

const DolgozatSubmission =
  models.DolgozatSubmission || model('DolgozatSubmission', DolgozatSubmissionSchema);

export default DolgozatSubmission;
