# Control de Ausencias - Coro

Aplicación web para gestionar asistencias de miembros del coro.

## Tecnologías

- **Frontend**: HTML, CSS, JavaScript vanilla
- **Backend**: Vercel Serverless Functions
- **Base de datos**: Supabase (PostgreSQL)

## Configuración Local

1. Instalar dependencias:
```bash
npm install
```

2. Crear archivo `.env` con tus credenciales de Supabase:
```
SUPABASE_URL=https://erurdejbavrihruoqlao.supabase.co
SUPABASE_KEY=tu_clave_anon_aqui
```

3. Ejecutar en desarrollo:
```bash
npm run dev
```

## Despliegue en Vercel

1. Instala Vercel CLI (si no lo tienes):
```bash
npm install -g vercel
```

2. Inicia sesión en Vercel:
```bash
vercel login
```

3. Despliega el proyecto:
```bash
vercel
```

4. Configura las variables de entorno en Vercel:
   - Ve a tu proyecto en vercel.com
   - Settings → Environment Variables
   - Añade:
     - `SUPABASE_URL`: https://erurdejbavrihruoqlao.supabase.co
     - `SUPABASE_KEY`: tu_clave_anon

5. Redespliega para aplicar las variables:
```bash
vercel --prod
```

## Estructura del Proyecto

```
ausencias/
├── public/              # Archivos estáticos (frontend)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── api/                 # Funciones serverless
│   ├── miembros.js
│   ├── asistencias.js
│   └── historial.js
├── package.json
├── vercel.json
└── .env.example
```

## Base de Datos (Supabase)

### Tablas

**miembros**
- id (UUID, PK)
- nombre (TEXT)
- voz (TEXT)
- activo (BOOLEAN)
- fecha_registro (TIMESTAMP)

**asistencias**
- id (UUID, PK)
- fecha (DATE)
- tipo (TEXT)
- id_miembro (UUID, FK)
- nombre (TEXT)
- ausente (BOOLEAN)
- notas (TEXT)
- created_at (TIMESTAMP)

## APIs

### GET /api/miembros
Obtiene lista de miembros activos

### POST /api/miembros
Añade un nuevo miembro
```json
{
  "nombre": "Juan Pérez",
  "voz": "Tenor"
}
```

### POST /api/asistencias
Registra asistencia de un evento
```json
{
  "fecha": "2025-10-03",
  "tipo": "Ensayo",
  "ausentes": ["uuid1", "uuid2"],
  "notas": "Justificación..."
}
```

### GET /api/historial?limit=20
Obtiene historial de asistencias

## Licencia

MIT
