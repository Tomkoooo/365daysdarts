"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCmsEdit } from "@/features/cms-editor/context/CmsEditContext";
import { EditableText } from "@/features/cms-editor/primitives/EditableText";
import { EditableLink } from "@/features/cms-editor/primitives/EditableLink";
import { EditableImage } from "@/features/cms-editor/primitives/EditableImage";
import { EditableRichText } from "@/features/cms-editor/primitives/EditableRichText";
import { DynamicLucideIcon, IconPicker } from "@/features/cms-editor/primitives/IconPicker";

type BlockRecord = {
  blockId: string;
  type: string;
  order: number;
  payload: any;
};

interface MarketingBlockRendererProps {
  blocks: BlockRecord[];
  compact?: boolean;
  editMode?: boolean;
}

export function MarketingBlockRenderer({
  blocks,
  compact = false,
  editMode = false,
}: MarketingBlockRendererProps) {
  const cms = useCmsEdit();
  const editing = editMode || cms.enabled;

  return (
    <div className={`flex flex-col ${compact ? "" : "min-h-screen"}`}>
      {blocks.map((block) => {
        const key = block.blockId;
        if (block.type === "hero") {
          return <HeroBlock key={key} blockId={block.blockId} payload={block.payload} editing={editing} />;
        }
        if (block.type === "featureCards") {
          return <FeatureCardsBlock key={key} blockId={block.blockId} payload={block.payload} editing={editing} />;
        }
        if (block.type === "richText") {
          return <RichTextBlock key={key} blockId={block.blockId} payload={block.payload} editing={editing} />;
        }
        if (block.type === "accordion") {
          return <AccordionBlock key={key} blockId={block.blockId} payload={block.payload} editing={editing} />;
        }
        if (block.type === "media") {
          return <MediaBlock key={key} blockId={block.blockId} payload={block.payload} editing={editing} />;
        }
        if (block.type === "cta") {
          return <CtaBlock key={key} blockId={block.blockId} payload={block.payload} editing={editing} />;
        }
        if (block.type === "buttonRow") {
          return <ButtonRowBlock key={key} blockId={block.blockId} payload={block.payload} editing={editing} />;
        }
        if (block.type === "peopleGrid") {
          return <PeopleGridBlock key={key} blockId={block.blockId} payload={block.payload} editing={editing} />;
        }
        if (block.type === "container") {
          return <ContainerBlock key={key} blockId={block.blockId} payload={block.payload} editing={editing} />;
        }
        if (block.type === "card") {
          return <CardBlock key={key} blockId={block.blockId} payload={block.payload} editing={editing} />;
        }
        if (block.type === "form") {
          return <FormBlock key={key} blockId={block.blockId} payload={block.payload} editing={editing} />;
        }
        return null;
      })}
    </div>
  );
}

function HeroBlock({ blockId, payload, editing }: { blockId: string; payload: any; editing: boolean }) {
  const cms = useCmsEdit();

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden bg-navy-darker">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl space-y-6">
          {(payload.badge || editing) && (
            <span className="inline-flex rounded-full border border-cta/30 bg-cta/10 px-3 py-1 text-sm text-cta">
              <EditableText blockId={blockId} field="badge" value={payload.badge || ""} placeholder="Badge" />
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            <EditableText blockId={blockId} field="title" value={payload.title || ""} placeholder="Cím" className="text-white bg-transparent" />
            {payload.highlight || editing ? (
              <span className="text-cta">
                {" "}
                <EditableText blockId={blockId} field="highlight" value={payload.highlight || ""} placeholder="Kiemelés" className="text-cta bg-transparent" />
              </span>
            ) : null}
          </h1>
          {(payload.description || editing) && (
            <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
              <EditableText blockId={blockId} field="description" value={payload.description || ""} multiline placeholder="Leírás" className="text-gray-300 bg-transparent" />
            </p>
          )}
          {Array.isArray(payload.links) && payload.links.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 pt-3 flex-wrap">
              {payload.links.map((link: any, index: number) => (
                <EditableLink
                  key={`${link.href}-${index}`}
                  blockId={blockId}
                  labelField={`links.${index}.label`}
                  hrefField={`links.${index}.href`}
                  label={link.label}
                  href={link.href}
                  icon={link.icon}
                  buttonVariant={index === 0 ? "default" : "secondary"}
                  buttonClassName={index === 0 ? "bg-cta hover:bg-cta-hover text-white text-lg h-12 px-8" : "bg-white text-navy hover:bg-gray-100 text-lg h-12 px-8 font-bold"}
                  onCommitLabel={(value) => {
                    const links = [...(payload.links || [])];
                    links[index] = { ...links[index], label: value };
                    cms.patchBlock(blockId, { links });
                  }}
                  onCommitHref={(value) => {
                    const links = [...(payload.links || [])];
                    links[index] = { ...links[index], href: value };
                    cms.patchBlock(blockId, { links });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-navy-lighter/20 to-transparent pointer-events-none" />
    </section>
  );
}

function FeatureCardsBlock({ blockId, payload, editing }: { blockId: string; payload: any; editing: boolean }) {
  const cms = useCmsEdit();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          {(payload.title || editing) && (
            <h2 className="text-3xl font-bold">
              <EditableText blockId={blockId} field="title" value={payload.title || ""} placeholder="Szekció cím" />
            </h2>
          )}
          {(payload.description || editing) && (
            <p className="text-muted-foreground">
              <EditableText blockId={blockId} field="description" value={payload.description || ""} multiline placeholder="Leírás" />
            </p>
          )}
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {(payload.cards || []).map((card: any, idx: number) => (
            <Card key={`${card.title}-${idx}`} className="bg-navy border-navy-lighter hover:border-cta/50 transition-colors">
              <CardHeader className="space-y-3">
                {editing ? (
                  <IconPicker
                    value={card.icon}
                    triggerLabel="Ikon"
                    onChange={(icon) => {
                      const cards = [...(payload.cards || [])];
                      cards[idx] = { ...cards[idx], icon };
                      cms.patchBlock(blockId, { cards });
                    }}
                  />
                ) : card.icon ? (
                  <DynamicLucideIcon name={card.icon} className="w-6 h-6 text-cta" />
                ) : null}
                <CardTitle className="text-white">
                  <EditableText
                    blockId={blockId}
                    field={`cards.${idx}.title`}
                    value={card.title || ""}
                    placeholder="Kártya cím"
                    className="text-white bg-transparent"
                    onCommit={(value) => {
                      const cards = [...(payload.cards || [])];
                      cards[idx] = { ...cards[idx], title: value };
                      cms.patchBlock(blockId, { cards });
                    }}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400 space-y-4">
                <EditableText
                  blockId={blockId}
                  field={`cards.${idx}.description`}
                  value={card.description || ""}
                  multiline
                  placeholder="Leírás"
                  className="text-gray-400 bg-transparent"
                  onCommit={(value) => {
                    const cards = [...(payload.cards || [])];
                    cards[idx] = { ...cards[idx], description: value };
                    cms.patchBlock(blockId, { cards });
                  }}
                />
                {card.buttonLabel && card.buttonHref && (
                  <Button asChild variant="outline" className="mt-4">
                    <Link href={card.buttonHref}>{card.buttonLabel}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function RichTextBlock({ blockId, payload, editing }: { blockId: string; payload: any; editing: boolean }) {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        {(payload.title || editing) && (
          <h2 className="text-3xl font-bold mb-6">
            <EditableText blockId={blockId} field="title" value={payload.title || ""} placeholder="Cím" />
          </h2>
        )}
        {editing ? (
          <EditableRichText blockId={blockId} field="html" value={payload.html || ""} />
        ) : (
          <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: payload.html || "" }} />
        )}
      </div>
    </section>
  );
}

function AccordionBlock({ blockId, payload, editing }: { blockId: string; payload: any; editing: boolean }) {
  const cms = useCmsEdit();

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        {(payload.title || editing) && (
          <h2 className="text-3xl font-bold mb-6">
            <EditableText blockId={blockId} field="title" value={payload.title || ""} placeholder="Cím" />
          </h2>
        )}
        <Accordion type="single" collapsible className="w-full">
          {(payload.items || []).map((item: any, idx: number) => (
            <AccordionItem key={`${item.title}-${idx}`} value={`item-${idx}`}>
              <AccordionTrigger>
                <EditableText
                  blockId={blockId}
                  field={`items.${idx}.title`}
                  value={item.title || ""}
                  placeholder="Kérdés"
                  onCommit={(value) => {
                    const items = [...(payload.items || [])];
                    items[idx] = { ...items[idx], title: value };
                    cms.patchBlock(blockId, { items });
                  }}
                />
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <EditableText
                    blockId={blockId}
                    field={`items.${idx}.content`}
                    value={item.content || ""}
                    multiline
                    placeholder="Válasz"
                    onCommit={(value) => {
                      const items = [...(payload.items || [])];
                      items[idx] = { ...items[idx], content: value };
                      cms.patchBlock(blockId, { items });
                    }}
                  />
                  {item.mediaUrl || editing ? (
                    item.mediaType === "video" && item.mediaUrl ? (
                      <video src={item.mediaUrl} controls className="w-full rounded-lg border" />
                    ) : (
                      <EditableImage
                        src={item.mediaUrl || ""}
                        alt={item.mediaAlt || item.title || "Accordion media"}
                        editMode={editing}
                        className="w-full rounded-lg border object-contain max-h-[400px]"
                        onChange={(url) => {
                          const items = [...(payload.items || [])];
                          items[idx] = { ...items[idx], mediaUrl: url, mediaType: "image" };
                          cms.patchBlock(blockId, { items });
                        }}
                      />
                    )
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function MediaBlock({ blockId, payload, editing }: { blockId: string; payload: any; editing: boolean }) {
  const cms = useCmsEdit();

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        {(payload.title || editing) && (
          <h2 className="text-3xl font-bold mb-6">
            <EditableText blockId={blockId} field="title" value={payload.title || ""} placeholder="Cím" />
          </h2>
        )}
        <div className="rounded-lg overflow-hidden border bg-card">
          {payload.mediaType === "video" && payload.url ? (
            <video src={payload.url} controls className="w-full max-h-[560px]" />
          ) : (
            <EditableImage
              src={payload.url || ""}
              alt={payload.alt || "Media"}
              editMode={editing}
              className="w-full max-h-[560px] object-contain"
              onChange={(url) => cms.updateField(blockId, "url", url)}
              flexibleCrop
            />
          )}
        </div>
        {(payload.caption || editing) && (
          <p className="text-sm text-muted-foreground mt-3">
            <EditableText blockId={blockId} field="caption" value={payload.caption || ""} placeholder="Felirat" />
          </p>
        )}
      </div>
    </section>
  );
}

function CtaBlock({ blockId, payload, editing }: { blockId: string; payload: any; editing: boolean }) {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 text-center">
        <div className="bg-linear-to-r from-navy to-navy-lighter rounded-2xl p-12 border border-navy-lighter shadow-2xl">
          {(payload.title || editing) && (
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              <EditableText blockId={blockId} field="title" value={payload.title || ""} placeholder="Cím" className="text-white bg-transparent" />
            </h2>
          )}
          {(payload.description || editing) && (
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mt-4">
              <EditableText blockId={blockId} field="description" value={payload.description || ""} multiline placeholder="Leírás" className="text-gray-300 bg-transparent" />
            </p>
          )}
          <div className="mt-8">
            <EditableLink
              blockId={blockId}
              labelField="buttonLabel"
              hrefField="buttonHref"
              label={payload.buttonLabel || "Learn more"}
              href={payload.buttonHref || "/"}
              buttonClassName="bg-white text-navy hover:bg-gray-100 font-bold h-12 px-8"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ButtonRowBlock({ blockId, payload, editing }: { blockId: string; payload: any; editing: boolean }) {
  const cms = useCmsEdit();

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 text-center">
        {(payload.title || editing) && (
          <h3 className="text-2xl font-bold mb-6">
            <EditableText blockId={blockId} field="title" value={payload.title || ""} placeholder="Cím" />
          </h3>
        )}
        <div className="flex gap-3 justify-center flex-wrap">
          {(payload.buttons || []).map((button: any, idx: number) => (
            <EditableLink
              key={`${button.href}-${idx}`}
              blockId={blockId}
              labelField={`buttons.${idx}.label`}
              hrefField={`buttons.${idx}.href`}
              label={button.label}
              href={button.href}
              icon={button.icon}
              onCommitLabel={(value) => {
                const buttons = [...(payload.buttons || [])];
                buttons[idx] = { ...buttons[idx], label: value };
                cms.patchBlock(blockId, { buttons });
              }}
              onCommitHref={(value) => {
                const buttons = [...(payload.buttons || [])];
                buttons[idx] = { ...buttons[idx], href: value };
                cms.patchBlock(blockId, { buttons });
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PeopleGridBlock({ blockId, payload, editing }: { blockId: string; payload: any; editing: boolean }) {
  const cms = useCmsEdit();
  const cols = payload.columns === "2" ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {(payload.title || editing) && (
          <h2 className="text-3xl font-bold text-center mb-3">
            <EditableText blockId={blockId} field="title" value={payload.title || ""} placeholder="Cím" />
          </h2>
        )}
        {(payload.description || editing) && (
          <p className="text-muted-foreground text-center mb-10 max-w-3xl mx-auto">
            <EditableText blockId={blockId} field="description" value={payload.description || ""} multiline placeholder="Leírás" />
          </p>
        )}
        <div className={`grid ${cols} gap-8`}>
          {(payload.people || []).map((person: any, idx: number) => (
            <Card key={`${person.name}-${idx}`} className="bg-navy border-navy-lighter overflow-hidden">
              <div className="h-64 bg-navy-lighter w-full relative shrink-0 overflow-hidden">
                <EditableImage
                  src={person.imageUrl || ""}
                  alt={person.name || "Person"}
                  editMode={editing}
                  fillContainer
                  className="object-contain object-center w-full h-full"
                  width={400}
                  height={400}
                  onChange={(url) => {
                    const people = [...(payload.people || [])];
                    people[idx] = { ...people[idx], imageUrl: url };
                    cms.patchBlock(blockId, { people });
                  }}
                />
              </div>
              <CardContent className="p-6 space-y-2">
                <h3 className="text-xl font-bold text-white mb-1">
                  <EditableText
                    blockId={blockId}
                    field={`people.${idx}.name`}
                    value={person.name || ""}
                    placeholder="Név"
                    className="text-white bg-transparent"
                    onCommit={(value) => {
                      const people = [...(payload.people || [])];
                      people[idx] = { ...people[idx], name: value };
                      cms.patchBlock(blockId, { people });
                    }}
                  />
                </h3>
                {(person.role || editing) && (
                  <p className="text-cta text-sm font-medium mb-4">
                    <EditableText
                      blockId={blockId}
                      field={`people.${idx}.role`}
                      value={person.role || ""}
                      placeholder="Szerepkör"
                      className="text-cta bg-transparent"
                      onCommit={(value) => {
                        const people = [...(payload.people || [])];
                        people[idx] = { ...people[idx], role: value };
                        cms.patchBlock(blockId, { people });
                      }}
                    />
                  </p>
                )}
                {(person.bio || editing) && (
                  <p className="text-gray-400 text-sm leading-relaxed">
                    <EditableText
                      blockId={blockId}
                      field={`people.${idx}.bio`}
                      value={person.bio || ""}
                      multiline
                      placeholder="Bio"
                      className="text-gray-400 bg-transparent"
                      onCommit={(value) => {
                        const people = [...(payload.people || [])];
                        people[idx] = { ...people[idx], bio: value };
                        cms.patchBlock(blockId, { people });
                      }}
                    />
                  </p>
                )}
                {person.buttonLabel && person.buttonHref && (
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href={person.buttonHref}>{person.buttonLabel}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const maxWidthClass: Record<string, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  full: "max-w-full",
};

const paddingClass: Record<string, string> = {
  none: "py-0",
  sm: "py-8",
  md: "py-16",
  lg: "py-24",
};

const bgClass: Record<string, string> = {
  default: "bg-background",
  muted: "bg-muted/20",
  navy: "bg-navy-darker",
};

function ContainerBlock({ blockId, payload, editing }: { blockId: string; payload: any; editing: boolean }) {
  return (
    <section className={`${paddingClass[payload.padding] || "py-16"} ${bgClass[payload.background] || "bg-background"}`}>
      <div className={`container mx-auto px-4 ${maxWidthClass[payload.maxWidth] || "max-w-screen-lg"}`}>
        {(payload.title || editing) && (
          <h2 className="text-3xl font-bold mb-6">
            <EditableText blockId={blockId} field="title" value={payload.title || ""} placeholder="Cím" />
          </h2>
        )}
        {editing ? (
          <EditableRichText blockId={blockId} field="html" value={payload.html || ""} />
        ) : (
          <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: payload.html || "" }} />
        )}
      </div>
    </section>
  );
}

function CardBlock({ blockId, payload, editing }: { blockId: string; payload: any; editing: boolean }) {
  const cms = useCmsEdit();
  const variantClass =
    payload.variant === "featured"
      ? "border-cta/50 bg-navy"
      : payload.variant === "outline"
        ? "border-dashed"
        : "bg-card";

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className={variantClass}>
          {(payload.imageUrl || editing) && (
            <EditableImage
              src={payload.imageUrl || ""}
              alt={payload.imageAlt || payload.title || "Card image"}
              editMode={editing}
              className="w-full h-48 object-cover rounded-t-lg"
              onChange={(url) => cms.updateField(blockId, "imageUrl", url)}
            />
          )}
          <CardHeader>
            <CardTitle>
              <EditableText blockId={blockId} field="title" value={payload.title || ""} placeholder="Kártya cím" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(payload.description || editing) && (
              <p className="text-muted-foreground">
                <EditableText blockId={blockId} field="description" value={payload.description || ""} multiline placeholder="Leírás" />
              </p>
            )}
            {(payload.buttonLabel || editing) && (
              <EditableLink
                blockId={blockId}
                labelField="buttonLabel"
                hrefField="buttonHref"
                label={payload.buttonLabel || "Gomb"}
                href={payload.buttonHref || "/"}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function FormBlock({ blockId, payload, editing }: { blockId: string; payload: any; editing: boolean }) {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-xl">
        {(payload.title || editing) && (
          <h2 className="text-3xl font-bold mb-2">
            <EditableText blockId={blockId} field="title" value={payload.title || ""} placeholder="Cím" />
          </h2>
        )}
        {(payload.description || editing) && (
          <p className="text-muted-foreground mb-6">
            <EditableText blockId={blockId} field="description" value={payload.description || ""} multiline placeholder="Leírás" />
          </p>
        )}
        <Card>
          <CardContent className="pt-6">
            <form
              action={payload.actionUrl || undefined}
              method={payload.actionUrl ? "post" : undefined}
              className="space-y-4"
              onSubmit={
                payload.actionUrl
                  ? undefined
                  : (e) => {
                      e.preventDefault();
                      alert(payload.successMessage || "Thank you!");
                    }
              }
            >
              {(payload.fields || []).map((field: any) => (
                <div key={field.name} className="space-y-1">
                  <label className="text-sm font-medium" htmlFor={field.name}>
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      placeholder={field.placeholder}
                      className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type || "text"}
                      required={field.required}
                      placeholder={field.placeholder}
                      className="w-full h-10 rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  )}
                </div>
              ))}
              <Button type="submit">
                {editing ? (
                  <EditableText blockId={blockId} field="submitLabel" value={payload.submitLabel || "Submit"} placeholder="Küldés gomb" />
                ) : (
                  payload.submitLabel || "Submit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
