"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDolgozatEmailPreference,
  updateDolgozatEmailPreference,
} from "@/actions/dolgozat-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function DolgozatEmailPreference() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDolgozatEmailPreference()
      .then((r) => setEnabled(r.enabled))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(checked: boolean) {
    setSaving(true);
    const result = await updateDolgozatEmailPreference(checked);
    setSaving(false);
    if (result.success) {
      setEnabled(checked);
      toast.success(checked ? "E-mail értesítések bekapcsolva" : "E-mail értesítések kikapcsolva");
    } else {
      toast.error(result.error || "Hiba");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">E-mail értesítések</CardTitle>
        <CardDescription>
          Ha bekapcsolod és az adminisztrátor beállította az e-mail küldést, értesítést
          kapsz új dolgozatokról és értékelésekről magyar nyelven — beleértve, hogyan éred
          el a dolgozatokat (Bejelentkezés → Kurzus → bal menü: Dolgozatok). Különben
          csak az alkalmazáson belüli értesítések működnek.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            disabled={saving}
            onChange={(e) => handleToggle(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium">
            Dolgozat értesítések e-mailben
            {saving && <Loader2 className="inline h-4 w-4 animate-spin ml-2" />}
          </span>
        </label>
      </CardContent>
    </Card>
  );
}
