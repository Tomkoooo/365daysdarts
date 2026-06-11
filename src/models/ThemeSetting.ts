import { Schema, model, models } from "mongoose";

const ThemeSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "theme" },
    colors: {
      type: Map,
      of: String,
      default: {
        navy: "#031947",
        navyDarker: "#020d2e",
        navyLighter: "#1a2f5e",
        cta: "#00aaff",
        ctaHover: "#0088cc",
      },
    },
  },
  { timestamps: true }
);

const ThemeSetting = models.ThemeSetting || model("ThemeSetting", ThemeSettingSchema);
export default ThemeSetting;
