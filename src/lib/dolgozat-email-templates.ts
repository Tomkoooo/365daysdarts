import { getAppUrl } from "@/lib/email";

export type DolgozatEmailTemplate = "published" | "graded";

function accessSteps(courseId: string, dolgozatId: string): string {
  const base = getAppUrl();
  return `
1. Jelentkezz be: ${base}/login
2. Nyisd meg a kurzust: ${base}/courses/${courseId}/learn
3. A bal oldali menüben kattints a „Dolgozatok” linkre (vagy közvetlenül: ${base}/courses/${courseId}/dolgozatok)
4. Válaszd ki a feladatot és töltsd fel a megoldást (fotó, PDF vagy Word).
`.trim();
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px">${body}<p style="margin-top:24px;font-size:12px;color:#666">365daysdarts — automatikus értesítés</p></body></html>`;
}

export function buildPublishedEmail(params: {
  studentName: string;
  courseTitle: string;
  dolgozatTitle: string;
  courseId: string;
  dolgozatId: string;
  deadlineAt?: Date | null;
  description?: string;
}) {
  const link = `${getAppUrl()}/courses/${params.courseId}/dolgozatok/${params.dolgozatId}`;
  const deadline = params.deadlineAt
    ? new Date(params.deadlineAt).toLocaleString("hu-HU")
    : "Nincs megadva";

  const text = `Kedves ${params.studentName}!

Új dolgozat érhető el a „${params.courseTitle}” kurzuson:

Cím: ${params.dolgozatTitle}
Határidő: ${deadline}
${params.description ? `\nLeírás: ${params.description}\n` : ""}

Hogyan éred el a dolgozatokat?
${accessSteps(params.courseId, params.dolgozatId)}

Közvetlen link: ${link}

Üdvözlettel,
365daysdarts`;

  const html = wrapHtml(`
<h2>Új dolgozat: ${params.dolgozatTitle}</h2>
<p>Kedves ${params.studentName}!</p>
<p>Új dolgozat érhető el a <strong>${params.courseTitle}</strong> kurzuson.</p>
<ul>
<li><strong>Határidő:</strong> ${deadline}</li>
</ul>
${params.description ? `<p>${params.description.replace(/\n/g, "<br>")}</p>` : ""}
<h3>Hogyan éred el?</h3>
<ol>
<li><a href="${getAppUrl()}/login">Jelentkezz be</a></li>
<li><a href="${getAppUrl()}/courses/${params.courseId}/learn">Nyisd meg a kurzust</a></li>
<li>A bal menüben: <strong>Dolgozatok</strong></li>
<li>Töltsd fel a megoldást (fotó, PDF vagy Word)</li>
</ol>
<p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#c9a227;color:#0a1628;text-decoration:none;border-radius:6px;font-weight:bold">Dolgozat megnyitása</a></p>
`);

  return {
    subject: `Új dolgozat: ${params.dolgozatTitle}`,
    html,
    text,
  };
}

export function buildGradedEmail(params: {
  studentName: string;
  dolgozatTitle: string;
  courseId: string;
  dolgozatId: string;
  points: number;
  maxPoints: number;
  feedback?: string;
}) {
  const link = `${getAppUrl()}/courses/${params.courseId}/dolgozatok/${params.dolgozatId}`;

  const text = `Kedves ${params.studentName}!

Értékelve lett a „${params.dolgozatTitle}” dolgozatod.

Pontszám: ${params.points} / ${params.maxPoints}
${params.feedback ? `\nVisszajelzés: ${params.feedback}\n` : ""}

Eredmény megtekintése: ${link}

Üdvözlettel,
365daysdarts`;

  const html = wrapHtml(`
<h2>Értékelés: ${params.dolgozatTitle}</h2>
<p>Kedves ${params.studentName}!</p>
<p><strong>Pontszám:</strong> ${params.points} / ${params.maxPoints}</p>
${params.feedback ? `<p><strong>Visszajelzés:</strong><br>${params.feedback.replace(/\n/g, "<br>")}</p>` : ""}
<p><a href="${link}">Eredmény megtekintése</a></p>
`);

  return {
    subject: `Értékelve: ${params.dolgozatTitle} — ${params.points}/${params.maxPoints} pont`,
    html,
    text,
  };
}

export function buildDeadlineReminderEmail(params: {
  studentName: string;
  courseTitle: string;
  dolgozatTitle: string;
  courseId: string;
  dolgozatId: string;
  deadlineAt: Date;
}) {
  const link = `${getAppUrl()}/courses/${params.courseId}/dolgozatok/${params.dolgozatId}`;
  const deadline = new Date(params.deadlineAt).toLocaleString("hu-HU");

  const text = `Kedves ${params.studentName}!

Emlékeztető: a „${params.dolgozatTitle}” dolgozat határideje közeledik (${deadline}).

Még nem adtad be a feladatot a „${params.courseTitle}” kurzuson.

Hogyan éred el a dolgozatokat?
${accessSteps(params.courseId, params.dolgozatId)}

Közvetlen link: ${link}

Üdvözlettel,
365daysdarts`;

  const html = wrapHtml(`
<h2>Határidő emlékeztető</h2>
<p>Kedves ${params.studentName}!</p>
<p>A <strong>${params.dolgozatTitle}</strong> dolgozat határideje: <strong>${deadline}</strong></p>
<p>Még nem adtad be a feladatot.</p>
<h3>Hogyan éred el?</h3>
<ol>
<li><a href="${getAppUrl()}/login">Jelentkezz be</a></li>
<li><a href="${getAppUrl()}/courses/${params.courseId}/learn">Kurzus megnyitása</a></li>
<li>Bal menü: <strong>Dolgozatok</strong></li>
</ol>
<p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#c9a227;color:#0a1628;text-decoration:none;border-radius:6px;font-weight:bold">Beadás most</a></p>
`);

  return {
    subject: `Emlékeztető: ${params.dolgozatTitle} — határidő ${deadline}`,
    html,
    text,
  };
}
