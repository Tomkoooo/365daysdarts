"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MarketingBlockRendererProps {
  blocks: any[];
  compact?: boolean;
}

export function MarketingBlockRenderer({ blocks, compact = false }: MarketingBlockRendererProps) {
  return (
    <div className={`flex flex-col ${compact ? "" : "min-h-screen"}`}>
      {blocks.map((block) => {
        if (block.type === "hero") {
          return <HeroBlock key={block.blockId} payload={block.payload} />;
        }
        if (block.type === "featureCards") {
          return <FeatureCardsBlock key={block.blockId} payload={block.payload} />;
        }
        if (block.type === "richText") {
          return <RichTextBlock key={block.blockId} payload={block.payload} />;
        }
        if (block.type === "accordion") {
          return <AccordionBlock key={block.blockId} payload={block.payload} />;
        }
        if (block.type === "media") {
          return <MediaBlock key={block.blockId} payload={block.payload} />;
        }
        if (block.type === "cta") {
          return <CtaBlock key={block.blockId} payload={block.payload} />;
        }
        if (block.type === "buttonRow") {
          return <ButtonRowBlock key={block.blockId} payload={block.payload} />;
        }
        if (block.type === "peopleGrid") {
          return <PeopleGridBlock key={block.blockId} payload={block.payload} />;
        }
        return null;
      })}
    </div>
  );
}

function HeroBlock({ payload }: { payload: any }) {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden bg-navy-darker">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl space-y-6">
          {payload.badge && (
            <span className="inline-flex rounded-full border border-cta/30 bg-cta/10 px-3 py-1 text-sm text-cta">
              {payload.badge}
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            {payload.title}
            {payload.highlight ? <span className="text-cta"> {payload.highlight}</span> : null}
          </h1>
          {payload.description && <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">{payload.description}</p>}
          {Array.isArray(payload.links) && payload.links.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 pt-3 flex-wrap">
              {payload.links.map((link: any, index: number) => (
                <Button
                  key={`${link.href}-${index}`}
                  size="lg"
                  className={index === 0 ? "bg-cta hover:bg-cta-hover text-white text-lg h-12 px-8" : "bg-white text-navy hover:bg-gray-100 text-lg h-12 px-8 font-bold"}
                  asChild
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-navy-lighter/20 to-transparent pointer-events-none" />
    </section>
  );
}

function FeatureCardsBlock({ payload }: { payload: any }) {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          {payload.title && <h2 className="text-3xl font-bold">{payload.title}</h2>}
          {payload.description && <p className="text-muted-foreground">{payload.description}</p>}
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {(payload.cards || []).map((card: any, idx: number) => (
            <Card key={`${card.title}-${idx}`} className="bg-navy border-navy-lighter hover:border-cta/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-white">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                <p>{card.description}</p>
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

function RichTextBlock({ payload }: { payload: any }) {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        {payload.title && <h2 className="text-3xl font-bold mb-6">{payload.title}</h2>}
        <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: payload.html || "" }} />
      </div>
    </section>
  );
}

function AccordionBlock({ payload }: { payload: any }) {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        {payload.title && <h2 className="text-3xl font-bold mb-6">{payload.title}</h2>}
        <Accordion type="single" collapsible className="w-full">
          {(payload.items || []).map((item: any, idx: number) => (
            <AccordionItem key={`${item.title}-${idx}`} value={`item-${idx}`}>
              <AccordionTrigger>{item.title}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p>{item.content}</p>
                  {item.mediaUrl ? (
                    item.mediaType === "video" ? (
                      <video src={item.mediaUrl} controls className="w-full rounded-lg border" />
                    ) : (
                      <img
                        src={item.mediaUrl}
                        alt={item.mediaAlt || item.title || "Accordion media"}
                        className="w-full rounded-lg border object-contain"
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

function MediaBlock({ payload }: { payload: any }) {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        {payload.title && <h2 className="text-3xl font-bold mb-6">{payload.title}</h2>}
        <div className="rounded-lg overflow-hidden border bg-card">
          {payload.mediaType === "video" ? (
            <video src={payload.url} controls className="w-full max-h-[560px]" />
          ) : (
            <img src={payload.url} alt={payload.alt || "Media"} className="w-full max-h-[560px] object-contain" />
          )}
        </div>
        {payload.caption && <p className="text-sm text-muted-foreground mt-3">{payload.caption}</p>}
      </div>
    </section>
  );
}

function CtaBlock({ payload }: { payload: any }) {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 text-center">
        <div className="bg-linear-to-r from-navy to-navy-lighter rounded-2xl p-12 border border-navy-lighter shadow-2xl">
          {payload.title && <h2 className="text-3xl md:text-4xl font-bold text-white">{payload.title}</h2>}
          {payload.description && <p className="text-xl text-gray-300 max-w-2xl mx-auto mt-4">{payload.description}</p>}
          <Button size="lg" className="bg-white text-navy hover:bg-gray-100 font-bold mt-8" asChild>
            <Link href={payload.buttonHref || "/"}>{payload.buttonLabel || "Learn more"}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ButtonRowBlock({ payload }: { payload: any }) {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 text-center">
        {payload.title && <h3 className="text-2xl font-bold mb-6">{payload.title}</h3>}
        <div className="flex gap-3 justify-center flex-wrap">
          {(payload.buttons || []).map((button: any, idx: number) => (
            <Button key={`${button.href}-${idx}`} asChild>
              <Link href={button.href}>{button.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

function PeopleGridBlock({ payload }: { payload: any }) {
  const cols = payload.columns === "2" ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3";
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {payload.title && <h2 className="text-3xl font-bold text-center mb-3">{payload.title}</h2>}
        {payload.description && <p className="text-muted-foreground text-center mb-10 max-w-3xl mx-auto">{payload.description}</p>}
        <div className={`grid ${cols} gap-8`}>
          {(payload.people || []).map((person: any, idx: number) => (
            <Card key={`${person.name}-${idx}`} className="bg-navy border-navy-lighter overflow-hidden">
              <div className="h-64 bg-navy-lighter w-full relative shrink-0">
                {person.imageUrl ? (
                  <img src={person.imageUrl} alt={person.name || "Person"} className="object-contain object-center w-full h-full" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">Nincs foto</div>
                )}
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-1">{person.name}</h3>
                {person.role && <p className="text-cta text-sm font-medium mb-4">{person.role}</p>}
                {person.bio && <p className="text-gray-400 text-sm leading-relaxed">{person.bio}</p>}
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
