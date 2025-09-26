# StudySpace - Backend API

Una plataforma inteligente de gestión de estudio que implementa metodologías de repaso espaciado, creación de notas inteligentes, seguimiento de progreso académico e **integración automática con Google Calendar**.

## 🌟 Características Principales

- **Sistema de Repaso Espaciado**: Algoritmo adaptativo que programa repasos automáticamente basado en dificultad
- **Gestión de Temas y Tarjetas**: Organización del contenido de estudio por materias con colores personalizables
- **Dashboard de Progreso**: Seguimiento del rendimiento académico con estadísticas detalladas
- **🗓️ Integración con Google Calendar**: Creación y gestión automática de eventos para sesiones de estudio
- **🔐 Autenticación JWT**: Sistema de autenticación seguro con tokens de 48 horas
- **API REST Completa**: Endpoints protegidos y documentados con validación de ownership
- **🔍 Búsqueda Avanzada**: Sistema de búsqueda por temas y tarjetas

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Express 5.1.0
- **Base de Datos**: PostgreSQL con Prisma ORM 6.16.2
- **Autenticación**: JWT + bcrypt para hash de contraseñas
- **Validación**: Express Validator 7.2.1
- **Integración Externa**: Google Calendar API (googleapis 160.0.0)
- **Middleware**: Autenticación JWT personalizada con ownership validation
- **CORS**: Configurado para desarrollo y producción
- **Logging**: Morgan para logs de desarrollo

## 📋 Instalación y Configuración

### Prerrequisitos

- Node.js (v18 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn
- Cuenta de Google Cloud Platform (para Calendar API)

### Paso 1: Clonar y Configurar

```bash
git clone <tu-repo-url>
cd studyspace
npm install
```

### Paso 2: Configurar Variables de Entorno

Crea el archivo `.env` basado en `.env.example`:

```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/studyspace"

# Autenticación
JWT_SECRET="tu-jwt-secret-muy-seguro-y-largo"

# Servidor
PORT=3000
NODE_ENV=development

# Google Calendar Integration
GOOGLE_CLIENT_ID="tu-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

### Paso 3: Configurar Google Calendar API

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto o seleccionar existente
3. Habilitar **Google Calendar API**
4. Crear credenciales **OAuth 2.0**
5. Agregar URL de redirección autorizada:
   - `http://localhost:3000/api/auth/google/callback` (desarrollo)
   - `https://tudominio.com/api/auth/google/callback` (producción)

### Paso 4: Configurar Base de Datos

```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# (Opcional) Ver base de datos
npx prisma studio
```

### Paso 5: Ejecutar la Aplicación

```bash
# Desarrollo con auto-reload
npm run dev

# Producción
npm start
```

La API estará disponible en `http://localhost:3000`

## 📚 Documentación de Endpoints

### 🔐 Autenticación de Usuarios

#### Endpoints Públicos
- `POST /api/users/register` - Registro de usuario
- `POST /api/users/login` - Inicio de sesión

#### Endpoints Protegidos (requieren JWT)
- `GET /api/users/profile` - Obtener perfil del usuario
- `GET /api/users/dashboard` - Dashboard con estadísticas

### 📖 Gestión de Temas de Estudio

**Todos requieren autenticación JWT y validación de ownership**

- `POST /api/topics` - Crear tema
- `GET /api/topics` - Obtener temas del usuario
- `GET /api/topics/search?search=term` - Buscar temas 
- `GET /api/topics/:id` - Obtener tema específico
- `PUT /api/topics/:id` - Actualizar tema
- `DELETE /api/topics/:id` - Eliminar tema

### 🗃️ Gestión de Tarjetas de Estudio

**Todos requieren autenticación JWT y validación de ownership**

- `POST /api/cards` - Crear tarjeta (crea evento automático de Calendar)
- `GET /api/cards/topic/:topicId` - Obtener tarjetas de un tema
- `GET /api/cards/search?search=term` - Buscar tarjetas
- `GET /api/cards/:id` - Obtener tarjeta específica
- `PUT /api/cards/:id` - Actualizar tarjeta (actualiza eventos automáticamente)
- `DELETE /api/cards/:id` - Eliminar tarjeta (elimina eventos automáticamente)

### 📅 Sistema de Repasos

**Todos requieren autenticación JWT y validación de ownership**

- `GET /api/reviews/pending` - Repasos pendientes
- `POST /api/reviews/complete` - Completar repaso (algoritmo espaciado + Calendar)
- `GET /api/reviews/upcoming?days=7` - Próximos repasos
- `GET /api/reviews/card/:cardId/history` - Historial de repasos
- `PUT /api/reviews/reschedule/:reviewId` - Reprogramar repaso

### 🗓️ Integración con Google Calendar

**Todos requieren autenticación JWT**

- `GET /api/auth/google/connect` - Iniciar autorización OAuth
- `GET /api/auth/google/callback` - Callback automático (no usar directamente)

## 🧪 Testing de Endpoints

### Configuración de Testing

Para probar los endpoints, necesitas:
1. Usuario registrado y token JWT
2. Herramienta como Postman, Thunder Client o curl
3. Base de datos configurada

### Flujo de Testing Recomendado

#### 1. **Registro y Autenticación**

```http
### Registro
POST http://localhost:3000/api/users/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456"
}

### Login
POST http://localhost:3000/api/users/login
Content-Type: application/json

{
  "email": "test@example.com", 
  "password": "123456"
}
```

#### 2. **Gestión de Temas**

```http
### Crear tema
POST http://localhost:3000/api/topics
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Matemáticas",
  "description": "Álgebra y cálculo básico",
  "color": "#FF6B6B"
}

### Obtener temas
GET http://localhost:3000/api/topics
Authorization: Bearer {{token}}

### Buscar temas
GET http://localhost:3000/api/topics/search?search=matematicas
Authorization: Bearer {{token}}
```

#### 3. **Gestión de Tarjetas**

```http
### Crear tarjeta
POST http://localhost:3000/api/cards
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "topicId": 1,
  "question": "¿Cuál es la fórmula del teorema de Pitágoras?",
  "answer": "a² + b² = c², donde c es la hipotenusa"
}

### Obtener tarjetas de un tema
GET http://localhost:3000/api/cards/topic/1
Authorization: Bearer {{token}}

### Buscar tarjetas
GET http://localhost:3000/api/cards/search?search=pitagoras
Authorization: Bearer {{token}}
```

#### 4. **Sistema de Repasos**

```http
### Repasos pendientes
GET http://localhost:3000/api/reviews/pending
Authorization: Bearer {{token}}

### Completar repaso
POST http://localhost:3000/api/reviews/complete
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "scheduledReviewId": 1,
  "difficultyRating": 2
}

### Próximos repasos
GET http://localhost:3000/api/reviews/upcoming?days=7
Authorization: Bearer {{token}}
```

#### 5. **Google Calendar**

```http
### Conectar Google Calendar (redirige a OAuth)
GET http://localhost:3000/api/auth/google/connect
Authorization: Bearer {{token}}
```

#### 6. **Dashboard y Perfil**

```http
### Dashboard completo
GET http://localhost:3000/api/users/dashboard
Authorization: Bearer {{token}}

### Perfil del usuario
GET http://localhost:3000/api/users/profile
Authorization: Bearer {{token}}
```

### Escenarios de Testing

#### ✅ **Casos de Éxito**
- Registro con email válido y password ≥6 caracteres
- Login con credenciales correctas
- Crear temas con nombres únicos
- Crear tarjetas con pregunta ≥3 chars y respuesta ≥2 chars
- Completar repasos con rating 1, 2, o 3
- Buscar con términos ≥2 caracteres

#### ❌ **Casos de Error**
- Registro con email duplicado → 409
- Login con credenciales incorrectas → 401
- Acceso sin token JWT → 401
- Token JWT inválido → 401
- Acceso a recursos de otros usuarios → 404
- Crear tarjeta con topicId inexistente → 404
- Parámetros faltantes o inválidos → 400


## 🗓️ Funcionalidades de Google Calendar

### ✨ Características Automáticas

1. **Creación Automática de Eventos**
   - Al crear tarjeta → Sesión programada para mañana 9:00 AM
   - Incluye: tema, pregunta truncada, duración estimada (30 min)
   - Recordatorios automáticos: 15 y 5 minutos antes
   - Color azul (#4) para identificación

2. **Gestión Inteligente de Eventos**
   - Al completar sesión → Elimina evento actual, crea próximo según algoritmo
   - Al reprogramar → Actualiza fecha del evento existente
   - Al eliminar tarjeta → Elimina todos los eventos asociados
   - Al actualizar pregunta → Actualiza descripción en eventos futuros

3. **Sincronización Automática**
   - Al conectar Calendar → Sincroniza sesiones pendientes automáticamente
   - Renovación automática de tokens expirados
   - Manejo robusto de errores de red

### 📋 Estructura de Eventos Creados

```
Título: Estudio: Matemáticas
Descripción:
Sesión de repaso espaciado

Tema: Matemáticas
Pregunta: ¿Cuál es la fórmula del teorema de Pitágoras?...

Intervalo: 3 días
Tiempo estimado: 30 minutos

Tip: Revisa la pregunta y respuesta antes de la sesión.

Creado por StudySpace
```

### 🔧 Flujo de Integración

1. **Usuario se autentica** → Obtiene JWT token
2. **Inicia conexión** → `GET /api/auth/google/connect`
3. **Google redirige** → Usuario autoriza permisos
4. **Callback automático** → Tokens guardados + sincronización
5. **Eventos automáticos** → Cada tarjeta/repaso crea/actualiza eventos

## 📊 Algoritmo de Repaso Espaciado

### Primera Revisión
- **Fácil (1)**: 7 días
- **Medio (2)**: 3 días  
- **Difícil (3)**: 1 día

### Revisiones Subsecuentes
- **Fácil (1)**: Duplica el intervalo (máx. 30 días)
- **Medio (2)**: Multiplica por 1.3 (máx. 15 días)  
- **Difícil (3)**: Reinicia a 1 día

### Integración con Calendar
- Los eventos se programan automáticamente según estos intervalos
- Los recordatorios se configuran 15 y 5 minutos antes
- Los eventos se actualizan cuando cambian las fechas de repaso

## 🛡️ Seguridad y Validaciones

### Autenticación JWT
- Tokens con expiración de 48 horas (2 días)
- Middleware de protección en todas las rutas sensibles
- Header: `Authorization: Bearer <token>`

### Protección de Recursos (Ownership Validation)
- Validación automática en controladores y servicios
- Queries con filtros de userId automáticos
- Los usuarios solo pueden acceder a sus propios recursos
- Errores 404 para recursos no encontrados o sin permisos

### Validaciones de Input
- Email único en registro
- Password mínimo 6 caracteres
- Nombres de temas mínimo 2 caracteres
- Preguntas mínimo 3 caracteres
- Respuestas mínimo 2 caracteres
- Términos de búsqueda mínimo 2 caracteres
- Ratings de dificultad solo 1, 2, o 3

### Google Calendar
- Tokens de acceso y refresh almacenados de forma segura
- Renovación automática de tokens expirados
- Revocación completa al desconectar
- Manejo robusto de errores de API

## 🔧 Scripts Disponibles

```bash
# Desarrollo con auto-reload
npm run dev

# Producción
npm start

# Base de datos
npx prisma generate      # Generar cliente
npx prisma migrate dev   # Nueva migración
npx prisma studio       # Interfaz visual
npx prisma migrate deploy # Deploy migraciones
```

## 📁 Estructura del Proyecto

```
studyspace/
├── controllers/         # Lógica de controladores
│   ├── usersController.js
│   ├── topicsController.js
│   ├── cardsController.js
│   ├── reviewsController.js
│   └── calendarController.js
├── services/           # Lógica de negocio
│   ├── userService.js
│   ├── topicService.js
│   ├── cardService.js
│   └── reviewService.js
├── middleware/         # Middlewares personalizados
│   └── authMiddleware.js
├── routes/            # Definición de rutas
│   └── auth.js
├── prisma/           # Esquema y migraciones
│   ├── schema.prisma
│   └── migrations/
├── lib/              # Utilidades
│   └── prisma.js
├── app.js           # Configuración de Express
├── server.js        # Servidor HTTP
└── package.json     # Dependencias
```

## ⚡ Estado del Proyecto

**MVP Completo** - Todas las funcionalidades básicas implementadas y sistema de Calendar completamente integrado.

### ✅ Funcionalidades Completadas
- ✅ Sistema de usuarios con JWT (48h expiration)
- ✅ Gestión completa de temas y tarjetas con validaciones
- ✅ Algoritmo de repaso espaciado adaptativo
- ✅ Integración completa con Google Calendar
- ✅ Creación automática de eventos con recordatorios
- ✅ Sincronización bidireccional
- ✅ Manejo de tokens OAuth y renovación automática
- ✅ Seguridad completa con ownership validation
- ✅ Sistema de búsqueda avanzada
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Manejo robusto de errores y logging
- ✅ CORS configurado para desarrollo y producción

### 🚀 Próximas Mejoras

#### Funcionalidades Planeadas
- **Notificaciones Push**: Recordatorios nativos de la app
- **Analytics Avanzados**: Métricas de productividad y progreso detallado
- **Compartir Contenido**: Sistema para compartir tarjetas entre usuarios
- **Multimedia**: Soporte para imágenes y audio en tarjetas
- **Gamificación**: Sistema de puntos y logros
- **Exportación**: Exportar datos en PDF/CSV
- **API Webhooks**: Integración con otras herramientas de estudio

## 🐛 Problemas Conocidos

- Los eventos de Calendar pueden fallar si el usuario revoca permisos manualmente
- La sincronización masiva puede ser lenta con muchas tarjetas (>100)
- Los tokens JWT no se renuevan automáticamente (requiere re-login cada 48h)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request
