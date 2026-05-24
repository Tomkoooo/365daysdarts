import { Schema, model, models } from 'mongoose';

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['dolgozat_submitted', 'dolgozat_graded', 'dolgozat_on_behalf'],
      required: true,
    },
    dolgozatId: { type: Schema.Types.ObjectId, ref: 'Dolgozat', required: true },
    submissionId: { type: Schema.Types.ObjectId, ref: 'DolgozatSubmission' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    message: { type: String, required: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

const Notification = models.Notification || model('Notification', NotificationSchema);

export default Notification;
