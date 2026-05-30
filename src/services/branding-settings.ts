import connectDB from "@/lib/db";
import BrandingSetting from "@/models/BrandingSetting";

export type BrandingSettings = {
  brandName: string;
  logoNav: string;
  logoFooter: string;
  logoHero: string;
};

const DEFAULTS: BrandingSettings = {
  brandName: "365daysdarts",
  logoNav: "/logo.svg",
  logoFooter: "/logo.svg",
  logoHero: "/logo.svg",
};

export class BrandingSettingsService {
  static async get(): Promise<BrandingSettings> {
    await connectDB();
    const doc = await BrandingSetting.findOneAndUpdate(
      { key: "branding" },
      { $setOnInsert: { key: "branding", ...DEFAULTS } },
      { upsert: true, returnDocument: "after", lean: true }
    );
    return { ...DEFAULTS, ...doc };
  }

  static async update(input: Partial<BrandingSettings>): Promise<BrandingSettings> {
    await connectDB();
    const merged = { ...(await this.get()), ...input };
    await BrandingSetting.findOneAndUpdate(
      { key: "branding" },
      { $set: { ...merged, key: "branding" } },
      { upsert: true }
    );
    return merged;
  }
}
