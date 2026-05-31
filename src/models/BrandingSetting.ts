import { Schema, model, models } from "mongoose";

const BrandingSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "branding" },
    brandName: { type: String, default: "Learning Platform" },
    logoNav: { type: String, default: "/logo.svg" },
    logoFooter: { type: String, default: "/logo.svg" },
    logoHero: { type: String, default: "/logo.svg" },
    enableBilling: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const BrandingSetting =
  models.BrandingSetting || model("BrandingSetting", BrandingSettingSchema);
export default BrandingSetting;
