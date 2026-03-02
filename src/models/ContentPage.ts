import { Schema, model, models } from "mongoose";
import { CONTENT_BLOCK_TYPES } from "@/lib/content/types";

const ContentBlockSchema = new Schema(
  {
    blockId: { type: String, required: true },
    type: {
      type: String,
      enum: CONTENT_BLOCK_TYPES,
      required: true,
    },
    order: { type: Number, default: 0 },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const ContentPageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    draftBlocks: { type: [ContentBlockSchema], default: [] },
    publishedBlocks: { type: [ContentBlockSchema], default: [] },
    publishedAt: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const ContentPage = models.ContentPage || model("ContentPage", ContentPageSchema);

export default ContentPage;
