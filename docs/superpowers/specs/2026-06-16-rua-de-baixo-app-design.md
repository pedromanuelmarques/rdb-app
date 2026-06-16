# Rua de Baixo — App Design Spec

**Data:** 2026-06-16  
**Plataformas:** Android + iOS  
**Stack:** React Native + Expo (managed workflow)

---

## 1. Visão Geral

App móvel para o site de cultura www.ruadebaixo.com. Consome a WordPress REST API existente — sem backend próprio. Permite ler artigos por categoria, pesquisar conteúdo, partilhar artigos e receber notificações push quando novos artigos são publicados.

---

## 2. Funcionalidades (v1)

| Funcionalidade | Descrição |
|---|---|
| Home | Artigo em destaque + lista de artigos recentes |
| Categorias | Drawer lateral com 8 categorias, lista artigos por categoria |
| Artigo | Conteúdo completo renderizado via WebView |
| Pesquisa | Pesquisa em tempo real via WP REST API |
| Partilha | Share sheet nativo iOS/Android |
| Notificações push | OneSignal — disparo automático ao publicar artigo no WordPress |

**Fora de âmbito v1:** comentários, leitura offline, favoritos, Passatempos, Multimédia.

---

## 3. Arquitectura

```
[App React Native/Expo]
        │
        ├── WordPress REST API (ruadebaixo.com/wp-json/wp/v2/)
        │     ├── /posts          — listagem e pesquisa de artigos
        │     ├── /posts/{id}     — artigo individual
        │     └── /categories     — lista de categorias
        │
        └── OneSignal SDK
              └── Push Notifications (disparo via plugin WordPress)
```

**Sem servidor próprio.** WordPress é o único backend.

---

## 4. Stack Técnica

| Componente | Tecnologia |
|---|---|
| Framework | React Native + Expo SDK (managed workflow) |
| Navegação | React Navigation — Drawer + Stack |
| Artigos (HTML) | `react-native-webview` |
| Push notifications | OneSignal SDK para React Native |
| Cache leve | `@react-native-async-storage/async-storage` |
| HTTP | `fetch` nativo (ou `axios`) |
| Partilha | `expo-sharing` / `Share` API nativa |

---

## 5. Navegação

**Estrutura:**
- Header fixo: `☰` (abre drawer) · Logo "RUA DE BAIXO" · `🔍` (abre pesquisa)
- Sem tab bar
- Drawer lateral escuro (#1a1a1a): texto simples, sem ícones

**Drawer — itens:**
1. Home
2. Música
3. Cinema
4. Lifestyle
5. Moda
6. Artes
7. Livros
8. Jogos
9. Tech

**Stack de navegação:**
```
Drawer
 └── Home (screen)
 └── Categoria → Lista Artigos → Artigo
Pesquisa (modal ou stack separado)
```

---

## 6. Ecrãs

### 6.1 Home
- Artigo em destaque (imagem hero + título + categoria)
- Secção "Recentes": lista de artigos com thumbnail, título, data
- Fonte: `/wp-json/wp/v2/posts?per_page=20&_embed`

### 6.2 Lista de Artigos (por categoria)
- Header com nome da categoria
- Lista: thumbnail (40×32) + título + data
- Paginação via scroll infinito (`?page=N`)
- Fonte: `/wp-json/wp/v2/posts?categories={id}&per_page=20&_embed`

### 6.3 Artigo
- Header com `←` + nome da categoria + botão partilha `⎙`
- Imagem hero
- Categoria (texto azul) + título + autor + data
- Conteúdo: `WebView` renderiza HTML do campo `content.rendered`
- Botão partilha: URL do artigo original

### 6.4 Pesquisa
- Input activo ao tocar `🔍`
- Pesquisa enquanto escreve (debounce 400ms)
- Fonte: `/wp-json/wp/v2/posts?search={query}&per_page=20&_embed`
- Resultado: lista igual à Lista de Artigos

---

## 7. Design Visual

| Elemento | Valor |
|---|---|
| Estilo | Minimalista / moderno |
| Background | Branco `#FFFFFF` |
| Texto principal | `#111111` |
| Texto secundário | `#999999` |
| Accent / links | `#0066CC` (azul do site) |
| Header / drawer | `#1a1a1a` (preto) com texto branco |
| Separadores | `#F0F0F0` |
| Fonte | Sistema (`-apple-system` / `Roboto`) |

---

## 8. Notificações Push

**Serviço:** OneSignal (plano gratuito)

**Fluxo:**
1. Instalar plugin OneSignal no WordPress
2. Configurar OneSignal app para Android + iOS
3. Integrar OneSignal SDK na app Expo
4. Ao publicar artigo → WordPress dispara push automaticamente via OneSignal
5. Utilizador toca na notificação → app abre o artigo directamente (deep link por post ID)

**Permissão:** pedida na primeira abertura da app.

---

## 9. WordPress REST API — Endpoints Principais

| Endpoint | Uso |
|---|---|
| `GET /wp-json/wp/v2/posts?per_page=20&_embed` | Artigos recentes (Home) |
| `GET /wp-json/wp/v2/posts?categories={id}&_embed` | Artigos por categoria |
| `GET /wp-json/wp/v2/posts/{id}?_embed` | Artigo individual |
| `GET /wp-json/wp/v2/posts?search={q}&_embed` | Pesquisa |
| `GET /wp-json/wp/v2/categories` | Lista de categorias (com IDs) |

`_embed` inclui imagens featured e dados de autor na mesma resposta.

---

## 10. Publicação

| Plataforma | Conta necessária | Custo |
|---|---|---|
| Google Play | Google Play Console | $25 (único) |
| Apple App Store | Apple Developer Program | $99/ano |

Build gerado via **Expo Application Services (EAS Build)** — não requer Mac para build iOS.

---

## 11. Fora de Âmbito (v1)

- Leitura offline
- Comentários
- Favoritos / artigos guardados
- Categorias Passatempos e Multimédia
- Modo escuro
- Analytics
