"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { ImageCarousel } from "@/components/ImageCarousel";
import { SafeImage } from "@/components/SafeImage";
import {
  findVariant,
  hasVariants,
  uniqueSizes,
  uniqueStyles,
  variantLabel,
} from "@/lib/product-variants";
import {
  buildTortaCartLabel,
  buildTortaVariantId,
  calcTortaTotal,
  DEFAULT_TORTA_SIZES,
  getTortaFlavors,
  getTortaRates,
  isDocinhosProduct,
  isTortasProduct,
  resolveTortaRatePerKg,
  TORTA_CHOCOLATE_EXTRA_PER_KG,
  TORTA_MAX_FLAVORS,
  type TortaFlavorOption,
  type TortaMassa,
} from "@/lib/product-kind";
import { productGallery } from "@/lib/product-images";
import {
  formatQuantity,
  formatRate,
  isSoldByKg,
  minQuantity,
  normalizeQuantity,
  parseSoldBy,
  quantityStep,
} from "@/lib/sold-by";
import { buildWhatsAppLink, formatPrice } from "@/lib/whatsapp";
import type { Product, TortaSizeOption } from "@/lib/types";

type Props = {
  product: Product;
  whatsapp: string;
  tortaSizes?: TortaSizeOption[];
};

function TortaDetail({
  product,
  whatsapp,
  tortaSizes = DEFAULT_TORTA_SIZES,
}: Props) {
  const sizes =
    tortaSizes && tortaSizes.length > 0 ? tortaSizes : DEFAULT_TORTA_SIZES;
  const rates = getTortaRates(product);
  const groups = getTortaFlavors(product);
  const [size, setSize] = useState<TortaSizeOption>(sizes[0]);
  const [massa, setMassa] = useState<TortaMassa>("tradicional");
  const [selected, setSelected] = useState<TortaFlavorOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const sizesKey = sizes
    .map((option) => `${option.cm}:${option.kg}:${option.fatias}`)
    .join("|");

  useEffect(() => {
    setSize((current) => {
      const stillExists = sizes.some((option) => option.cm === current.cm);
      return stillExists ? current : sizes[0];
    });
    // sizesKey captura mudanças reais da lista
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizesKey]);

  const ratePerKg = resolveTortaRatePerKg(rates, selected);
  const unitPrice = calcTortaTotal({
    kg: size.kg,
    ratePerKg,
    chocolate: massa === "chocolate",
  });
  const gallery = productGallery(product);
  const image = gallery[0] || product.image;
  const displayName = buildTortaCartLabel({
    productName: product.name,
    size,
    massa,
    flavors: selected,
  });
  const canAdd = selected.length >= 1 && selected.length <= TORTA_MAX_FLAVORS;

  const link = useMemo(
    () =>
      buildWhatsAppLink(
        whatsapp,
        { name: displayName, price: unitPrice, soldBy: "unit" },
        quantity
      ),
    [whatsapp, displayName, unitPrice, quantity]
  );

  function toggleFlavor(flavor: TortaFlavorOption) {
    setSelected((current) => {
      const exists = current.some((entry) => entry.id === flavor.id);
      if (exists) return current.filter((entry) => entry.id !== flavor.id);
      if (current.length >= TORTA_MAX_FLAVORS) {
        return [...current.slice(1), flavor];
      }
      return [...current, flavor];
    });
  }

  function renderFlavorGroup(
    title: string,
    priceHint: string,
    flavors: TortaFlavorOption[]
  ) {
    if (flavors.length === 0) return null;
    return (
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-espresso">{title}</p>
          <p className="text-xs text-espresso/60">{priceHint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {flavors.map((flavor) => {
            const active = selected.some((entry) => entry.id === flavor.id);
            return (
              <button
                key={flavor.id}
                type="button"
                className={`rounded-full border px-4 py-2 text-sm ${
                  active
                    ? "border-mocha bg-mocha text-foam"
                    : "border-cappuccino bg-white/70 text-espresso"
                }`}
                onClick={() => toggleFlavor(flavor)}
              >
                {flavor.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.8rem] bg-cappuccino/30">
        <ImageCarousel
          images={gallery.length > 0 ? gallery : image ? [image] : []}
          alt={displayName}
          sizes="(max-width:768px) 100vw, 50vw"
          priority
        />
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mocha">
            {product.category}
          </p>
          <h1 className="mt-2 font-display text-4xl text-espresso md:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-espresso/75">
            {product.description}
          </p>
        </div>

        <div className="space-y-5 rounded-[1.5rem] border border-cappuccino/60 bg-foam/70 p-5 shadow-[0_16px_40px_rgba(59,42,34,0.08)] backdrop-blur-sm md:p-6">
          <div>
            <p className="text-sm text-mocha">Valor estimado da torta</p>
            <p className="font-display text-3xl text-espresso">
              {formatPrice(unitPrice)}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-espresso/70">
              O valor final da torta dependerá da decoração escolhida. Ao
              finalizar a escolha do sabor, kg e massa, aperte em{" "}
              <strong className="text-espresso">“Pedir no WhatsApp”</strong> e
              envie a referência da decoração da torta.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-espresso">
              Circunferência
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((option) => (
                <button
                  key={option.cm}
                  type="button"
                  className={`rounded-full border px-4 py-2 text-left text-sm ${
                    size.cm === option.cm
                      ? "border-mocha bg-mocha text-foam"
                      : "border-cappuccino bg-white/70 text-espresso"
                  }`}
                  onClick={() => setSize(option)}
                >
                  <span className="block font-medium">{option.cm} cm</span>
                  <span className="block text-xs opacity-80">
                    {option.kg.toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    kg · {option.fatias} fatias
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-espresso">Massa</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "tradicional" as const, label: "Tradicional" },
                  {
                    id: "chocolate" as const,
                    label: `Chocolate (+${formatPrice(TORTA_CHOCOLATE_EXTRA_PER_KG)}/kg)`,
                  },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`rounded-full border px-4 py-2 text-sm ${
                    massa === option.id
                      ? "border-mocha bg-mocha text-foam"
                      : "border-cappuccino bg-white/70 text-espresso"
                  }`}
                  onClick={() => setMassa(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-espresso">
              Sabores (até {TORTA_MAX_FLAVORS})
            </p>
            {renderFlavorGroup(
              "Tradicionais",
              `${formatPrice(rates.traditional)}/kg`,
              groups.traditional
            )}
            {renderFlavorGroup(
              "Especiais",
              `${formatPrice(rates.special)}/kg`,
              groups.special
            )}
            {selected.length === 0 ? (
              <p className="text-xs text-espresso/60">
                Escolha 1 ou 2 sabores.
              </p>
            ) : (
              <p className="text-xs text-espresso/60">
                Selecionados: {selected.map((f) => f.name).join(" + ")}
              </p>
            )}
          </div>

          <label className="block space-y-2 text-sm font-medium text-espresso">
            Quantidade de tortas
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="h-10 w-10 rounded-full border border-cappuccino bg-white/70 text-lg"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir"
              >
                −
              </button>
              <span className="min-w-8 text-center text-lg font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                className="h-10 w-10 rounded-full border border-cappuccino bg-white/70 text-lg"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar"
              >
                +
              </button>
            </div>
          </label>

          <button
            type="button"
            className="btn-primary w-full"
            disabled={!canAdd}
            onClick={() =>
              addItem(
                {
                  productId: product.id,
                  variantId: buildTortaVariantId({
                    cm: size.cm,
                    massa,
                    flavorIds: selected.map((flavor) => flavor.id),
                  }),
                  name: displayName,
                  price: unitPrice,
                  image,
                  soldBy: "unit",
                  kind: "tortas",
                },
                quantity
              )
            }
          >
            Adicionar ao pedido
          </button>

          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-ghost w-full ${!canAdd ? "pointer-events-none opacity-50" : ""}`}
            aria-disabled={!canAdd}
          >
            Pedir só este no WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}

function DefaultProductDetail({ product, whatsapp }: Props) {
  const variantsEnabled = hasVariants(product);
  const docinhos = isDocinhosProduct(product);
  const kind = docinhos ? "docinhos" : product.kind;
  const soldBy = parseSoldBy(product.soldBy);
  const byKg = isSoldByKg(soldBy);
  const step = quantityStep(soldBy, kind);
  const sizes = uniqueSizes(product);
  const styles = uniqueStyles(product);
  const [size, setSize] = useState(sizes[0] || "");
  const [style, setStyle] = useState(styles[0] || "");
  const [quantity, setQuantity] = useState(minQuantity(soldBy, kind));
  const { addItem } = useCart();

  const selectedVariant = useMemo(() => {
    if (!variantsEnabled) return null;
    return findVariant(product, size, style) || product.variants?.[0] || null;
  }, [variantsEnabled, product, size, style]);

  const unitPrice = selectedVariant?.price ?? product.price;
  const image = selectedVariant?.image ?? product.image;
  const displayName = selectedVariant
    ? docinhos
      ? `${product.name} (${selectedVariant.style})`
      : `${product.name} (${variantLabel(selectedVariant)})`
    : product.name;

  const availableStylesForSize = useMemo(() => {
    if (!variantsEnabled) return styles;
    if (docinhos) return styles;
    return styles.filter((entry) => findVariant(product, size, entry));
  }, [variantsEnabled, styles, product, size, docinhos]);

  const link = useMemo(
    () =>
      buildWhatsAppLink(
        whatsapp,
        { name: displayName, price: unitPrice, soldBy },
        quantity
      ),
    [whatsapp, displayName, unitPrice, soldBy, quantity]
  );

  function selectSize(nextSize: string) {
    setSize(nextSize);
    const nextStyles = styles.filter((styleOption) =>
      findVariant(product, nextSize, styleOption)
    );
    if (!nextStyles.includes(style)) {
      setStyle(nextStyles[0] || "");
    }
  }

  function selectFlavor(nextStyle: string) {
    setStyle(nextStyle);
    if (docinhos) {
      const match = (product.variants || []).find(
        (variant) => variant.style === nextStyle
      );
      if (match) setSize(match.size);
    }
  }

  function bumpQuantity(delta: number) {
    setQuantity((q) => normalizeQuantity(q + delta, soldBy, kind));
  }

  return (
    <>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.8rem] bg-cappuccino/30">
        <SafeImage
          src={image}
          alt={displayName}
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 50vw"
          priority
        />
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mocha">
            {product.category}
          </p>
          <h1 className="mt-2 font-display text-4xl text-espresso md:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-espresso/75">
            {product.description}
          </p>
        </div>

        <div className="space-y-5 rounded-[1.5rem] border border-cappuccino/60 bg-foam/70 p-5 shadow-[0_16px_40px_rgba(59,42,34,0.08)] backdrop-blur-sm md:p-6">
          <div>
            <p className="text-sm text-mocha">
              {byKg
                ? "Valor por kg"
                : docinhos
                  ? "Valor por unidade"
                  : "Valor unitário"}
            </p>
            <p className="font-display text-3xl text-espresso">
              {formatRate(unitPrice, soldBy, formatPrice)}
            </p>
          </div>

          {variantsEnabled ? (
            <div className="space-y-4">
              {!docinhos ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-espresso">Tamanho</p>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((entry) => (
                      <button
                        key={entry}
                        type="button"
                        className={`rounded-full border px-4 py-2 text-sm ${
                          size === entry
                            ? "border-mocha bg-mocha text-foam"
                            : "border-cappuccino bg-white/70 text-espresso"
                        }`}
                        onClick={() => selectSize(entry)}
                      >
                        {entry}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <p className="text-sm font-medium text-espresso">
                  {docinhos ? "Sabor" : "Estilo"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableStylesForSize.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-sm ${
                        style === entry
                          ? "border-mocha bg-mocha text-foam"
                          : "border-cappuccino bg-white/70 text-espresso"
                      }`}
                      onClick={() =>
                        docinhos ? selectFlavor(entry) : setStyle(entry)
                      }
                    >
                      {entry}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <label className="block space-y-2 text-sm font-medium text-espresso">
            {byKg
              ? "Peso (kg) — mín. 1"
              : docinhos
                ? "Quantidade (mín. 25)"
                : "Quantidade"}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="h-10 w-10 rounded-full border border-cappuccino bg-white/70 text-lg"
                onClick={() => bumpQuantity(-step)}
                aria-label="Diminuir"
              >
                −
              </button>
              {byKg ? (
                <input
                  className="field !w-24 !text-center !text-lg !font-semibold"
                  type="number"
                  min={1}
                  step={0.5}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      normalizeQuantity(
                        Number(e.target.value) || 1,
                        soldBy,
                        kind
                      )
                    )
                  }
                />
              ) : (
                <span className="min-w-8 text-center text-lg font-semibold">
                  {quantity}
                </span>
              )}
              <button
                type="button"
                className="h-10 w-10 rounded-full border border-cappuccino bg-white/70 text-lg"
                onClick={() => bumpQuantity(step)}
                aria-label="Aumentar"
              >
                +
              </button>
            </div>
            {docinhos ? (
              <p className="text-xs font-normal text-espresso/60">
                Pedido mínimo de 25 unidades, de 5 em 5.
              </p>
            ) : null}
            {byKg ? (
              <p className="text-xs font-normal text-espresso/60">
                Pedido mínimo de 1 kg, de 0,5 em 0,5 kg.
              </p>
            ) : null}
          </label>

          <p className="text-sm text-espresso/70">
            Total estimado ({formatQuantity(quantity, soldBy, kind)}):{" "}
            <strong className="text-espresso">
              {formatPrice(unitPrice * quantity)}
            </strong>
          </p>

          <button
            type="button"
            className="btn-primary w-full"
            disabled={variantsEnabled && !selectedVariant}
            onClick={() =>
              addItem(
                {
                  productId: product.id,
                  variantId: selectedVariant?.id,
                  name: displayName,
                  price: unitPrice,
                  image,
                  soldBy,
                  kind: docinhos ? "docinhos" : undefined,
                },
                quantity
              )
            }
          >
            Adicionar ao pedido
          </button>

          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost w-full"
          >
            Pedir só este no WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}

export function ProductDetail({ product, whatsapp, tortaSizes }: Props) {
  if (isTortasProduct(product)) {
    return (
      <TortaDetail
        product={product}
        whatsapp={whatsapp}
        tortaSizes={tortaSizes}
      />
    );
  }
  return <DefaultProductDetail product={product} whatsapp={whatsapp} />;
}
