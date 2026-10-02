# 🌌 MindSpace

> **MindSpace** é uma aplicação web moderna, fluida e minimalista para organização pessoal, gerenciamento de tarefas, metas de vida, listas de compras e ideação.

---

## 🚀 Funcionalidades

- 🛒 **Lista de Compras (Buy):** Adicione, marque e gerencie itens essenciais do dia a dia.
- ✅ **Lista de Afazeres (Do):** Controle de tarefas com suporte a conclusão rápida e contadores inteligentes.
- 💡 **Ideias & Anotações (Others):** Espaço livre para registrar pensamentos, lembretes e insights.
- 🎯 **Planos & Objetivos (Plans):** Cartões visuais e motivacionais com gradientes customizáveis para metas de médio/longo prazo.
- 🎨 **Temas & Gradientes:** Troca dinâmica de esquemas de cores (Blue Glow, Pink Rose, Emerald Wave, Amber Fire, Violet Star, Cyan Breeze).
- 💾 **Persistência de Dados:** Salvamento automático de todas as alterações no `localStorage` do seu navegador.

---

## 🛠️ Tecnologias Utilizadas

- **[React 19](https://react.dev/)** — Biblioteca principal de interface.
- **[Vite 8](https://vite.dev/)** — Build tool ultra-rápida.
- **[Lucide React](https://lucide.dev/)** — Conjunto de ícones modernos e elegantes.
- **CSS3 / Vanilla CSS** — Interface rica com efeitos de *glassmorphism*, sombras suaves e animações fluídas.

---

## 💻 Como Rodar o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/GuiBez007/MindSpace.git
   ```

2. **Acesse a pasta do projeto:**
   ```bash
   cd MindSpace
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. Abra o navegador no endereço indicado (geralmente `http://localhost:5173`).

---

## 🌐 Deploy no GitHub Pages

Para publicar este projeto no GitHub Pages, siga o passo a passo resumido abaixo (veja detalhes completos na resposta enviada pelo assistente):

1. Configure a propriedade `base` no arquivo `vite.config.js`:
   ```javascript
   export default defineConfig({
     plugins: [react()],
     base: '/MindSpace/',
   })
   ```

2. Instale a biblioteca `gh-pages`:
   ```bash
   npm install -D gh-pages
   ```

3. Adicione os scripts no `package.json`:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```

4. Execute o deploy:
   ```bash
   npm run deploy
   ```

---

## 📄 Licença

Este projeto está sob a licença [MIT](./LICENSE).
