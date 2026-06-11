import { Schema, model, models } from "mongoose";

const EmailSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "email" },
    host: { type: String, default: "" },
    port: { type: Number, default: 587 },
    secure: { type: Boolean, default: false },
    user: { type: String, default: "" },
    pass: { type: String, default: "" },
    fromEmail: { type: String, default: "" },
    fromName: { type: String, default: "" },
    enabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const EmailSetting =
  models.EmailSetting || model("EmailSetting", EmailSettingSchema);
export default EmailSetting;
