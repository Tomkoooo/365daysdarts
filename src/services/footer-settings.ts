import connectDB from "@/lib/db";
import FooterSetting from "@/models/FooterSetting";

export type FooterLink = { label: string; href: string };

export type FooterSettings = {
  tagline: string;
  address: string;
  quickLinks: FooterLink[];
  socialLinks: FooterLink[];
};

const DEFAULTS: FooterSettings = {
  tagline: "",
  address: "",
  quickLinks: [],
  socialLinks: [],
};

export class FooterSettingsService {
  static async get(): Promise<FooterSettings> {
    await connectDB();
    const doc = await FooterSetting.findOneAndUpdate(
      { key: "footer" },
      { $setOnInsert: { key: "footer", ...DEFAULTS } },
      { upsert: true, returnDocument: "after", lean: true }
    );
    return {
      ...DEFAULTS,
      tagline: doc?.tagline || "",
      address: doc?.address || "",
      quickLinks: doc?.quickLinks || [],
      socialLinks: doc?.socialLinks || [],
    };
  }

  static async update(input: Partial<FooterSettings>): Promise<FooterSettings> {
    await connectDB();
    const merged = { ...(await this.get()), ...input };
    await FooterSetting.findOneAndUpdate(
      { key: "footer" },
      { $set: { ...merged, key: "footer" } },
      { upsert: true }
    );
    return merged;
  }
}
