import connectDB from "@/lib/db";
import ThemeSetting from "@/models/ThemeSetting";

export type ThemeSettings = {
  colors: Record<string, string>;
};

const DEFAULT_COLORS: Record<string, string> = {
  navy: "#031947",
  navyDarker: "#020d2e",
  navyLighter: "#1a2f5e",
  cta: "#00aaff",
  ctaHover: "#0088cc",
};

export class ThemeSettingsService {
  static async get(): Promise<ThemeSettings> {
    await connectDB();
    const doc = await ThemeSetting.findOneAndUpdate(
      { key: "theme" },
      { $setOnInsert: { key: "theme", colors: DEFAULT_COLORS } },
      { upsert: true, returnDocument: "after", lean: true }
    );
    const colors =
      doc?.colors instanceof Map
        ? Object.fromEntries(doc.colors)
        : { ...DEFAULT_COLORS, ...(doc?.colors as Record<string, string>) };
    return { colors: { ...DEFAULT_COLORS, ...colors } };
  }

  static async update(input: Partial<ThemeSettings>): Promise<ThemeSettings> {
    await connectDB();
    const current = await this.get();
    const merged = {
      colors: { ...current.colors, ...(input.colors || {}) },
    };
    await ThemeSetting.findOneAndUpdate(
      { key: "theme" },
      { $set: { key: "theme", colors: merged.colors } },
      { upsert: true }
    );
    return merged;
  }
}
