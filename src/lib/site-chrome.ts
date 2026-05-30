import { BrandingSettingsService } from "@/services/branding-settings";
import { FooterSettingsService } from "@/services/footer-settings";

export async function getPublicSiteChrome() {
  const [branding, footer] = await Promise.all([
    BrandingSettingsService.get(),
    FooterSettingsService.get(),
  ]);
  return { branding, footer };
}
