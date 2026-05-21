# 🗃️ Vimovies — Cómo llenar la base de datos con datos de TMDB

> Esta guía explica exactamente qué le pides a TMDB, qué te devuelve,
> qué guardas de eso, en qué orden, y qué puedes actualizar después.
>
> Está pensada para que puedas seguirla paso a paso sin perderte.

---

## Lo primero que tienes que entender antes de leer esto

TMDB te devuelve datos en un formato que ellos decidieron.
Tu base de datos guarda los datos en un formato que tú decidiste.
**No son iguales.** Siempre hay que transformar de uno al otro.

Este documento te dice exactamente cómo hacer esa transformación,
campo por campo, tabla por tabla.

---

## El principio más importante: el orden importa

No puedes guardar una película si no existen los géneros primero.
No puedes guardar el reparto si no existe la película primero.
No puedes guardar los créditos si no existen las personas primero.

El orden correcto es este y no se puede cambiar:

```
1. genres          ← Primero los géneros (solo se hace una vez, ya están en el seed)
2. media           ← Luego la película
3. media_genres    ← Luego qué géneros tiene esa película
4. people          ← Luego cada persona del reparto (actores, director...)
5. media_credits   ← Luego quién hizo qué en esa película
6. media_videos    ← Luego los trailers
7. media_ratings   ← Luego los ratings (TMDB score)
8. platforms       ← Las plataformas ya están en el seed, no se tocan
9. media_watch_providers ← Finalmente, dónde se puede ver la película
```

Si intentas guardar en otro orden, la base de datos te dará un error
porque hay relaciones entre las tablas que deben respetarse.

---

## Las llamadas que tienes que hacer a TMDB

Para guardar una película completa, necesitas hacer **5 llamadas** a TMDB.
Todas se hacen desde `apps/api`. Nunca desde la web o el dashboard.

```
Llamada 1: GET /movie/{id}?language=es-ES
  → Los datos básicos de la película en ESPAÑOL

Llamada 2: GET /movie/{id}?language=en-US
  → Los mismos datos pero en INGLÉS
  → Necesitas ambos porque guardas title_es y title_en por separado

Llamada 3: GET /movie/{id}/credits
  → El reparto (actores y equipo técnico)
  → No tiene parámetro de idioma — los nombres propios son iguales

Llamada 4: GET /movie/{id}/videos
  → Los trailers disponibles en YouTube

Llamada 5: GET /movie/{id}/watch/providers
  → En qué plataformas está disponible la película y en qué países
```

Donde `{id}` es el número de TMDB. Por ejemplo, para The Dark Knight es `155`.

---

## Qué te devuelve cada llamada — y qué guardas de eso

---

### Llamada 1 y 2: Los datos básicos de la película

**La URL que llamas:**
```
GET https://api.themoviedb.org/3/movie/155?api_key=TU_KEY&language=es-ES
GET https://api.themoviedb.org/3/movie/155?api_key=TU_KEY&language=en-US
```

**Lo que TMDB te devuelve (simplificado):**
```json
{
  "id": 155,
  "imdb_id": "tt0468569",
  "title": "El caballero oscuro",
  "original_title": "The Dark Knight",
  "original_language": "en",
  "overview": "Batman eleva su lucha contra el crimen a un nuevo nivel...",
  "release_date": "2008-07-18",
  "runtime": 152,
  "popularity": 67.43,
  "poster_path": "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  "backdrop_path": "/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg",
  "vote_average": 9.0,
  "vote_count": 28453,
  "status": "Released",
  "tagline": "¿Por qué tan serio?",
  "genres": [
    { "id": 28, "name": "Acción" },
    { "id": 80, "name": "Crimen" },
    { "id": 18, "name": "Drama" }
  ]
}
```

La versión en inglés (`language=en-US`) te da lo mismo pero con:
```json
{
  "title": "The Dark Knight",
  "overview": "Batman raises the stakes in his war on crime...",
  "tagline": "Why so serious?"
}
```

---

**Lo que guardas de esto en la tabla `media`:**

```
┌─────────────────────────┬──────────────────────────────────────────────────────────┐
│ Campo en tu tabla       │ De dónde viene                                           │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ tmdb_id                 │ id de TMDB → 155                                         │
│                         │ ⚠️ NUNCA se actualiza. Es la llave de identidad.        │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ imdb_id                 │ imdb_id de TMDB → "tt0468569"                            │
│                         │ ✅ Se puede actualizar si TMDB lo corrige.              │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ media_type              │ Siempre "movie" para películas.                          │
│                         │ ⚠️ NUNCA se actualiza.                                  │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ slug                    │ LO GENERAS TÚ con generateMediaSlug()                    │
│                         │ Usas el original_title y el año del release_date.        │
│                         │ "The Dark Knight" + 2008 → "the-dark-knight-2008"        │
│                         │ ⚠️ NUNCA se actualiza una vez que está indexado.        │
│                         │ Si cambia, creas un redirect 301 en la tabla redirects.  │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ original_title          │ original_title de TMDB → "The Dark Knight"               │
│                         │ ✅ Se puede actualizar (raro que cambie).               │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ original_language       │ original_language de TMDB → "en"                         │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ release_date            │ release_date de TMDB → "2008-07-18"                      │
│                         │ ✅ Se puede actualizar (si TMDB corrige la fecha).      │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ runtime_minutes         │ runtime de TMDB → 152                                    │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ tmdb_popularity         │ popularity de TMDB → 67.43                               │
│                         │ ✅ Se actualiza en cada sync (cambia constantemente).   │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ title_es                │ title de la llamada en español → "El caballero oscuro"   │
│                         │ ✅ Se puede actualizar.                                 │
│                         │ ⚠️ Si tú lo editas manualmente en el dashboard,        │
│                         │    deberías marcar un flag para no sobreescribirlo.      │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ title_en                │ title de la llamada en inglés → "The Dark Knight"        │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ synopsis_es             │ overview de la llamada en español                        │
│                         │ "Batman eleva su lucha contra el crimen..."              │
│                         │ ✅ Se puede actualizar desde TMDB.                      │
│                         │ ⚠️ Si tú la mejoras editorialmente en el dashboard,    │
│                         │    el próximo sync NO debe sobreescribirla.              │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ synopsis_en             │ overview de la llamada en inglés                         │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ poster_path             │ poster_path de TMDB → "/qJ2tW6WMUDux911r6m7haRef0WH.jpg"│
│                         │ ⚠️ GUARDAR SOLO LA RUTA, no la URL completa.           │
│                         │ La URL completa la construyes con tmdbPosterUrl()        │
│                         │ cuando la necesitas mostrar.                             │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ backdrop_path           │ backdrop_path de TMDB → igual que poster_path.           │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ status                  │ Siempre empieza en "published".                          │
│                         │ ⚠️ TMDB tiene su propio campo "status" ("Released",    │
│                         │    "Post Production"...) pero ese NO es el mismo.        │
│                         │    Tu campo status es para el sistema de publicación     │
│                         │    de Vimovies (draft/published/archived).               │
│                         │ ⚠️ Solo se cambia desde el dashboard, nunca desde sync. │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ noindex                 │ LO CALCULAS TÚ con shouldNoindex(popularity)             │
│                         │ Si popularity < 10 → true (Google no indexa la página)  │
│                         │ Si popularity >= 10 → false (Google sí la indexa)       │
│                         │ ✅ Se recalcula en cada sync.                           │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ sitemap_priority        │ LO CALCULAS TÚ basado en la popularidad:                 │
│                         │ popularity > 50  → "high"                                │
│                         │ popularity > 20  → "medium"                              │
│                         │ popularity > 10  → "low"                                 │
│                         │ popularity <= 10 → "minimal"                             │
│                         │ ✅ Se recalcula en cada sync.                           │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ tmdb_last_synced_at     │ La fecha y hora AHORA → new Date().toISOString()         │
│                         │ ✅ Se actualiza en cada sync.                           │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ editorial_review_es     │ VACÍO al sincronizar. Lo llenas tú en el dashboard.      │
│                         │ ⚠️ El sync NUNCA toca este campo.                      │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ editorial_review_en     │ Igual que el anterior pero en inglés.                    │
│                         │ ⚠️ El sync NUNCA toca este campo.                      │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ editorial_rating        │ VACÍO al sincronizar. Tu rating propio, 0.0 a 10.0.      │
│                         │ ⚠️ El sync NUNCA toca este campo.                      │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ editorial_verdict_es    │ VACÍO al sincronizar. Un tagline corto tuyo.             │
│                         │ ⚠️ El sync NUNCA toca este campo.                      │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ seo_title_es            │ VACÍO al sincronizar. Si lo llenas en el dashboard,      │
│                         │ ese título sobreescribe el generado automáticamente.     │
│                         │ Si está vacío, la web usa buildMediaTitle() de utils.    │
│                         │ ⚠️ El sync NUNCA toca este campo.                      │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ seo_description_es      │ Igual que seo_title_es pero para la meta description.    │
│                         │ ⚠️ El sync NUNCA toca este campo.                      │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ og_image_url            │ VACÍO al sincronizar. Lo genera el Cloudflare Worker     │
│                         │ automáticamente cuando la página se visita por primera   │
│                         │ vez. No es algo que calcules manualmente.               │
└─────────────────────────┴──────────────────────────────────────────────────────────┘
```

**Resumen visual de qué toca el sync y qué no:**

```
SYNC AUTOMÁTICO ACTUALIZA:           SYNC NUNCA TOCA:
───────────────────────────          ──────────────────────────
✅ tmdb_id (solo al crear)           🔒 slug
✅ imdb_id                           🔒 status
✅ original_title                    🔒 editorial_review_es
✅ original_language                 🔒 editorial_review_en
✅ release_date                      🔒 editorial_rating
✅ runtime_minutes                   🔒 editorial_verdict_es
✅ tmdb_popularity                   🔒 editorial_verdict_en
✅ title_es                          🔒 seo_title_es
✅ title_en                          🔒 seo_title_en
✅ synopsis_es                       🔒 seo_description_es
✅ synopsis_en                       🔒 seo_description_en
✅ poster_path                       🔒 og_image_url
✅ backdrop_path
✅ noindex (recalculado)
✅ sitemap_priority (recalculado)
✅ tmdb_last_synced_at
```

---

### Llamada 3: El reparto y equipo técnico

**La URL que llamas:**
```
GET https://api.themoviedb.org/3/movie/155/credits?api_key=TU_KEY
```

**Lo que TMDB te devuelve:**
```json
{
  "cast": [
    {
      "id": 3894,
      "name": "Christian Bale",
      "character": "Bruce Wayne / Batman",
      "order": 0,
      "profile_path": "/qCpZn2e3dimwbryLnqxZuI88PTi.jpg"
    },
    {
      "id": 1810,
      "name": "Heath Ledger",
      "character": "The Joker",
      "order": 1,
      "profile_path": "/5Y9HnYYa9jF4NunY9ph689ukUmI.jpg"
    }
    // ... más actores
  ],
  "crew": [
    {
      "id": 525,
      "name": "Christopher Nolan",
      "job": "Director",
      "department": "Directing",
      "profile_path": "/9NAZnTjBQ9WcXAQEzZpKy4vdQto.jpg"
    },
    {
      "id": 525,
      "name": "Christopher Nolan",
      "job": "Screenplay",
      "department": "Writing",
      "profile_path": "/9NAZnTjBQ9WcXAQEzZpKy4vdQto.jpg"
    },
    {
      "id": 1488,
      "name": "Hans Zimmer",
      "job": "Original Music Composer",
      "department": "Sound",
      "profile_path": "/tpQnDeHY15szIXvpnhlprufz4d.jpg"
    }
    // ... más equipo
  ]
}
```

**El proceso tiene DOS partes:**

#### Parte A: Guardar cada persona en la tabla `people`

Antes de guardar el crédito, la persona tiene que existir en la tabla `people`.
Si ya existe (mismo tmdb_id), actualizas. Si no existe, la creas.

```
Para cada persona en cast[] y crew[]:

  1. Mira si ya existe en tu tabla people (busca por tmdb_id)
  2. Si no existe:
     → Haces UNA llamada más a TMDB para obtener sus datos completos:
       GET /person/{id}?language=es-ES
       GET /person/{id}?language=en-US
     → La guardas en la tabla people (ver sección de people más abajo)
  3. Si ya existe:
     → No haces nada más. Ya la tienes.
  4. Guardas su UUID (el id de TU tabla) para usarlo en el paso B
```

**Lo que guardas en la tabla `people`:**

```
┌─────────────────────────┬──────────────────────────────────────────────────────────┐
│ Campo en tu tabla       │ De dónde viene                                           │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ tmdb_id                 │ id de TMDB → 3894 (Christian Bale)                       │
│                         │ ⚠️ NUNCA se actualiza.                                  │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ slug                    │ LO GENERAS TÚ con generatePersonSlug()                   │
│                         │ "Christian Bale" → "christian-bale"                      │
│                         │ ⚠️ NUNCA se actualiza.                                  │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ name                    │ name de TMDB → "Christian Bale"                          │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ also_known_as           │ also_known_as de TMDB → ["Christian Charles Philip Bale"]│
│                         │ Es un array de texto. Se guarda tal cual.               │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ birthdate               │ birthday de TMDB → "1974-01-30"                          │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ deathdate               │ deathday de TMDB → null (si vive) o "2008-01-22"        │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ birthplace              │ place_of_birth de TMDB → "Haverfordwest, Wales"          │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ biography_es            │ biography de la llamada en español                       │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ biography_en            │ biography de la llamada en inglés                        │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ gender                  │ gender de TMDB → 2 (hombre)                              │
│                         │ 0=no definido, 1=mujer, 2=hombre, 3=no binario           │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ profile_path            │ profile_path de TMDB → "/qCpZn2e3dimwbryLnqxZuI88PTi.jpg"│
│                         │ ⚠️ GUARDAR SOLO LA RUTA, no la URL completa.           │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ imdb_id                 │ imdb_id de TMDB → "nm0000288"                            │
│                         │ ✅ Se puede actualizar.                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ tmdb_popularity         │ popularity de TMDB                                        │
│                         │ ✅ Se actualiza en cada sync.                           │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ tmdb_last_synced_at     │ new Date().toISOString()                                 │
│                         │ ✅ Se actualiza en cada sync.                           │
└─────────────────────────┴──────────────────────────────────────────────────────────┘
```

#### Parte B: Guardar la relación en la tabla `media_credits`

Una vez que tienes el UUID de la persona en tu tabla `people`,
guardas la relación con la película.

**Para cada actor del cast[]:**
```
┌─────────────────────────┬──────────────────────────────────────────────────────────┐
│ Campo en tu tabla       │ De dónde viene                                           │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ media_id                │ El UUID de la película que guardaste en el paso anterior  │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ person_id               │ El UUID de la persona en tu tabla people                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ role                    │ Siempre "actor" para los del array cast[]                │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ character_name          │ character de TMDB → "Bruce Wayne / Batman"               │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ cast_order              │ order de TMDB → 0 (el protagonista siempre es 0)         │
│                         │ Sirve para ordenar el reparto en pantalla.               │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ department              │ null (los actores no tienen departamento en TMDB)         │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ job_title               │ null                                                     │
└─────────────────────────┴──────────────────────────────────────────────────────────┘
```

**Para cada miembro del crew[] que te interesa:**

No guardas todo el crew. Solo guardas estas personas:

| job de TMDB | role que guardas | job_title que guardas |
|-------------|-----------------|----------------------|
| "Director" | "director" | "Director" |
| "Screenplay" | "writer" | "Screenplay" |
| "Story" | "writer" | "Story" |
| "Producer" | "producer" | "Producer" |
| "Executive Producer" | "producer" | "Executive Producer" |
| "Original Music Composer" | "composer" | "Composer" |
| "Director of Photography" | "cinematographer" | "Cinematographer" |

Los demás (maquillaje, efectos especiales, catering...) los ignoras.

```
┌─────────────────────────┬──────────────────────────────────────────────────────────┐
│ Campo en tu tabla       │ De dónde viene                                           │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ media_id                │ El UUID de la película                                   │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ person_id               │ El UUID de la persona en tu tabla people                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ role                    │ Lo que corresponde según la tabla de arriba              │
│                         │ "Director" → "director", "Screenplay" → "writer", etc.   │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ character_name          │ null (el crew no tiene personaje)                        │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ cast_order              │ null                                                     │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ department              │ department de TMDB → "Directing"                         │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ job_title               │ job de TMDB → "Director"                                 │
└─────────────────────────┴──────────────────────────────────────────────────────────┘
```

**¿Se actualiza media_credits en cada sync?**

Sí, pero de una forma especial. No haces update de cada fila.
Borras todos los créditos de esa película y los vuelves a insertar desde cero.
Esto es más simple y evita duplicados.

```
En cada sync de una película:
  1. DELETE FROM media_credits WHERE media_id = 'el-uuid-de-la-pelicula'
  2. Insertar todos los créditos nuevamente desde TMDB
```

---

### Llamada 4: Los trailers

**La URL que llamas:**
```
GET https://api.themoviedb.org/3/movie/155/videos?api_key=TU_KEY
```

**Lo que TMDB te devuelve:**
```json
{
  "results": [
    {
      "id": "5c9e5b21c3a368771a0050cb",
      "key": "EXeTwQWrcwY",
      "name": "The Dark Knight Official Trailer",
      "site": "YouTube",
      "type": "Trailer",
      "official": true,
      "published_at": "2008-05-15T00:00:00.000Z",
      "iso_639_1": "en"
    },
    {
      "id": "5c9e5b21c3a368771a0050cc",
      "key": "kmJLuwP3MbY",
      "name": "Tráiler Oficial en Español",
      "site": "YouTube",
      "type": "Trailer",
      "official": true,
      "published_at": "2008-05-15T00:00:00.000Z",
      "iso_639_1": "es"
    },
    {
      "key": "otroKey",
      "type": "Featurette",
      "site": "YouTube",
      "official": false,
      "iso_639_1": "en"
    }
  ]
}
```

**Lo que guardas en la tabla `media_videos`:**

No guardas todos los videos. Filtras primero:
- Solo los de YouTube (`site === "YouTube"`)
- Solo Trailer, Teaser, Clip, Featurette (no "Behind the Scenes" por ahora, a menos que quieras)

```
┌─────────────────────────┬──────────────────────────────────────────────────────────┐
│ Campo en tu tabla       │ De dónde viene                                           │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ media_id                │ El UUID de la película                                   │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ locale                  │ iso_639_1 de TMDB → "es" o "en"                          │
│                         │ Si el video es en español → "es"                         │
│                         │ Si es en inglés o cualquier otro → "en"                  │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ video_type              │ Transformas el type de TMDB:                             │
│                         │ "Trailer" → "trailer"                                    │
│                         │ "Teaser" → "teaser"                                      │
│                         │ "Clip" → "clip"                                          │
│                         │ "Featurette" → "featurette"                              │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ video_site              │ Siempre "youtube" (solo aceptas YouTube por ahora)       │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ external_key            │ key de TMDB → "EXeTwQWrcwY"                              │
│                         │ Este es el ID del video en YouTube.                      │
│                         │ Para ver el video: youtube.com/watch?v=EXeTwQWrcwY       │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ title                   │ name de TMDB → "The Dark Knight Official Trailer"        │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ published_at            │ Solo la fecha de published_at de TMDB: "2008-05-15"      │
│                         │ Quitas la hora: "2008-05-15T00:00:00.000Z" → "2008-05-15"│
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ is_official             │ official de TMDB → true o false                          │
└─────────────────────────┴──────────────────────────────────────────────────────────┘
```

**¿Se actualiza en cada sync?**

Sí, igual que los créditos: borras todos y los vuelves a insertar.
```
DELETE FROM media_videos WHERE media_id = 'el-uuid-de-la-pelicula'
Insertar los nuevos desde TMDB
```

---

### Llamada 5: Dónde ver la película (plataformas)

**La URL que llamas:**
```
GET https://api.themoviedb.org/3/movie/155/watch/providers?api_key=TU_KEY
```

**Lo que TMDB te devuelve:**
```json
{
  "results": {
    "ES": {
      "link": "https://www.justwatch.com/es/pelicula/...",
      "flatrate": [
        { "provider_id": 337, "provider_name": "Disney Plus", "logo_path": "/..." }
      ],
      "rent": [
        { "provider_id": 2, "provider_name": "Apple TV", "logo_path": "/..." },
        { "provider_id": 3, "provider_name": "Google Play Movies", "logo_path": "/..." }
      ]
    },
    "MX": {
      "flatrate": [
        { "provider_id": 8, "provider_name": "Netflix", "logo_path": "/..." },
        { "provider_id": 337, "provider_name": "Disney Plus", "logo_path": "/..." }
      ]
    },
    "US": {
      "flatrate": [
        { "provider_id": 384, "provider_name": "Max", "logo_path": "/..." }
      ],
      "rent": [
        { "provider_id": 2, "provider_name": "Apple TV", "logo_path": "/..." }
      ],
      "buy": [
        { "provider_id": 2, "provider_name": "Apple TV", "logo_path": "/..." }
      ]
    }
  }
}
```

**Lo que guardas en la tabla `media_watch_providers`:**

Solo procesas los países que te interesan: ES, MX, AR, CO, US.
Para cada país, recorres las tres listas (flatrate, rent, buy).

```
┌─────────────────────────┬──────────────────────────────────────────────────────────┐
│ Campo en tu tabla       │ De dónde viene                                           │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ media_id                │ El UUID de la película                                   │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ platform_id             │ Buscas en tu tabla platforms cuál tiene el               │
│                         │ tmdb_provider_id que coincide con provider_id de TMDB.   │
│                         │ Ejemplo: provider_id 8 (Netflix) → busca en platforms    │
│                         │ WHERE tmdb_provider_id = 8 → te da el id de Netflix     │
│                         │ en TU tabla.                                             │
│                         │ ⚠️ Si no existe esa plataforma en tu tabla, la ignoras. │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ region_code             │ La clave del país → "ES", "MX", "AR", "CO", "US"        │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ is_streaming            │ true si esta plataforma aparece en flatrate[] de ese país│
│                         │ false si no aparece                                       │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ is_rent                 │ true si aparece en rent[] de ese país                    │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ is_buy                  │ true si aparece en buy[] de ese país                     │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ rent_price_usd          │ TMDB no provee precios. Siempre null.                    │
│                         │ Si quieres precios, necesitas otra fuente de datos.      │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ buy_price_usd           │ Igual que rent_price_usd. Siempre null.                  │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ watch_url               │ link de TMDB (el de JustWatch) → guardarlo como          │
│                         │ referencia aunque no lo uses directamente.               │
│                         │ Es la URL donde el usuario puede ver más info.          │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ affiliate_url           │ null al sincronizar. Lo agregas tú manualmente           │
│                         │ si tienes un link de afiliado de esa plataforma.         │
│                         │ ⚠️ El sync NUNCA sobreescribe este campo.               │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ tmdb_synced_at          │ new Date().toISOString()                                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ verified_at             │ null. Solo se llena si alguien verifica manualmente       │
│                         │ que esa película realmente está en esa plataforma.       │
└─────────────────────────┴──────────────────────────────────────────────────────────┘
```

**Ejemplo real de cómo se convierte un país:**

TMDB dice para "MX":
```
flatrate: [Netflix (id:8), Disney+ (id:337)]
```

Tú creas DOS filas en `media_watch_providers`:

```
Fila 1:
  media_id = uuid de The Dark Knight
  platform_id = id de Netflix en tu tabla
  region_code = "MX"
  is_streaming = true   ← está en flatrate
  is_rent = false
  is_buy = false

Fila 2:
  media_id = uuid de The Dark Knight
  platform_id = id de Disney+ en tu tabla
  region_code = "MX"
  is_streaming = true   ← está en flatrate
  is_rent = false
  is_buy = false
```

**¿Se actualiza en cada sync?**

Sí, igual que los anteriores: borras todos los providers de esa película y los reinsertas.
```
DELETE FROM media_watch_providers WHERE media_id = 'el-uuid-de-la-pelicula'
Insertar los nuevos desde TMDB
```

---

### La tabla `media_genres`: conectar géneros con la película

TMDB te da en los datos básicos de la película (llamada 1) los géneros:
```json
"genres": [
  { "id": 28, "name": "Acción" },
  { "id": 80, "name": "Crimen" }
]
```

En tu base de datos ya tienes la tabla `genres` con todos los géneros del seed.
Lo que haces es crear las filas de relación en `media_genres`.

```
Para cada género de la película:
  Buscar en tu tabla genres: WHERE tmdb_id = 28
  → Te da el id de tu tabla (por ejemplo, id = 1 para Acción)

  Insertar en media_genres:
  { media_id: uuid_de_la_pelicula, genre_id: 1 }
```

**¿Se actualiza en cada sync?**
Sí, igual: borras y reinsertas.
```
DELETE FROM media_genres WHERE media_id = 'el-uuid-de-la-pelicula'
Insertar los nuevos
```

---

### La tabla `media_ratings`: el rating de TMDB

El rating viene en los datos básicos de la película (llamada 1):
```json
"vote_average": 9.0,
"vote_count": 28453
```

```
┌─────────────────────────┬──────────────────────────────────────────────────────────┐
│ Campo en tu tabla       │ De dónde viene                                           │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ media_id                │ El UUID de la película                                   │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ source                  │ Siempre "tmdb" para este caso                            │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ score                   │ vote_average de TMDB → 9.0                               │
│                         │ Ya está en escala 0-10, no necesitas transformar.        │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ vote_count              │ vote_count de TMDB → 28453                               │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ raw_score               │ Lo construyes tú: "9.0/10"                               │
│                         │ Es solo para referencia y visualización.                 │
├─────────────────────────┼──────────────────────────────────────────────────────────┤
│ fetched_at              │ new Date().toISOString()                                 │
└─────────────────────────┴──────────────────────────────────────────────────────────┘
```

**¿Se actualiza en cada sync?**
Sí, usando upsert con (media_id, source) como clave única:
```
UPSERT media_ratings ON CONFLICT (media_id, source) DO UPDATE
```

---

## El orden completo de inserción, paso a paso

Aquí está todo junto, en el orden correcto:

```
ANTES DE SINCRONIZAR UNA PELÍCULA:
  ✓ La tabla genres ya tiene datos (del seed SQL)
  ✓ La tabla platforms ya tiene datos (del seed SQL)
  ✓ Tienes el tmdb_id de la película que quieres sincronizar

PASO 1 — Hacer las 5 llamadas a TMDB:
  → movieEs  = GET /movie/{id}?language=es-ES
  → movieEn  = GET /movie/{id}?language=en-US
  → credits  = GET /movie/{id}/credits
  → videos   = GET /movie/{id}/videos
  → providers = GET /movie/{id}/watch/providers

PASO 2 — Calcular el slug:
  → año = movieEs.release_date.split('-')[0]  → "2008"
  → slug = generateMediaSlug(movieEn.original_title, año)
  → "The Dark Knight" + 2008 → "the-dark-knight-2008"

PASO 3 — Guardar/actualizar en tabla media:
  → UPSERT usando tmdb_id como clave
  → Guarda todos los campos de la tabla (ver tabla arriba)
  → Obtén el UUID de la película para los pasos siguientes

PASO 4 — Guardar géneros en media_genres:
  → DELETE FROM media_genres WHERE media_id = uuid
  → Para cada género en movieEs.genres:
      → Busca el id en tu tabla genres WHERE tmdb_id = genre.id
      → INSERT INTO media_genres (media_id, genre_id)

PASO 5 — Guardar rating en media_ratings:
  → UPSERT en media_ratings con source = 'tmdb'

PASO 6 — Procesar el reparto:
  → Para los primeros 15 actores en credits.cast:
      → UPSERT en tabla people (ver proceso de people arriba)
      → Anota el UUID de la persona
  → Para directores, guionistas y compositores en credits.crew:
      → UPSERT en tabla people
      → Anota el UUID de la persona
  → Borrar créditos viejos: DELETE FROM media_credits WHERE media_id = uuid
  → Insertar créditos nuevos para cada persona procesada

PASO 7 — Guardar trailers en media_videos:
  → DELETE FROM media_videos WHERE media_id = uuid
  → Para cada video en videos.results:
      → Si site !== "YouTube" → ignorar
      → Si type no es Trailer/Teaser/Clip/Featurette → ignorar
      → INSERT INTO media_videos

PASO 8 — Guardar dónde ver en media_watch_providers:
  → DELETE FROM media_watch_providers WHERE media_id = uuid
  → Para cada país que te interesa (ES, MX, AR, CO, US):
      → Para cada provider en flatrate[]:
          → Busca platform_id WHERE tmdb_provider_id = provider.provider_id
          → Si existe → INSERT fila con is_streaming = true
      → Para cada provider en rent[]:
          → Busca platform_id
          → Si existe → INSERT o UPDATE fila con is_rent = true
      → Para cada provider en buy[]:
          → Busca platform_id
          → Si existe → INSERT o UPDATE fila con is_buy = true

PASO 9 — Actualizar tmdb_last_synced_at:
  → UPDATE media SET tmdb_last_synced_at = now() WHERE id = uuid

FIN ✓ La película está completamente sincronizada.
```

---

## Tabla resumen: qué se actualiza en cada sync

Esta es la referencia rápida cuando tengas dudas:

```
TABLA media
┌───────────────────────────┬────────────────┬─────────────────────────────────────┐
│ Campo                     │ ¿Se actualiza? │ Nota                                │
├───────────────────────────┼────────────────┼─────────────────────────────────────┤
│ id (UUID)                 │ NUNCA          │ Lo genera Supabase una sola vez      │
│ tmdb_id                   │ NUNCA          │ Es la llave de identidad con TMDB    │
│ slug                      │ NUNCA          │ Una vez indexado, es permanente      │
│ media_type                │ NUNCA          │ Una película siempre es "movie"      │
│ status                    │ NUNCA          │ Solo desde el dashboard              │
│ editorial_review_es       │ NUNCA          │ Solo desde el dashboard              │
│ editorial_review_en       │ NUNCA          │ Solo desde el dashboard              │
│ editorial_rating          │ NUNCA          │ Solo desde el dashboard              │
│ editorial_verdict_es      │ NUNCA          │ Solo desde el dashboard              │
│ editorial_verdict_en      │ NUNCA          │ Solo desde el dashboard              │
│ seo_title_es              │ NUNCA          │ Solo desde el dashboard              │
│ seo_title_en              │ NUNCA          │ Solo desde el dashboard              │
│ seo_description_es        │ NUNCA          │ Solo desde el dashboard              │
│ seo_description_en        │ NUNCA          │ Solo desde el dashboard              │
│ og_image_url              │ NUNCA          │ Lo genera el Cloudflare Worker       │
├───────────────────────────┼────────────────┼─────────────────────────────────────┤
│ imdb_id                   │ SÍ             │ Por si TMDB lo corrige              │
│ original_title            │ SÍ             │ Raro que cambie                     │
│ original_language         │ SÍ             │ Raro que cambie                     │
│ release_date              │ SÍ             │ Por si TMDB corrige la fecha        │
│ runtime_minutes           │ SÍ             │ A veces TMDB lo corrige             │
│ tmdb_popularity           │ SÍ             │ Cambia constantemente               │
│ title_es                  │ SÍ             │ Si TMDB mejora su traducción        │
│ title_en                  │ SÍ             │ Ídem                                │
│ synopsis_es               │ SÍ             │ Si no fue editada manualmente       │
│ synopsis_en               │ SÍ             │ Ídem                                │
│ poster_path               │ SÍ             │ A veces TMDB actualiza el póster    │
│ backdrop_path             │ SÍ             │ Ídem                                │
│ noindex                   │ SÍ             │ Recalculado cada vez                │
│ sitemap_priority          │ SÍ             │ Recalculado cada vez                │
│ tmdb_last_synced_at       │ SÍ             │ Siempre, es el propósito del campo  │
└───────────────────────────┴────────────────┴─────────────────────────────────────┘

TABLA media_genres        → Se borra y se reinsertan en cada sync
TABLA media_credits       → Se borra y se reinsertan en cada sync
TABLA media_videos        → Se borra y se reinsertan en cada sync
TABLA media_watch_providers → Se borra y se reinsertan en cada sync
TABLA media_ratings       → UPSERT en cada sync (actualiza el score y vote_count)
TABLA people              → UPSERT cuando se encuentra en un crédito nuevo
```

---

## Un ejemplo real: The Dark Knight en números

Así quedaría la base de datos después de sincronizar The Dark Knight (tmdb_id: 155):

```
media:
  id: "a1b2c3d4-..."  (UUID generado por Supabase)
  tmdb_id: 155
  slug: "the-dark-knight-2008"
  title_es: "El caballero oscuro"
  title_en: "The Dark Knight"
  release_date: 2008-07-18
  runtime_minutes: 152
  tmdb_popularity: 67.43
  poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg"  ← solo la ruta
  noindex: false  ← popularidad > 10
  status: "published"

media_genres (3 filas):
  (uuid_pelicula, id_accion)
  (uuid_pelicula, id_crimen)
  (uuid_pelicula, id_drama)

media_ratings (1 fila):
  (uuid_pelicula, "tmdb", 9.0, 28453, "9.0/10")

people (algunos ejemplos):
  (uuid1, 3894, "christian-bale", "Christian Bale", ...)
  (uuid2, 1810, "heath-ledger", "Heath Ledger", ...)
  (uuid3, 525, "christopher-nolan", "Christopher Nolan", ...)

media_credits (algunos ejemplos):
  (uuid_pelicula, uuid_bale,   "actor",    "Bruce Wayne / Batman", 0, null, null)
  (uuid_pelicula, uuid_ledger, "actor",    "The Joker",            1, null, null)
  (uuid_pelicula, uuid_nolan,  "director", null, null, "Directing", "Director")
  (uuid_pelicula, uuid_nolan,  "writer",   null, null, "Writing",   "Screenplay")

media_videos (algunos ejemplos):
  (uuid_pelicula, "en", "trailer", "youtube", "EXeTwQWrcwY", "Official Trailer", true)
  (uuid_pelicula, "es", "trailer", "youtube", "kmJLuwP3MbY", "Tráiler en Español", true)

media_watch_providers (algunos ejemplos para MX):
  (uuid_pelicula, id_netflix,  "MX", streaming=true, rent=false, buy=false)
  (uuid_pelicula, id_disney,   "MX", streaming=true, rent=false, buy=false)
```

---

*Cuando termines de sincronizar una película y revises Supabase,
deberías ver exactamente este patrón de datos en las tablas.*
*Si algo falta o está mal, vuelve a esta guía y revisa el paso correspondiente.*