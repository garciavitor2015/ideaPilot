# 💡 IdeaPilot — MVP Fase 1

Quadro inteligente de ideias e oportunidades. Board Kanban + Lista com drag & drop.

## 🚀 Rodando localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## ☁️ Deploy na Vercel

1. Suba este projeto no GitHub
2. Acesse [vercel.com](https://vercel.com) e clique em **"Add New Project"**
3. Importe o repositório do GitHub
4. Clique em **Deploy** — sem configuração adicional necessária

## 📦 Estrutura

```
src/
  app/
    layout.js       # Layout raiz com fonte Sora
    page.js         # Página principal
    globals.css     # Reset e estilos globais
  components/
    IdeaPilot.js        # Componente principal
    IdeaPilot.module.css # Estilos do componente
```

## 🗺️ Roadmap

- [x] Fase 1 — Board Kanban + Lista + Drag & Drop + Cadastro simples
- [ ] Fase 2 — Score de maturidade com IA
- [ ] Fase 3 — Sugestões automáticas por ideia
- [ ] Fase 4 — Geração de roadmap / MVP por IA
- [ ] Fase 5 — Colaboração + workspaces
