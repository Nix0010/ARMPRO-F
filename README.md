# ARMPRO-F

Plataforma full-stack para entrenamiento de armwrestling. El proyecto combina una interfaz web moderna, backend en Node.js, base de datos MySQL y modulos pensados para rutinas, seguimiento, comunidad y asistencia con IA.

> Proyecto de portafolio desarrollado por Leyder Alvarez / NetFlow para demostrar construccion de aplicaciones web completas, modulares y orientadas a una comunidad especifica.

## Resumen

ARMPRO-F busca digitalizar la experiencia de entrenamiento de armwrestling: rutinas, progreso, recomendaciones, contenido y herramientas de gestion desde una sola plataforma. Su arquitectura permite separar frontend, backend, modulos de negocio y esquemas compartidos.

## Funcionalidades principales

- Panel web para usuarios y experiencia responsive.
- Modulos de entrenamiento y rutinas.
- Base para coach con IA y recomendaciones.
- Gamificacion con niveles, logros o progreso.
- Marketplace o seccion comercial para rutinas, productos o sesiones.
- Autenticacion y seguridad con JWT.
- API tipada con tRPC.
- Esquemas compartidos con Zod.
- Persistencia con MySQL y Drizzle ORM.

## Stack tecnologico

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=fff)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=fff)
![tRPC](https://img.shields.io/badge/tRPC-Typed_API-2596BE?logo=trpc&logoColor=fff)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql&logoColor=fff)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F)

## Arquitectura

```text
ARMPRO-F/
|-- client/    Aplicacion frontend React + Vite
|-- server/    Backend Node.js + Express + tRPC
|-- shared/    Tipos, validaciones y contratos compartidos
|-- drizzle/   Esquemas y migraciones de base de datos
```

## Valor como proyecto

Este repositorio muestra capacidades clave para proyectos reales de negocio:

- Construccion de interfaces modernas y mantenibles.
- Backend modular con APIs tipadas.
- Modelado de datos y migraciones.
- Integracion de autenticacion, seguridad y validacion.
- Base para funcionalidades con IA y productos digitales.

## Instalacion local

### Requisitos

- Node.js 18+
- pnpm
- MySQL

### Configuracion

```bash
git clone https://github.com/Nix0010/ARMPRO-F.git
cd ARMPRO-F
pnpm install
```

Crear archivo `.env`:

```env
DATABASE_URL=mysql://usuario:password@localhost:3306/armpro_db
JWT_SECRET=tu_secreto_seguro
NODE_ENV=development
```

Preparar base de datos:

```bash
pnpm run db:push
```

Ejecutar proyecto:

```bash
pnpm run dev
```

## Scripts

```bash
pnpm run dev      # Desarrollo
pnpm run build    # Build de produccion
pnpm run start    # Iniciar build
pnpm run check    # Validacion TypeScript
pnpm run test     # Pruebas con Vitest
pnpm run db:push  # Migraciones Drizzle
```

## Autor

**Leyder Alvarez**  
Desarrollador web y automatizaciones bajo la marca **NetFlow**.

GitHub: [@Nix0010](https://github.com/Nix0010)