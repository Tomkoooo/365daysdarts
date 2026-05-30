export function themeTokensToCssVars(colors: Record<string, string>): React.CSSProperties {
  return {
    "--color-navy": colors.navy || "#031947",
    "--color-navy-darker": colors.navyDarker || "#020d2e",
    "--color-navy-lighter": colors.navyLighter || "#1a2f5e",
    "--color-cta": colors.cta || "#00aaff",
    "--color-cta-hover": colors.ctaHover || "#0088cc",
  } as React.CSSProperties;
}
