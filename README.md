# Mora — Gestão de Backlog de Mídia

PWA mobile-first em Vue 3 para organizar sua fila de filmes, séries, livros, jogos, álbuns e outros.

**100% sem token** — nenhuma chave de API necessária.

## APIs

| Tipo | Provider | Token | Campos importados |
|------|----------|-------|-------------------|
| Filme | [Wikidata](https://www.wikidata.org) + [Wikimedia Commons](https://commons.wikimedia.org) | Não | título, ano, capa, descrição, nota (quando disponível) |
| Série | [TVMaze](https://www.tvmaze.com/api) | Não | título, ano, capa, sinopse, gêneros, nota |
| Livro | [Open Library](https://openlibrary.org/developers/api) | Não | título, autor, ano, capa |
| Jogo | [FreeToGame](https://www.freetogame.com/api-doc) | Não | título, ano, capa, gênero, descrição (catálogo free-to-play) |
| Álbum | [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API) + [Cover Art Archive](https://coverartarchive.org/) | Não | título, artista, ano, capa |
| Outro | — | Não | cadastro manual |

Todos os tipos também aceitam **entrada manual** (botão "Ou adicionar manualmente" na busca).

## Configuração

```bash
cd backlog-media
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Build PWA

```bash
npm run build
npm run preview
```

## Stack

- Vue 3 + TypeScript + Vite
- Pinia + Vue Router
- vite-plugin-pwa
