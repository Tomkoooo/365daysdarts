import { Schema, model, models } from "mongoose";

const SeoSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "seo" },
    siteTitle: { type: String, default: "Learning Platform" },
    siteDescription: { type: String, default: "Online learning platform" },
    favicon: { type: String, default: "/logo.svg" },
    ogImage: { type: String, default: "/logo.svg" },
    twitterImage: { type: String, default: "/logo.svg" },
    defaultLocale: { type: String, default: "hu_HU" },
    robotsIndex: { type: Boolean, default: true },
    robotsFollow: { type: Boolean, default: true },
    canonicalBaseUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const SeoSetting = models.SeoSetting || model("SeoSetting", SeoSettingSchema);
export default SeoSetting;
