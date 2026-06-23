import { Schema, model, models } from 'mongoose';

const OptionItemSchema = new Schema(
  {
    text: { type: String, required: true },
    limit: { type: Number, default: 0 }, // 0 = unlimited
  },
  { _id: true }
);

const ResponseSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    optionId: { type: Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const RequirementsSchema = new Schema(
  {
    beadandoSubmitted: { type: Boolean, default: false },
    beadandoGraded: { type: Boolean, default: false },
    hasFinalExamResult: { type: Boolean, default: false },
    passedFinalExam: { type: Boolean, default: false },
  },
  { _id: false }
);

const OptionSelectorSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    allowMultiple: { type: Boolean, default: false },
    options: { type: [OptionItemSchema], default: [] },
    responses: { type: [ResponseSchema], default: [] },
    requirements: { type: RequirementsSchema, default: () => ({}) },
    deadlineAt: { type: Date },
    isPublished: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OptionSelectorSchema.index({ courseId: 1, isArchived: 1, isPublished: 1 });

const OptionSelector =
  models.OptionSelector || model('OptionSelector', OptionSelectorSchema);

export default OptionSelector;
