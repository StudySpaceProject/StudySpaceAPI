# StudySpace - Backend API

Una plataforma inteligente de gestión de estudio que implementa metodologías de repaso espaciado, creación de notas inteligentes y seguimiento de progreso académico.

## Características Principales

- **Sistema de Repaso Espaciado**: Algoritmo adaptativo que programa repasos automáticamente
- **Gestión de Temas y Tarjetas**: Organización del contenido de estudio por materias
- **Dashboard de Progreso**: Seguimiento del rendimiento académico
- **API REST Completa**

## Stack Tecnológico

- **Backend**: Node.js + Express
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT + bcrypt
- **Validación**: Express Validator

## Instalación

### Prerrequisitos

- Node.js (v18 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

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

Crea el archivo `.env` con tus configuraciones, .env.example como guia:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/studyspace"
JWT_SECRET="tu-jwt-secret-muy-seguro"
PORT=3000
NODE_ENV=development
```

4. **Configurar la base de datos**
```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy


## Ejecutar la aplicación

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

La API estará disponible en `http://localhost:3000`

## Endpoints de la API

### Autenticación
- `POST /api/users/register` - Registro de usuario
- `POST /api/users/login` - Inicio de sesión
- `GET /api/users/:id` - Obtener perfil de usuario
- `GET /api/users/:id/dashboard` - Dashboard del usuario

### Temas de Estudio
- `POST /api/topics` - Crear tema
- `GET /api/topics/user/:userId` - Obtener temas del usuario
- `GET /api/topics/:id` - Obtener tema específico
- `PUT /api/topics/:id` - Actualizar tema
- `DELETE /api/topics/:id` - Eliminar tema
- `GET /api/topics/search/:userId?search=term` - Buscar temas

### Tarjetas de Estudio
- `POST /api/cards` - Crear tarjeta
- `GET /api/cards/topic/:topicId` - Obtener tarjetas de un tema
- `GET /api/cards/:id` - Obtener tarjeta específica
- `PUT /api/cards/:id` - Actualizar tarjeta
- `DELETE /api/cards/:id` - Eliminar tarjeta
- `GET /api/cards/search/:userId?search=term` - Buscar tarjetas

### Sistema de Repasos
- `GET /api/reviews/pending/:userId` - Repasos pendientes
- `POST /api/reviews/complete` - Completar repaso
- `GET /api/reviews/upcoming/:userId` - Próximos repasos
- `GET /api/reviews/card/:cardId/history` - Historial de repasos
- `PUT /api/reviews/reschedule/:reviewId` - Reprogramar repaso


## Algoritmo de Repaso Espaciado

El sistema implementa un algoritmo que ajusta los intervalos de repaso basado en la dificultad reportada:

- **Primera revisión**: 1, 3, o 7 días (según dificultad)
- **Revisiones subsecuentes**: Intervalos adaptativos
- **Fácil (1)**: Duplica el intervalo (máx. 30 días)
- **Medio (2)**: Multiplica por 1.3 (máx. 15 días)  
- **Difícil (3)**: Reinicia a 1 día

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo con nodemon
- `npm start` - Ejecutar en modo producción
- `npx prisma generate` - Generar cliente de Prisma
- `npx prisma migrate dev` - Crear nueva migración
- `npx prisma studio` - Abrir interfaz visual de BD

## Estado del Proyecto

**MVP Parcial** - Funcionalidades básicas implementadas para el lanzamiento inicial.
### Funcionalidades por Agregar
- Integración con google calendar
- Manejo de sesiones
- Autenticación con JWT

### Próximas Mejoras
- Autenticación OAuth con Google
- Subida de imágenes en tarjetas
- Subida de Audio en tarjets
- Compartir tarjetas
- Notificaciones push
- Analytics avanzados


# Integración con Google Calendar

Este proyecto permite interactuar con Google Calendar. Para que otros compañeros puedan usarlo, sigan estos pasos:

## 1. Crear un usuario en la base de datos

Antes de poder generar tokens de Google Calendar, cada usuario debe existir en la base de datos.

- Crear un usuario con los campos requeridos (ej: nombre, email, etc.).
Desde el proyecto hacer npx prisma studio y crear el usuario, la clave de estar Hasheda.

- Guardar el ID del usuario generado, ya que lo necesitarán más adelante.

## 2. Añadir el email como usuario de prueba

Avisar a Richard para que los agregue como usuarios de prueba

## 3. Generar el token de acceso

Con el usuario creado y el email agregado como usuario de prueba:

1.Desplegar el proyecto npm run dev

2. Abrir un navegador y entrar a:  
http://localhost:3000/auth/<ID_DEL_USUARIO>

Sustituye `<ID_DEL_USUARIO>` por el ID del usuario creado en la base de datos.
2. Se abrirá la pantalla de Google para autorizar el acceso a Calendar.
3. Una vez autorizado, el token se guardará y el usuario estará listo para interactuar con Google Calendar desde la app.

## 4. Uso en la aplicación

- A partir de aquí, el usuario podrá crear, ver o editar eventos en su Google Calendar mediante las funciones de la app.
