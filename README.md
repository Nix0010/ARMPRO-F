# ARMPRO 🦾
**Plataforma Integral de Entrenamiento de Armwrestling**

ARMPRO es una aplicación full-stack moderna diseñada para llevar el entrenamiento de armwrestling (lucha de brazos) al siguiente nivel. Ofrece herramientas avanzadas como un Coach impulsado por IA, gestión de rutinas personalizadas, gamificación y un marketplace integrado.

## 🚀 Características Principales (Features)
- **AI Coach**: Asistente inteligente que analiza tu progreso y sugiere mejoras en tus técnicas.
- **Rutinas de Entrenamiento**: Creación, seguimiento y optimización de rutinas específicas para armwrestling.
- **Gamificación**: Sistema de logros, niveles y recompensas para mantener la motivación.
- **Marketplace**: Espacio para adquirir rutinas premium, equipos o sesiones de coaching.
- **Calendario y Notificaciones**: Gestión de sesiones de entrenamiento y recordatorios en tiempo real.

## 🛠️ Stack Tecnológico
- **Frontend**: React 19, TypeScript, Tailwind CSS, Radix UI, Framer Motion
- **Estado y Fetching**: TanStack Query (React Query), tRPC
- **Backend**: Node.js, Express, TypeScript, tRPC Server
- **Base de Datos**: MySQL
- **ORM**: Drizzle ORM
- **Otros**: Pino (Logging), Zod (Validación), JWT (Autenticación)

## 📁 Estructura del Proyecto
El proyecto sigue una arquitectura modular y orientada a dominios:
```text
/
├── client/           # Aplicación Frontend (React + Vite)
├── server/           # Aplicación Backend (Node.js + Express + tRPC)
│   ├── modules/      # Lógica de negocio modularizada (aiCoach, routine, etc.)
│   └── _core/        # Configuraciones centrales del servidor
├── shared/           # Tipos, esquemas y utilidades compartidas (Zod)
└── drizzle/          # Esquemas de base de datos y migraciones
```

## ⚙️ Requisitos Previos
- [Node.js](https://nodejs.org/) (v18 o superior)
- [pnpm](https://pnpm.io/) (Recomendado como gestor de paquetes)
- [MySQL](https://www.mysql.com/) (Servidor de base de datos en ejecución)

## 💻 Instalación y Ejecución Local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/TU_USUARIO/ARMPRO-F.git
   cd ARMPRO-F
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**
   Crea un archivo `.env` en la raíz del proyecto. Asegúrate de **NUNCA** subir este archivo al repositorio.
   ```env
   # Base de datos
   DATABASE_URL=mysql://usuario:contraseña@localhost:3306/armpro_db
   
   # Autenticación y Secretos
   JWT_SECRET=tu_secreto_super_seguro
   
   # Entorno
   NODE_ENV=development
   ```

4. **Preparar la Base de Datos**
   ```bash
   # Generar y aplicar migraciones con Drizzle
   pnpm run db:push
   ```

5. **Ejecutar en modo desarrollo**
   ```bash
   pnpm run dev
   ```
   El cliente y el servidor se iniciarán concurrentemente.

## 📜 Scripts Disponibles
- `pnpm run dev`: Inicia el servidor y cliente en modo desarrollo.
- `pnpm run build`: Construye el proyecto para producción (Vite build + esbuild).
- `pnpm run start`: Inicia el servidor en producción utilizando los archivos compilados.
- `pnpm run db:push`: Sincroniza el esquema de Drizzle con la base de datos MySQL.
- `pnpm run check`: Ejecuta la validación de tipos de TypeScript.
- `pnpm run test`: Ejecuta las pruebas unitarias con Vitest.

## 🛡️ Licencia
Este proyecto está bajo la Licencia [MIT](LICENSE).

---
*Desarrollado para la comunidad de Armwrestling.*