import type { CSSProperties } from "react";

type CompanyLogoProps = {
  company: {
    name?: string | null;
    shortName?: string | null;
    logo?: string | null;
    logoType?: string | null;
    logoText?: string | null;
    logoTextColor?: string | null;
    logoFontStyle?: string | null;
  };
  className?: string;
  fallbackSrc?: string;
};

export default function CompanyLogo({ company, className = "", fallbackSrc = "/upz-logo.svg" }: CompanyLogoProps) {
  const logoType = String(company.logoType || "image").toLowerCase();
  const text = company.logoText || company.shortName || company.name || "Company";

  if (logoType === "text" || (logoType !== "none" && !company.logo)) {
    const style: CSSProperties = {
      color: company.logoTextColor || "currentColor",
      fontFamily: company.logoFontStyle === "serif" ? "Georgia, 'Times New Roman', serif" : "inherit",
      fontWeight: company.logoFontStyle === "light" ? 400 : company.logoFontStyle === "condensed" ? 800 : 700,
      letterSpacing: company.logoFontStyle === "condensed" ? "-0.04em" : "-0.02em",
      lineHeight: 1,
      whiteSpace: "nowrap",
    };
    return <span className={`company-logo-text ${className}`.trim()} style={style} aria-label={`${company.name || text} logo`}>{text}</span>;
  }

  if (logoType === "none") return null;

  return <img className={className} src={company.logo || fallbackSrc} alt={`${company.name || text} logo`} />;
}
