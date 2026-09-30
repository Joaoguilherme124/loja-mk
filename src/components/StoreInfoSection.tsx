type Props = {
  /** `page` = seção clara da home; `hero` = bloco no topo escuro do catálogo */
  variant?: "page" | "hero";
};

export function StoreInfoSection({ variant = "page" }: Props) {
  const isHero = variant === "hero";

  const title = isHero ? "text-foam" : "text-espresso";
  const body = isHero ? "text-foam/80" : "text-espresso/75";
  const eyebrow = isHero ? "text-caramel" : "text-mocha";
  const divider = isHero ? "border-foam/20" : "border-cappuccino/40";

  const content = (
    <div className={isHero ? "mt-8 space-y-8" : "mt-12 space-y-12"}>
      <div className="max-w-3xl">
        <h3 className={`font-display ${isHero ? "text-xl" : "text-2xl"} ${title}`}>
          Retirada
        </h3>
        <div
          className={`mt-3 space-y-3 leading-relaxed ${body} ${
            isHero ? "text-sm" : "text-base"
          }`}
        >
          <p>
            As retiradas são realizadas exclusivamente no horário previamente
            agendado no momento do pedido.
          </p>
          <p>
            Nosso compromisso de atendimento é reservado para esse horário. Por
            isso, antes ou após o período agendado, podemos não estar
            disponíveis para realizar a entrega.
          </p>
          <p>
            Pedimos, gentilmente, que o horário escolhido seja respeitado,
            garantindo assim um atendimento organizado e a melhor experiência
            para todos.
          </p>
        </div>
      </div>

      <div
        className={`grid gap-8 border-t pt-8 md:grid-cols-2 ${divider} ${
          isHero ? "gap-8" : "gap-10 pt-12"
        }`}
      >
        <div>
          <h3
            className={`font-display ${isHero ? "text-xl" : "text-2xl"} ${title}`}
          >
            Pagamento
          </h3>
          <ul
            className={`mt-3 space-y-1.5 leading-relaxed ${body} ${
              isHero ? "text-sm" : "text-base"
            }`}
          >
            <li>Pix</li>
            <li>Espécie</li>
            <li>Cartão e link de pagamento (verificar taxa)</li>
          </ul>
        </div>
        <div>
          <h3
            className={`font-display ${isHero ? "text-xl" : "text-2xl"} ${title}`}
          >
            Topo
          </h3>
          <p
            className={`mt-3 leading-relaxed ${body} ${
              isHero ? "text-sm" : "text-base"
            }`}
          >
            Trabalhamos com topo em papelaria, acrílico e papel arroz.
          </p>
        </div>
      </div>
    </div>
  );

  if (isHero) {
    return (
      <div className="mt-6 max-w-3xl border-t border-foam/20 pt-6">
        <p className={`text-xs uppercase tracking-[0.2em] ${eyebrow}`}>
          Informações
        </p>
        {content}
      </div>
    );
  }

  return (
    <section className="border-t border-cappuccino/40 bg-foam/50 py-20">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p className={`text-xs uppercase tracking-[0.2em] ${eyebrow}`}>
          Informações
        </p>
        <h2 className={`mt-2 max-w-2xl font-display text-4xl ${title}`}>
          Retirada, pagamento e acabamento
        </h2>
        <p className={`mt-4 max-w-2xl text-base leading-relaxed ${body}`}>
          Confira estes detalhes antes de finalizar o pedido pelo WhatsApp.
        </p>
        {content}
      </div>
    </section>
  );
}
