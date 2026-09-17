# MK Gourmet

Loja online com vitrine para clientes e painel para a empreendedora.

## O que tem

- Página inicial com promoções, novidades e destaques
- Catálogo de produtos com fotos e preços
- Pedido pelo WhatsApp com mensagem pronta
- Painel admin para cadastrar produtos, fotos, promoções e novidades
- Configuração do nome da loja e número do WhatsApp

## Paleta

- Creamy Latte `#F3E9D7`
- Warm Cappuccino `#D6BFA6`
- Caramel Roast `#B08968`
- Mocha Bean `#7A553A`
- Espresso Shot `#3B2A22`

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Painel da empreendedora

- URL: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- Senha padrão: `mk1234`

Altere a senha criando um arquivo `.env.local`:

```env
ADMIN_PASSWORD=sua-senha-forte
AUTH_SECRET=uma-chave-secreta-qualquer
```

### WhatsApp

No painel, vá em **Configurações** e coloque o número com DDI + DDD, por exemplo:

`5511987654321`

## Fluxo

1. Empreendedora entra no painel
2. Cadastra produtos com foto (upload ou URL)
3. Publica promoções e novidades
4. Cliente navega no catálogo e clica em **Pedir no WhatsApp**