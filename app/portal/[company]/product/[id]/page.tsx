"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import { findVariant, formatPrice, getCategory, getColorOptions, getSizeOptions } from "@/lib/catalog";

type PortalCompany = {
  slug: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
};

export default function PortalProductPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = Array.isArray(params?.company) ? params.company[0] : params?.company;
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [company, setCompany] = useState<PortalCompany | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!companySlug) return;

    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== companySlug) {
      router.push("/login");
      return;
    }

    setCompanyLoading(true);
    fetch(`/api/portal/companies/${companySlug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Portal not found");
        return res.json();
      })
      .then((data) => setCompany(data))
      .catch(() => setError(true))
      .finally(() => setCompanyLoading(false));
  }, [companySlug, router]);

  useEffect(() => {
    if (!company || !id) return;

    fetch(`/api/products/${id}?company=${company.slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        const firstVariant = data?.variants?.[0] || null;
        setProduct(data);
        setSelectedVariant(firstVariant);
        setSelectedColor(firstVariant?.color || null);
        setSelectedSize(firstVariant?.size || null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [company, id]);

  const colorOptions = useMemo(() => getColorOptions(product?.variants || []), [product]);
  const sizeOptions = useMemo(() => getSizeOptions(product?.variants || []), [product]);

  useEffect(() => {
    if (!product?.variants?.length) return;
    const nextVariant = findVariant({ variants: product.variants, color: selectedColor, size: selectedSize });
    if (nextVariant) {
      setSelectedVariant(nextVariant);
      setActiveImage(0);
    }
  }, [product, selectedColor, selectedSize]);

  const gallery = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set([...(selectedVariant?.images || []), ...(product.images || []), product.thumbnail, product.image].filter(Boolean)));
  }, [product, selectedVariant]);

  if (companyLoading) {
    return <main className="portal-page"><section className="portal-simple-state"><p>Loading portal...</p></section></main>;
  }

  if (!company) {
    return <main className="portal-page"><section className="portal-simple-state"><h1>Portal not found</h1><Link href="/login">Back to login</Link></section></main>;
  }

  if (loading) {
    return <main className="portal-page"><section className="portal-simple-state"><p>Loading product...</p></section></main>;
  }

  if (error || !product) {
    return <main className="portal-page"><section className="portal-simple-state"><Link href={`/portal/${company.slug}`}>Back to {company.shortName} Portal</Link><h1>Product not found</h1><p>This product may not be available in the {company.shortName} catalog.</p></section></main>;
  }

  return (
    <main className="portal-page" style={{ "--company-primary": company.primaryColor, "--company-secondary": company.secondaryColor } as React.CSSProperties}>
      <section className="portal-product-detail">
        <div className="upz-wrap portal-product-detail-grid">
          <div>
            <div className="portal-breadcrumb"><Link href={`/portal/${company.slug}`}>{company.shortName} Portal</Link> / <span>{product.name}</span></div>
            <div className="portal-product-gallery-main"><img src={gallery[activeImage] || "/placeholder.png"} alt={product.name} /></div>
            {gallery.length > 1 && <div className="portal-product-thumbs">{gallery.map((image: string, index: number) => <button key={`${image}-${index}`} className={activeImage === index ? "is-active" : ""} onClick={() => setActiveImage(index)}><img src={image} alt="" /></button>)}</div>}
          </div>

          <aside className="portal-product-info-panel">
            <div className="portal-eyebrow">{company.shortName} · {getCategory(product)}</div>
            <h1>{product.name}</h1>
            <strong className="portal-product-price">{formatPrice(selectedVariant?.price || product.price)}</strong>
            <p>{product.description || `${company.shortName} approved branded merchandise.`}</p>

            {colorOptions.length > 0 && <div className="portal-option-group"><h3>Color</h3><div>{colorOptions.map((color) => <button key={color} className={selectedColor === color ? "is-active" : ""} onClick={() => setSelectedColor(color)}>{color}</button>)}</div></div>}
            {sizeOptions.length > 0 && <div className="portal-option-group"><h3>Size</h3><div>{sizeOptions.map((size) => <button key={size} className={selectedSize === size ? "is-active" : ""} onClick={() => setSelectedSize(size)}>{size}</button>)}</div></div>}

            <AddToCartButton product={{ ...product, selectedVariant, companySlug: company.slug, companyName: company.name }} />
          </aside>
        </div>
      </section>
    </main>
  );
}
