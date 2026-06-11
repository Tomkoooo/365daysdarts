import connectDB from "@/lib/db";
import EmailSetting from "@/models/EmailSetting";

export type EmailSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
};

const DEFAULTS: EmailSettings = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  pass: "",
  fromEmail: "",
  fromName: "",
  enabled: false,
};

export class EmailSettingsService {
  static async get(): Promise<EmailSettings> {
    await connectDB();
    const doc = await EmailSetting.findOneAndUpdate(
      { key: "email" },
      { $setOnInsert: { key: "email", ...DEFAULTS } },
      { upsert: true, returnDocument: "after", lean: true }
    );
    return { ...DEFAULTS, ...doc };
  }

  static async update(input: Partial<EmailSettings>): Promise<EmailSettings> {
    await connectDB();
    const merged = { ...(await this.get()), ...input };
    await EmailSetting.findOneAndUpdate(
      { key: "email" },
      { $set: { ...merged, key: "email" } },
      { upsert: true }
    );
    return merged;
  }
}
