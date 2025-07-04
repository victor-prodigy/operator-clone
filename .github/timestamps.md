## Shadcn
- instalando todos os components shadcn `npx shadcn@2.7.0 add --all` https://youtu.be/xs8mWnbMcmc?t=1270
- usando Resizable Component https://youtu.be/xs8mWnbMcmc?t=17170
- usando Tabs Component https://youtu.be/xs8mWnbMcmc?t=22399
- `removendo botao do Resizable` https://youtu.be/xs8mWnbMcmc?t=25883

## Prisma
- seed https://youtu.be/xs8mWnbMcmc?t=2041
- Database reset https://youtu.be/xs8mWnbMcmc?t=2481
- corrigir erro `npx prisma migrate dev` https://youtu.be/xs8mWnbMcmc?t=2626
- schema.prisma https://youtu.be/xs8mWnbMcmc?t=13683
- empurrar schema no modo development `npx prisma migrate dev`
- `usando type do Prisma na interface do React` https://youtu.be/xs8mWnbMcmc?t=17720
```ts
import { Fragment, MessageRole, MessageType } from "@/generated/prisma";

interface MessageCardProps {
  content: string;
  role: MessageRole;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
}
```
- são as mesmas coisa executar => `npx prisma generate` ou `npx prisma migrate dev` https://youtu.be/xs8mWnbMcmc?t=17747

## Git & Github
- criando `branch` https://youtu.be/xs8mWnbMcmc?t=2721
- atualizando manualmente com `commit` o repositorio github https://youtu.be/xs8mWnbMcmc?t=24142

## TRPC
- setup https://youtu.be/xs8mWnbMcmc?t=2949
- Getting data in a server component `caller` https://youtu.be/xs8mWnbMcmc?t=4362

## TanStack React Query
https://youtu.be/xs8mWnbMcmc?t=4142

## INNGEST (Background Jobs)
- para tarefas demoradas & carregamento no background dos dados da IA para o usuário https://youtu.be/xs8mWnbMcmc?t=5189
- support para OpenAI, Anthropic, Gemini https://youtu.be/xs8mWnbMcmc?t=7050
- AgentKit, definindo o que o agent openai deve fazer https://youtu.be/xs8mWnbMcmc?t=7545

## Toast
- usando toast no trpc https://youtu.be/xs8mWnbMcmc?t=6050

## E2B (Sandbox) & Docker
- ambiente onde a IA gera arquivos e nextjs apps https://youtu.be/xs8mWnbMcmc?t=8385
- setup https://youtu.be/xs8mWnbMcmc?t=8452
- Dockerfile https://youtu.be/xs8mWnbMcmc?t=8734
- `npm i @e2b/code-interpreter` https://youtu.be/xs8mWnbMcmc?t=10087
- E2B API Key https://youtu.be/xs8mWnbMcmc?t=10393

## Agent Tools
- adicionando agent ai tools como o terminal para modificar códigos e modificá-las em sandboxes https://youtu.be/xs8mWnbMcmc?t=10782
- prompt de instruções para a IA https://youtu.be/xs8mWnbMcmc?t=11749

## TRPC & Prisma
1. `criando função procedures.ts para criar message` subtitui server actions & api route https://youtu.be/xs8mWnbMcmc?t=13998
2. `create message no frontend` https://youtu.be/xs8mWnbMcmc?t=14282
3. `(use server) fetching obtendo todas as messages de um projectId no frontend` https://youtu.be/xs8mWnbMcmc
4. `(use server) fetching obtendo dados do project com base no projectId do params` https://youtu.be/xs8mWnbMcmc?t=16861
## TRPC & TanStack Query
1. `(use client) fetching obtendo message criada` https://youtu.be/xs8mWnbMcmc?t=14389
2. empurrando o usuário para Project Id Page https://youtu.be/xs8mWnbMcmc?t=16400
3. `(use client) fetching obtendo dadosd do project com base no projectId do params` https://youtu.be/xs8mWnbMcmc?t=16985
4. `TanStack HydrationBoundary para receber os dados do cache serializados (geralmente vindos via props no Server-Side Rendering (SSR))` https://youtu.be/xs8mWnbMcmc?t=17038

# Inngest & Prisma
1. `adicionando dados no banco de dados quando Inngest terminar o background jobs` https://youtu.be/xs8mWnbMcmc?t=14513

# Lib
- `npm i random-word-slugs` https://youtu.be/xs8mWnbMcmc?t=15704
- `npm i date-fns` https://youtu.be/xs8mWnbMcmc?t=18176
- `npm i react-textarea-autosize` para autosize da Textarea do message-form.tsx https://youtu.be/xs8mWnbMcmc?t=18816

# Nextjs
- `Project Id Page` https://youtu.be/xs8mWnbMcmc?t=16288
- `extraindo params` https://youtu.be/xs8mWnbMcmc?t=16327

# TailwindCSS (interface UI)
- `Project view` https://youtu.be/xs8mWnbMcmc?t=16935
- `como usar group` https://youtu.be/xs8mWnbMcmc?t=18232
- `FragmentCard para a Agent AI mostrar no chat o resultado do codigo para o usuário` https://youtu.be/xs8mWnbMcmc?t=18472

# React
- `(loading) Suspense para carregamento assíncrono de componentes ou dados, permitindo que você mostre um fallback (ex: um spinner, loading) enquanto algo está sendo carregado` https://youtu.be/xs8mWnbMcmc?t=17084'
- `como o Supense funciona para ser mais rápido visualmente o carregamento Loading...` => https://youtu.be/xs8mWnbMcmc?t=17504
- `pressionar tecla Enter` da textarea de message-form.tsx entao envia mensagem https://youtu.be/xs8mWnbMcmc?t=19204

# pasta modules (quando colocar arquivos nessa pasta)
https://youtu.be/xs8mWnbMcmc?t=17331

# Components
- `message-form.tsx` para envio da mensagem usando formulario com zod e shadcn https://youtu.be/xs8mWnbMcmc?t=18749
- `message-loading.tsx` para mostrar a IA enviando a mensagem https://youtu.be/xs8mWnbMcmc?t=20493
- `project-header.tsx` https://youtu.be/xs8mWnbMcmc?t=20808

# ÚTIL
# corrigindo scroll da página para ir até o final da mensagem enviada
https://youtu.be/xs8mWnbMcmc?t=19734

# ÚTIL
- `Fragment View` para o usuário visualizar o sandbox url do E2B o código https://youtu.be/xs8mWnbMcmc?t=21523

- `Code View` para o usuário visualizar o código https://youtu.be/xs8mWnbMcmc?t=22363
- `npm i prismjs` & `npm i -D @types/prismjs` para destacar sintaxe do código com cores https://youtu.be/xs8mWnbMcmc?t=22691
- `file-explore.tsx` para mostrar os arquivos do código https://youtu.be/xs8mWnbMcmc?t=22999
- `tree-view.tsx` para mostrar os files(arquivos) folders(pastas) do projeto em formato de arvore https://youtu.be/xs8mWnbMcmc?t=24269

- feature de copiar arquivo https://youtu.be/xs8mWnbMcmc?t=25237

# Home Page / Landing Page
https://youtu.be/xs8mWnbMcmc?t=25936