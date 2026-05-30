"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getSiteSettingsAdmin,
  updateSeoSettings,
  updateBrandingSettings,
  updateThemeSettings,
  updateFooterSettings,
} from "@/actions/site-settings-actions";
import type { SeoSettings } from "@/services/seo-settings";
import type { BrandingSettings } from "@/services/branding-settings";
import type { ThemeSettings } from "@/services/theme-settings";
import type { FooterSettings } from "@/services/footer-settings";

export function AdminSettingsPanel() {
  const [seo, setSeo] = useState<SeoSettings | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [footer, setFooter] = useState<FooterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteSettingsAdmin()
      .then((data) => {
        setSeo(data.seo);
        setBranding(data.branding);
        setTheme(data.theme);
        setFooter(data.footer);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function saveSeo() {
    if (!seo) return;
    setSaving(true);
    try {
      await updateSeoSettings(seo);
      toast.success("SEO settings saved");
    } catch {
      toast.error("Failed to save SEO settings");
    } finally {
      setSaving(false);
    }
  }

  async function saveBranding() {
    if (!branding) return;
    setSaving(true);
    try {
      await updateBrandingSettings(branding);
      toast.success("Branding saved");
    } catch {
      toast.error("Failed to save branding");
    } finally {
      setSaving(false);
    }
  }

  async function saveTheme() {
    if (!theme) return;
    setSaving(true);
    try {
      await updateThemeSettings(theme);
      toast.success("Theme saved");
    } catch {
      toast.error("Failed to save theme");
    } finally {
      setSaving(false);
    }
  }

  async function saveFooter() {
    if (!footer) return;
    setSaving(true);
    try {
      await updateFooterSettings(footer);
      toast.success("Footer saved");
    } catch {
      toast.error("Failed to save footer");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !seo || !branding || !theme || !footer) {
    return (
      <AdminShell title="Settings">
        <p className="text-muted-foreground">Loading settings...</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Settings">
      <Tabs defaultValue="seo" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO & metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Site title</Label>
                  <Input
                    value={seo.siteTitle}
                    onChange={(e) => setSeo({ ...seo, siteTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Favicon URL</Label>
                  <Input
                    value={seo.favicon}
                    onChange={(e) => setSeo({ ...seo, favicon: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Site description</Label>
                <Textarea
                  value={seo.siteDescription}
                  onChange={(e) => setSeo({ ...seo, siteDescription: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>OG image URL</Label>
                  <Input
                    value={seo.ogImage}
                    onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Canonical base URL</Label>
                  <Input
                    value={seo.canonicalBaseUrl}
                    onChange={(e) =>
                      setSeo({ ...seo, canonicalBaseUrl: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button onClick={saveSeo} disabled={saving}>
                Save SEO
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Brand name</Label>
                <Input
                  value={branding.brandName}
                  onChange={(e) =>
                    setBranding({ ...branding, brandName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nav logo URL</Label>
                  <Input
                    value={branding.logoNav}
                    onChange={(e) =>
                      setBranding({ ...branding, logoNav: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Footer logo URL</Label>
                  <Input
                    value={branding.logoFooter}
                    onChange={(e) =>
                      setBranding({ ...branding, logoFooter: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button onClick={saveBranding} disabled={saving}>
                Save branding
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Theme colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(theme.colors).map(([key, value]) => (
                <div key={key} className="grid gap-2 sm:grid-cols-[140px_1fr_80px] items-center">
                  <Label className="capitalize">{key}</Label>
                  <Input
                    type="color"
                    value={value}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        colors: { ...theme.colors, [key]: e.target.value },
                      })
                    }
                    className="h-10"
                  />
                  <Input
                    value={value}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        colors: { ...theme.colors, [key]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
              <Button onClick={saveTheme} disabled={saving}>
                Save theme
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle>Footer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Textarea
                  value={footer.tagline}
                  onChange={(e) => setFooter({ ...footer, tagline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={footer.address}
                  onChange={(e) => setFooter({ ...footer, address: e.target.value })}
                />
              </div>
              <Button onClick={saveFooter} disabled={saving}>
                Save footer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
