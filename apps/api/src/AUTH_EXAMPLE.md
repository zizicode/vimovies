# Ejemplo de uso de Auth para Admin

## Configuración de Variables de Entorno

En tu archivo `.env`:

```bash
# Contraseña hardcodeada para admin (cámbiala en producción)
ADMIN_PASSWORD=tu_contraseña_segura_aqui

# Secreto para JWT (cámbialo en producción)
JWT_SECRET=tu_secreto_jwt_muy_largo_y_seguro
```

## Endpoint de Login

**POST** `/users/admin/login`

```json
{
  "password": "tu_contraseña_segura_aqui"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Respuesta error:**
```json
{
  "success": false,
  "error": "Credenciales inválidas"
}
```

## Usar el Middleware en Rutas Admin

```typescript
import { Hono } from 'hono'
import { createAuthMiddleware } from '@vimovies/utils'

export const adminRoutes = new Hono()

// Aplicar middleware a todas las rutas admin
adminRoutes.use('*', createAuthMiddleware('admin'))

// Ahora todas las rutas requieren token válido
adminRoutes.get('/users', async (c) => {
  const userId = c.get('userId') // ID del admin
  // Tu lógica aquí
})
```

## Usar el Middleware en Rutas Específicas

```typescript
import { Hono } from 'hono'
import { createAuthMiddleware } from '@vimovies/utils'

export const mediaRoutes = new Hono()

// Solo proteger rutas específicas
mediaRoutes.get('/', async (c) => {
  // Pública
})

mediaRoutes.post('/', createAuthMiddleware('admin'), async (c) => {
  // Requiere token admin
  const userId = c.get('userId')
  // Tu lógica aquí
})
```

## Enviar el Token en Requests

En el header `Authorization`:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Ejemplo con Fetch

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/users/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    password: 'tu_contraseña'
  })
})

const { data } = await loginResponse.json()
const token = data.token

// 2. Usar el token en requests admin
const adminResponse = await fetch('http://localhost:3000/admin/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

## Funciones Disponibles en auth.utils

```typescript
import {
  hashPassword,           // Encriptar contraseña (PBKDF2)
  verifyPassword,         // Verificar contraseña contra hash
  verifyHardcodedPassword, // Verificar contra contraseña hardcodeada
  generateToken,          // Generar JWT
  verifyToken,            // Verificar JWT
  extractTokenFromHeader, // Extraer token del header Authorization
  createAuthMiddleware,   // Crear middleware para Hono
} from '@vimovies/utils'
```

## Notas de Seguridad

1. **Cambia las contraseñas por defecto** en producción
2. **Usa HTTPS** en producción para proteger el token
3. **El token expira en 24 horas** - después debe loguearse nuevamente
4. **La contraseña hardcodeada** solo se usa para admin, no se almacena en BD
5. **El userId del admin** es `00000000-0000-0000-0000-000000000000` (fijo)
