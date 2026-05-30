"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { SeoSettingsService, type SeoSettings } from "@/services/seo-settings";
import {
  BrandingSettingsService,
  type BrandingSettings,
} from "@/services/branding-settings";
import { ThemeSettingsService, type ThemeSettings } from "@/services/theme-settings";
import {
  FooterSettingsService,
  type FooterSettings,
} from "@/services/footer-settings";

export async function getSiteSettingsAdmin() {
  await requireAdmin();
  const [seo, branding, theme, footer] = await Promise.all([
    SeoSettingsService.get(),
    BrandingSettingsService.get(),
    ThemeSettingsService.get(),
    FooterSettingsService.get(),
  ]);
  return { seo, branding, theme, footer };
}

export async function updateSeoSettings(input: Partial<SeoSettings>) {
  await requireAdmin();
  const result = await SeoSettingsService.update(input);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return result;
}

export async function updateBrandingSettings(input: Partial<BrandingSettings>) {
  await requireAdmin();
  const result = await BrandingSettingsService.update(input);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return result;
}

export async function updateThemeSettings(input: Partial<ThemeSettings>) {
  await requireAdmin();
  const result = await ThemeSettingsService.update(input);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return result;
}

export async function updateFooterSettings(input: Partial<FooterSettings>) {
  await requireAdmin();
  const result = await FooterSettingsService.update(input);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return result;
}
