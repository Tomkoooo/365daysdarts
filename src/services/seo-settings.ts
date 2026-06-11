import connectDB from "@/lib/db";
import SeoSetting from "@/models/SeoSetting";

export type SeoSettings = {
  siteTitle: string;
  siteDescription: string;
  favicon: string;
  ogImage: string;
  twitterImage: string;
  defaultLocale: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  canonicalBaseUrl: string;
};

const DEFAULTS: SeoSettings = {
  siteTitle: "365daysdarts",
  siteDescription: "Secure, efficient, and comprehensive learning.",
  favicon: "/logo.svg",
  ogImage: "/logo.svg",
  twitterImage: "/logo.svg",
  defaultLocale: "hu_HU",
  robotsIndex: true,
  robotsFollow: true,
  canonicalBaseUrl: "",
};

export class SeoSettingsService {
  static async get(): Promise<SeoSettings> {
    await connectDB();
    const doc = await SeoSetting.findOneAndUpdate(
      { key: "seo" },
      { $setOnInsert: { key: "seo", ...DEFAULTS } },
      { upsert: true, returnDocument: "after", lean: true }
    );
    return { ...DEFAULTS, ...doc };
  }

  static async update(input: Partial<SeoSettings>): Promise<SeoSettings> {
    await connectDB();
    const merged = { ...(await this.get()), ...input };
    await SeoSetting.findOneAndUpdate(
      { key: "seo" },
      { $set: { ...merged, key: "seo" } },
      { upsert: true }
    );
    return merged;
  }
}
