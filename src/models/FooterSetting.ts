import { Schema, model, models } from "mongoose";

const FooterLinkSchema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
  },
  { _id: false }
);

const FooterSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "footer" },
    tagline: { type: String, default: "" },
    address: { type: String, default: "" },
    quickLinks: { type: [FooterLinkSchema], default: [] },
    socialLinks: { type: [FooterLinkSchema], default: [] },
  },
  { timestamps: true }
);

const FooterSetting = models.FooterSetting || model("FooterSetting", FooterSettingSchema);
export default FooterSetting;
