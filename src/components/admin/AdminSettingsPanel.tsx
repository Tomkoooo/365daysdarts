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
  updateEmailSettings,
} from "@/actions/site-settings-actions";
import { SettingsImageField } from "@/components/admin/SettingsImageField";
import type { SeoSettings } from "@/services/seo-settings";
import type { BrandingSettings } from "@/services/branding-settings";
import type { ThemeSettings } from "@/services/theme-settings";
import type { FooterSettings } from "@/services/footer-settings";
import type { EmailSettings } from "@/services/email-settings";

export function AdminSettingsPanel() {
  const [seo, setSeo] = useState<SeoSettings | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [footer, setFooter] = useState<FooterSettings | null>(null);
  const [email, setEmail] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteSettingsAdmin()
      .then((data) => {
        setSeo(data.seo);
        setBranding(data.branding);
        setTheme(data.theme);
        setFooter(data.footer);
        setEmail(data.email);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function saveSeo() {
    if (!seo) return;
    setSaving(true);
    try {
      await updateSeoSettings(seo);
      toast.success("SEO beállítások mentve");
    } catch {
      toast.error("SEO mentése sikertelen");
    } finally {
      setSaving(false);
    }
  }

  async function saveBranding() {
    if (!branding) return;
    setSaving(true);
    try {
      await updateBrandingSettings(branding);
      toast.success("Arculat mentve");
    } catch {
      toast.error("Arculat mentése sikertelen");
    } finally {
      setSaving(false);
    }
  }

  async function saveTheme() {
    if (!theme) return;
    setSaving(true);
    try {
      await updateThemeSettings(theme);
      toast.success("Téma mentve");
    } catch {
      toast.error("Téma mentése sikertelen");
    } finally {
      setSaving(false);
    }
  }

  async function saveFooter() {
    if (!footer) return;
    setSaving(true);
    try {
      await updateFooterSettings(footer);
      toast.success("Lábléc mentve");
    } catch {
      toast.error("Lábléc mentése sikertelen");
    } finally {
      setSaving(false);
    }
  }

  async function saveEmail() {
    if (!email) return;
    setSaving(true);
    try {
      await updateEmailSettings(email);
      toast.success("E-mail beállítások mentve");
    } catch {
      toast.error("E-mail mentése sikertelen");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !seo || !branding || !theme || !footer || !email) {
    return (
      <AdminShell title="Beállítások">
        <p className="text-muted-foreground">Beállítások betöltése...</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Beállítások">
      <Tabs defaultValue="seo" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="branding">Arculat</TabsTrigger>
          <TabsTrigger value="theme">Téma</TabsTrigger>
          <TabsTrigger value="footer">Lábléc</TabsTrigger>
          <TabsTrigger value="email">E-mail</TabsTrigger>
        </TabsList>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO és metaadatok</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Oldal címe</Label>
                  <Input
                    value={seo.siteTitle}
                    onChange={(e) => setSeo({ ...seo, siteTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <SettingsImageField
                    label="Favicon"
                    value={seo.favicon}
                    onChange={(favicon) => setSeo({ ...seo, favicon })}
                    aspect={1}
                    recommendedSize={{ width: 64, height: 64 }}
                    usageLabel="Favicon"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Oldal leírása</Label>
                <Textarea
                  value={seo.siteDescription}
                  onChange={(e) => setSeo({ ...seo, siteDescription: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsImageField
                  label="OG kép"
                  value={seo.ogImage}
                  onChange={(ogImage) => setSeo({ ...seo, ogImage })}
                  aspect={16 / 9}
                  recommendedSize={{ width: 1200, height: 630 }}
                  usageLabel="Open Graph"
                />
                <SettingsImageField
                  label="Twitter kép"
                  value={seo.twitterImage}
                  onChange={(twitterImage) => setSeo({ ...seo, twitterImage })}
                  aspect={16 / 9}
                  recommendedSize={{ width: 1200, height: 630 }}
                  usageLabel="Twitter card"
                />
              </div>
              <div className="space-y-2">
                <Label>Kanonikus alap URL</Label>
                <Input
                  value={seo.canonicalBaseUrl}
                  onChange={(e) =>
                    setSeo({ ...seo, canonicalBaseUrl: e.target.value })
                  }
                />
              </div>
              <Button onClick={saveSeo} disabled={saving}>
                SEO mentése
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Arculat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Márkanév</Label>
                <Input
                  value={branding.brandName}
                  onChange={(e) =>
                    setBranding({ ...branding, brandName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsImageField
                  label="Navigációs logo"
                  value={branding.logoNav}
                  onChange={(logoNav) => setBranding({ ...branding, logoNav })}
                  aspect={512 / 160}
                  recommendedSize={{ width: 512, height: 160 }}
                  usageLabel="Navigációs logó"
                />
                <SettingsImageField
                  label="Lábléc logo"
                  value={branding.logoFooter}
                  onChange={(logoFooter) => setBranding({ ...branding, logoFooter })}
                  aspect={512 / 160}
                  recommendedSize={{ width: 512, height: 160 }}
                  usageLabel="Lábléc logó"
                />
              </div>
              <SettingsImageField
                label="Hero logo"
                value={branding.logoHero}
                onChange={(logoHero) => setBranding({ ...branding, logoHero })}
                aspect={512 / 160}
                recommendedSize={{ width: 512, height: 160 }}
                usageLabel="Hero logó"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableBilling"
                  checked={branding.enableBilling}
                  onChange={(e) =>
                    setBranding({ ...branding, enableBilling: e.target.checked })
                  }
                  className="h-4 w-4 rounded border"
                />
                <Label htmlFor="enableBilling">
                  Fizetési funkciók és Stripe beállítások engedélyezése
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Ha ki van kapcsolva, a bevételi statisztikák nem jelennek meg az admin
                felületen. A hozzáférés továbbra is manuálisan aktiválható.
              </p>
              <Button onClick={saveBranding} disabled={saving}>
                Arculat mentése
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Téma színek</CardTitle>
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
                Téma mentése
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle>Lábléc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Szlogen</Label>
                <Textarea
                  value={footer.tagline}
                  onChange={(e) => setFooter({ ...footer, tagline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cím</Label>
                <Textarea
                  value={footer.address}
                  onChange={(e) => setFooter({ ...footer, address: e.target.value })}
                />
              </div>
              <Button onClick={saveFooter} disabled={saving}>
                Lábléc mentése
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>SMTP e-mail beállítások</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emailEnabled"
                  checked={email.enabled}
                  onChange={(e) => setEmail({ ...email, enabled: e.target.checked })}
                  className="h-4 w-4 rounded border"
                />
                <Label htmlFor="emailEnabled">E-mail küldés engedélyezése</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Ha nincs SMTP beállítva, az e-mailek kihagyásra kerülnek (a rendszer
                továbbra is működik). Alternatíva: EMAIL_API_URL környezeti változó.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>SMTP szerver</Label>
                  <Input
                    value={email.host}
                    onChange={(e) => setEmail({ ...email, host: e.target.value })}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={email.port}
                    onChange={(e) =>
                      setEmail({ ...email, port: parseInt(e.target.value, 10) || 587 })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emailSecure"
                  checked={email.secure}
                  onChange={(e) => setEmail({ ...email, secure: e.target.checked })}
                  className="h-4 w-4 rounded border"
                />
                <Label htmlFor="emailSecure">Biztonságos kapcsolat (SSL/TLS)</Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>SMTP felhasználó</Label>
                  <Input
                    value={email.user}
                    onChange={(e) => setEmail({ ...email, user: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP jelszó</Label>
                  <Input
                    type="password"
                    value={email.pass}
                    onChange={(e) => setEmail({ ...email, pass: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Feladó e-mail</Label>
                  <Input
                    value={email.fromEmail}
                    onChange={(e) => setEmail({ ...email, fromEmail: e.target.value })}
                    placeholder="info@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Feladó neve</Label>
                  <Input
                    value={email.fromName}
                    onChange={(e) => setEmail({ ...email, fromName: e.target.value })}
                    placeholder="365daysdarts"
                  />
                </div>
              </div>
              <Button onClick={saveEmail} disabled={saving}>
                E-mail beállítások mentése
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
