# StudySpace - Backend API

Una plataforma inteligente de gestión de estudio que implementa metodologías de repaso espaciado, creación de notas inteligentes, seguimiento de progreso académico e **integración automática con Google Calendar**.

## 🌟 Características Principales

- **Sistema de Repaso Espaciado**: Algoritmo adaptativo que programa repasos automáticamente
- **Gestión de Temas y Tarjetas**: Organización del contenido de estudio por materias
- **Dashboard de Progreso**: Seguimiento del rendimiento académico
- **🗓️ Integración con Google Calendar**: Creación automática de eventos para sesiones de estudio
- **🔐 Autenticación JWT**: Sistema de autenticación seguro con tokens
- **API REST Completa**: Endpoints protegidos y documentados

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Express
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT + bcrypt
- **Validación**: Express Validator
- **Integración Externa**: Google Calendar API
- **Middleware**: Autenticación JWT personalizada

## 📋 Instalación

### Prerrequisitos

- Node.js (v18 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn
- Cuenta de Google Cloud Platform (para Calendar API)

### Configuración

1. **Clonar el repositorio**
```bash
git clone <tu-repo-url>
cd studyspace
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea el archivo `.env` basado en `.env.example`:
```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/studyspace"

# Autenticación
JWT_SECRET="tu-jwt-secret-muy-seguro"

# Servidor
PORT=3000
NODE_ENV=development

# Google Calendar Integration
GOOGLE_CLIENT_ID="tu-google-client-id.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
```

4. **Configurar Google Calendar API**
   - Ir a [Google Cloud Console](https://console.cloud.google.com/)
   - Crear proyecto o seleccionar existente
   - Habilitar Google Calendar API
   - Crear credenciales OAuth 2.0
   - Agregar URL de redirección: `http://localhost:3000/auth/google/callback`

5. **Configurar la base de datos**
```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy
```

## 🚀 Ejecutar la aplicación

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

La API estará disponible en `http://localhost:3000`

## 📚 Endpoints de la API

### 🔐 Autenticación de Usuarios

#### Endpoints Públicos
- `POST /api/users/register` - Registro de usuario
- `POST /api/users/login` - Inicio de sesión

#### Endpoints Protegidos (requieren JWT)
- `GET /api/users/profile` - Obtener perfil del usuario autenticado
- `GET /api/users/dashboard` - Dashboard del usuario autenticado

### 📖 Gestión de Temas de Estudio

**Todos los endpoints requieren autenticación JWT**

- `POST /api/topics` - Crear tema
- `GET /api/topics` - Obtener temas del usuario autenticado
- `GET /api/topics/:id` - Obtener tema específico (solo si es del usuario)
- `PUT /api/topics/:id` - Actualizar tema (solo si es del usuario)
- `DELETE /api/topics/:id` - Eliminar tema (solo si es del usuario)
- `GET /api/topics/search?search=term` - Buscar temas del usuario

### 🗃️ Gestión de Tarjetas de Estudio

**Todos los endpoints requieren autenticación JWT**

- `POST /api/cards` - Crear tarjeta (con evento automático de Calendar)
- `GET /api/cards/topic/:topicId` - Obtener tarjetas de un tema (solo si es del usuario)
- `GET /api/cards/:id` - Obtener tarjeta específica (solo si es del usuario)
- `PUT /api/cards/:id` - Actualizar tarjeta (solo si es del usuario)
- `DELETE /api/cards/:id` - Eliminar tarjeta (elimina eventos de Calendar automáticamente)
- `GET /api/cards/search?search=term` - Buscar tarjetas del usuario

### 📅 Sistema de Repasos

**Todos los endpoints requieren autenticación JWT**

- `GET /api/reviews/pending` - Repasos pendientes del usuario
- `POST /api/reviews/complete` - Completar repaso (actualiza eventos de Calendar automáticamente)
- `GET /api/reviews/upcoming?days=7` - Próximos repasos del usuario
- `GET /api/reviews/card/:cardId/history` - Historial de repasos de una tarjeta
- `PUT /api/reviews/reschedule/:reviewId` - Reprogramar repaso (actualiza Calendar)

### 🗓️ Integración con Google Calendar

**Todos los endpoints requieren autenticación JWT**

#### Autenticación con Google
- `GET /auth/google/status` - Verificar estado de conexión con Google Calendar
- `GET /auth/google/connect` - Iniciar proceso de autorización OAuth
- `GET /auth/google/callback` - Callback automático de Google (no usar directamente)
- `POST /auth/google/sync` - Sincronizar sesiones pendientes con Calendar
- `DELETE /auth/google/disconnect` - Desconectar Google Calendar

#### Gestión de Eventos
- `POST /calendar/create-event` - Crear evento manual en Calendar

### 🔐 Autenticación JWT

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <tu-jwt-token>
```

El token se obtiene en `/api/users/login` o `/api/users/register`.

## 🗓️ Funcionalidades de Google Calendar

### ✨ Características Automáticas

1. **Creación Automática de Eventos**
   - Al crear una tarjeta → Se programa sesión para mañana
   - Evento incluye: tema, pregunta truncada, duración estimada
   - Recordatorios automáticos: 15 y 5 minutos antes

2. **Gestión Inteligente de Eventos**
   - Al completar sesión → Elimina evento actual, crea próximo
   - Al reprogramar → Actualiza fecha del evento
   - Al eliminar tarjeta → Elimina todos los eventos asociados

3. **Sincronización**
   - Conectar Calendar → Sincroniza sesiones existentes automáticamente
   - Comando manual de sincronización disponible
   - Manejo de tokens expirados con renovación automática

### 📋 Estructura de Eventos Creados

```
Estudio: Matemáticas
Tema: Matemáticas
Pregunta: ¿Cuál es la fórmula del teorema de Pitágoras?...
Intervalo: 3 días
Tiempo estimado: 30 minutos
Tip: Revisa la pregunta y respuesta antes de la sesión.
Creado por StudySpace
```

### 🔧 Configuración del Usuario

```javascript
// Verificar conexión
const response = await fetch('/auth/google/status', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Conectar Calendar
if (!response.authorized) {
  window.location.href = '/auth/google/connect';
}

// Sincronizar sesiones
await fetch('/auth/google/sync', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 📊 Algoritmo de Repaso Espaciado

El sistema implementa un algoritmo que ajusta los intervalos de repaso basado en la dificultad reportada:

### Primera Revisión
- **Fácil (1)**: 7 días
- **Medio (2)**: 3 días  
- **Difícil (3)**: 1 día

### Revisiones Subsecuentes
- **Fácil (1)**: Duplica el intervalo (máx. 30 días)
- **Medio (2)**: Multiplica por 1.3 (máx. 15 días)  
- **Difícil (3)**: Reinicia a 1 día

### Integración con Calendar
- Los eventos se crean automáticamente según estos intervalos
- Los recordatorios se configuran 15 y 5 minutos antes
- Los eventos se actualizan cuando cambian las fechas

## 🛡️ Seguridad

### Autenticación JWT
- Tokens con expiración de 24 horas
- Middleware de protección en todas las rutas sensibles
- Validación de ownership (usuarios solo acceden a sus recursos)

### Protección de Recursos
- Validación en controladores y servicios
- Queries con filtros de userId automáticos
- Errors 404 para recursos no encontrados o sin permisos

### Google Calendar
- Tokens de acceso y refresh almacenados de forma segura
- Renovación automática de tokens expirados
- Revocación completa al desconectar

## 🚧 Próximas Mejoras

### Funcionalidades Planeadas
- **Notificaciones Push**: Recordatorios nativos de la app
- **Analytics Avanzados**: Métricas de productividad y progreso
- **Compartir Contenido**: Compartir tarjetas entre usuarios
- **Multimedia**: Soporte para imágenes y audio en tarjetas


## 📝 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo con nodemon
- `npm start` - Ejecutar en modo producción
- `npx prisma generate` - Generar cliente de Prisma
- `npx prisma migrate dev` - Crear nueva migración
- `npx prisma studio` - Abrir interfaz visual de BD

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Estado del Proyecto

**MVP Completo** - Todas las funcionalidades básicas implementadas y sistema de Calendar integrado.

### ✅ Funcionalidades Completadas
- ✅ Sistema de usuarios con JWT
- ✅ Gestión completa de temas y tarjetas
- ✅ Algoritmo de repaso espaciado
- ✅ Integración completa con Google Calendar
- ✅ Creación automática de eventos
- ✅ Sincronización bidireccional
- ✅ Manejo de tokens y renovación automática
- ✅ Seguridad completa con ownership validation

### 🔄 En Desarrollo
- 🔄 Interfaz de usuario (frontend)
- 🔄 Testing automatizado
- 🔄 Documentación API con Swagger
- 🔄 Deploy en producción

