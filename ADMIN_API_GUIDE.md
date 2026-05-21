# Guía de API Admin - Vimovies

## Autenticación

### Login Admin
**POST** `/api/auth/admin/login`

```json
{
  "password": "tu_contraseña_admin"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "00000000-0000-0000-0000-000000000000",
      "role": "admin"
    }
  }
}
```

### Usar el Token
Todas las rutas admin requieren el token en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Endpoints CRUD Disponibles

### 📊 Media (Películas/Series)

**Listar media (admin)**
- `GET /api/media/admin?page=1&per_page=20&status=published&noindex=false`

**Obtener media por ID**
- `GET /api/media/admin/:id`

**Actualizar campos editoriales**
- `PATCH /api/media/admin/:id`
- Body: `{ synopsis_es, synopsis_en, editorial_review_es, editorial_review_en, editorial_rating, status, noindex }`

**Eliminar media**
- `DELETE /api/media/admin/:id`

**Sincronizar géneros**
- `POST /api/media/admin/:id/genres`
- Body: `{ genre_ids: [1, 2, 3] }`

**Sincronizar videos**
- `POST /api/media/admin/:id/videos`
- Body: `{ videos: [...] }`

---

### 🎭 Géneros

**Listar géneros (público)**
- `GET /api/genres`

**Crear género**
- `POST /api/genres/admin`
- Body: `{ tmdb_id, slug, name_es, name_en, description_es, description_en, cover_image_url }`

**Actualizar género**
- `PATCH /api/genres/admin/:id`
- Body: `{ name_es, name_en, description_es, description_en, cover_image_url }`

**Eliminar género**
- `DELETE /api/genres/admin/:id`

---

### 📝 Artículos

**Listar artículos (admin)**
- `GET /api/articles/admin?page=1&per_page=20&status=published&intent=informational&author_id=xxx`

**Obtener artículo por ID**
- `GET /api/articles/admin/:id`

**Crear artículo**
- `POST /api/articles/admin`
- Body: `{ slug, author_id, category_id, title_es, title_en, excerpt_es, excerpt_en, content_es, content_en, cover_image_url, intent, status, locale, primary_keyword_es, primary_keyword_en, secondary_keywords }`

**Actualizar artículo**
- `PATCH /api/articles/admin/:id`
- Body: (mismos campos que crear)

**Publicar artículo**
- `POST /api/articles/admin/:id/publish`

**Archivar artículo**
- `POST /api/articles/admin/:id/archive`

**Eliminar artículo**
- `DELETE /api/articles/admin/:id`

**Gestionar FAQs**
- `POST /api/articles/admin/:id/faqs` - Crear FAQ
- `PATCH /api/articles/admin/faqs/:id` - Actualizar FAQ
- `DELETE /api/articles/admin/faqs/:id` - Eliminar FAQ

**Sincronizar menciones de media**
- `PUT /api/articles/admin/:id/mentions`
- Body: `{ mentions: [{ media_id, mention_type, display_order }] }`

**Sincronizar tags**
- `PUT /api/articles/admin/:id/tags`
- Body: `{ tag_ids: [1, 2, 3] }`

---

### 👥 Usuarios

**Listar usuarios (admin)**
- `GET /api/users/admin?page=1&per_page=30`

**Actualizar rol de usuario**
- `PATCH /api/users/admin/:id/role`
- Body: `{ role: "admin" | "editor" | "viewer" }`

**Desactivar usuario**
- `PATCH /api/users/admin/:id/deactivate`

**Listar reviews (admin)**
- `GET /api/users/admin/reviews?media_id=xxx&page=1&per_page=20`

**Moderar review**
- `PATCH /api/users/admin/reviews/:id/moderate`
- Body: `{ isVisible: true | false }`

---

### 📺 Plataformas

**Listar plataformas (público)**
- `GET /api/platforms`

**Listar plataformas (admin)**
- `GET /api/platforms/admin`

**Crear plataforma**
- `POST /api/platforms/admin`
- Body: `{ slug, name_es, name_en, description_es, description_en, logo_url, website_url, platform_type, affiliate_url_es, affiliate_url_en, affiliate_id, tmdb_provider_id, is_active, display_order }`

**Actualizar plataforma**
- `PATCH /api/platforms/admin/:id`
- Body: (mismos campos que crear)

**Eliminar plataforma**
- `DELETE /api/platforms/admin/:id`

**Sincronizar providers de media**
- `POST /api/platforms/admin/media/:mediaId/providers/sync`

**Actualizar datos de afiliado**
- `PATCH /api/platforms/admin/providers/:id/affiliate`

---

### 📋 Listas Curadas

**Listar listas (público)**
- `GET /api/lists`

**Crear lista curada**
- `POST /api/lists/admin`
- Body: `{ slug, title_es, title_en, description_es, description_en, cover_image_url, list_type, is_auto_updated, status, author_id, genre_id }`

**Actualizar lista curada**
- `PATCH /api/lists/admin/:id`
- Body: (mismos campos que crear)

**Eliminar lista curada**
- `DELETE /api/lists/admin/:id`

**Sincronizar items de lista**
- `PUT /api/lists/admin/:id/items`
- Body: `{ items: [{ media_id, rank_position, note_es, note_en }] }`

**Agregar item a lista**
- `POST /api/lists/admin/:id/items`
- Body: `{ media_id, rank_position, note_es, note_en }`

**Eliminar item de lista**
- `DELETE /api/lists/admin/:id/items/:mediaId`

---

## Ejemplo de Uso con Fetch

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'tu_contraseña' })
})

const { data } = await loginResponse.json()
const token = data.token

// 2. Crear un género
const genreResponse = await fetch('http://localhost:3000/api/genres/admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    tmdb_id: 28,
    slug: 'accion',
    name_es: 'Acción',
    name_en: 'Action'
  })
})

const genre = await genreResponse.json()
console.log(genre)
```

---

## Notas de Seguridad

1. **Todas las rutas `/admin/*` requieren token válido**
2. **El token expira en 24 horas**
3. **Usa HTTPS en producción**
4. **Cambia la contraseña admin en producción**
5. **Las rutas `/users/me/*` requieren autenticación de usuario**
