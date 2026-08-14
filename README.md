# NutrIA — Documentación del proyecto

> 🥗 **NutrIA** — Asistente de nutrición inteligente: seguimiento de peso, meta calórica, rutinas y biblioteca de alimentos.

---

## Tabla de contenido

1. [Resumen](#1-resumen)
2. [Arquitectura y estructura del repositorio](#2-arquitectura-y-estructura-del-repositorio)
3. [Prerrequisitos](#3-prerrequisitos)
4. [Instalación desde cero: WSL, Docker y PostgreSQL](#4-instalación-desde-cero-wsl-docker-y-postgresql)
5. [Configuración del proyecto (primera vez)](#5-configuración-del-proyecto-primera-vez)
6. [Flujo de trabajo diario](#6-flujo-de-trabajo-diario)
7. [Backend — Referencia técnica](#7-backend--referencia-técnica)
8. [Frontend — Referencia](#8-frontend--referencia)
9. [Solución de problemas](#9-solución-de-problemas)
10. [Roadmap / pendientes](#10-roadmap--pendientes)

---

## 1. Resumen

NutrIA es una aplicación web de nutrición compuesta por:

- **Frontend**: React + Vite (`nutria-frontend`), manejado con **Bun**.
- **Backend**: Django 6 + Django REST Framework + JWT (`nutria-backend`).
- **Base de datos**: PostgreSQL 16 corriendo en **Docker dentro de WSL (Debian)**.
- **Autenticación**: JWT (tokens `access` / `refresh`) con `djangorestframework-simplejwt`.

La API expone el mismo contrato que el backend anterior (Express/SQL Server, en `nutria-backend-old`, conservado como referencia): login, registro de usuarios y CRUD de alimentos.

---

## 2. Arquitectura y estructura del repositorio

### 2.1 Cómo se comunican las piezas

```
        Windows                         WSL (Debian)
┌───────────────────────┐      ┌──────────────────────────┐
│  Frontend (Vite)      │      │  Docker Engine           │
│  http://localhost:5173│─────▶│   └─ Contenedor nutria-db│
│        │ proxy /api   │      │      PostgreSQL 16       │
│        ▼              │      │      localhost:5432      │
│  Backend (Django)     │◀────┤                          │
│  http://localhost:3000│  WSL2│  (localhost forwarding)  │
└───────────────────────┘      └──────────────────────────┘
```

- El **frontend** redirige las peticiones `/api/*` al backend (proxy de Vite, puerto **3000**).
- El **backend Django** corre en Windows y se conecta a Postgres por `localhost:5432` (WSL2 reenvía el puerto automáticamente).
- El **contenedor Postgres** corre dentro de WSL y sobrevive reinicios (ver §4 y §9).

### 2.2 Estructura del repositorio

```
nutrIA/
├── env/                      # Virtualenv Python 3.14 (Django 6.1 y dependencias)
├── nutria-backend/           # Backend Django (nuevo)
│   ├── config/               # Proyecto Django (settings, urls, wsgi/asgi)
│   ├── core/                 # App principal (modelos, vistas, serializers, admin)
│   │   ├── management/commands/seed.py
│   │   ├── authentication.py # Autenticación JWT contra el modelo Usuario
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── .env                  # Variables de entorno (NO se versiona)
│   ├── .env.example          # Plantilla documentada
│   ├── docker-compose.yml    # PostgreSQL 16
│   ├── requirements.txt
│   └── manage.py
├── nutria-backend-old/       # Backend anterior Express + SQL Server (referencia)
└── nutria-frontend/          # Frontend React + Vite
    └── src/
        ├── App.jsx           # Dashboard principal (login, objetivo, progreso, rutinas, alimentos)
        ├── Registro.jsx      # Registro de usuarios
        └── Alimentos.jsx     # Biblioteca de alimentos
```

---

## 3. Prerrequisitos

Antes de empezar necesitas:

| Herramienta | Versión | Dónde | Se instala en |
|---|---|---|---|
| Windows | 10/11 | — | — |
| WSL 2 + Debian | — | Windows | §4.2 |
| Docker Engine + compose | — | Dentro de Debian (WSL) | §4.3 |
| Python | 3.14 | Windows (virtualenv `env/`) | §5.1 |
| Bun | último | Windows | §5.2 |
| PostgreSQL | 16 | Contenedor Docker (`nutria-db`) | §4.4 |

> Si no tienes WSL o Docker instalados, sigue la **sección 4** completa. Si ya los tienes funcionando, ve directo a la **sección 5**.

---

## 4. Instalación desde cero: WSL, Docker y PostgreSQL

> Guía paso a paso para dejar preparada la máquina **desde cero**. Asume que no tienes WSL ni Docker instalados.

### 4.1 ¿Qué es cada pieza?

- **WSL (Windows Subsystem for Linux)**: capa de Microsoft que permite correr una distribución de Linux (aquí **Debian**) dentro de Windows.
- **Docker Engine**: servicio que ejecuta contenedores; se instala **dentro** de la distro Debian.
- **PostgreSQL**: el motor de base de datos, que corre **en un contenedor** (`nutria-db`) definido por `docker-compose.yml`.
- El backend Django corre en **Windows** (venv `env/`) y se conecta a Postgres a través de `localhost:5432`.

### 4.2 Instalar y configurar WSL

**1. Habilitar WSL y las características de Windows.** Abre PowerShell como **administrador** y ejecuta:

```powershell
wsl --install
```

Esto habilita WSL2, instala el kernel de Linux y (por defecto) la distro Ubuntu. **Reinicia Windows** cuando termine.

**2. Verificar WSL2** (debe decir que la versión es 2):

```powershell
wsl -l -v
```

Si una distro aparece como versión 1, convertirla:

```powershell
wsl --set-version Debian 2
```

**3. Instalar Debian** (la distro que usa el proyecto). Desde Microsoft Store busca *"Debian"* e instálala, o usa:

```powershell
wsl --install -d Debian
```

Al abrirla por primera vez te pedirá crear un usuario y contraseña de Linux (no es la cuenta de Windows).

**4. Hacer Debian la distro por defecto** (opcional):

```powershell
wsl --set-default Debian
```

**5. Activar systemd** (permite que Docker arranque solo al abrir WSL). Dentro de Debian, crea/edita el archivo:

```bash
sudo nano /etc/wsl.conf
```

Con este contenido:

```ini
[boot]
systemd=true
```

Aplica los cambios apagando WSL por completo y volviendo a abrir:

```powershell
wsl --shutdown
```

Al reabrir, verifica que systemd esté activo:

```bash
ps -p 1 -o comm=
# Debe imprimir: systemd
```

### 4.3 Instalar Docker Engine dentro de Debian

**1. Actualizar los paquetes e instalar Docker:**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2
```

> `docker.io` es el motor de Docker y `docker-compose-v2` el plugin `docker compose` (si tu versión no trae el plugin, instálalo con: `sudo apt install -y docker-compose` y usa `docker-compose up -d`).

**2. Habilitar que Docker arranque solo al iniciar WSL:**

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

**3. Verificar:**

```bash
sudo systemctl status docker
docker --version
docker compose version
```

> **Sin `sudo` (opcional):** para usar `docker` sin escribir `sudo` cada vez, agrega tu usuario al grupo docker y vuelve a abrir la terminal:
> ```bash
> sudo usermod -aG docker $USER
> exit   # vuelve a abrir WSL
> ```

### 4.4 Montar el contenedor PostgreSQL

**1. Colocar el proyecto donde WSL pueda verlo.** El proyecto vive en Windows; WSL2 lo monta automáticamente en `/mnt/c/...`:

```bash
ls /mnt/c/Users/juanma/Documents/desarrollo/nutrIA/nutria-backend
```

**2. Editar `.env`** (crear a partir de `.env.example`) y definir `DB_PASSWORD` (la usa el contenedor para crear la BD y el usuario):

```bash
cd /mnt/c/Users/juanma/Documents/desarrollo/nutrIA/nutria-backend
nano .env
```

**3. Levantar el contenedor:**

```bash
docker compose up -d
```

Docker baja la imagen `postgres:16-alpine`, crea el volumen `postgres_data` y arranca el contenedor `nutria-db`.

**4. Verificar:**

```bash
docker ps                       # nutria-db debe aparecer con estado Up (healthy)
docker logs nutria-db           # debe mostrar "database system is ready to accept connections"
```

**5. Probar la conexión desde Windows** (PowerShell):

```powershell
Test-NetConnection localhost -Port 5432   # TcpTestSucceeded: True
```

Si falla, obtener la IP del WSL y usarla en `DB_HOST`:

```powershell
wsl -d Debian hostname -I
```

---

## 5. Configuración del proyecto (primera vez)

> Con la base de datos arriba (§4.4), prepara el backend y el frontend. **Solo se hace una vez.**

### 5.1 Backend (Django)

**1. Instalar dependencias Python** (desde la raíz del repo, en Windows):

```powershell
env\Scripts\pip.exe install -r nutria-backend\requirements.txt
```

Dependencias (`nutria-backend/requirements.txt`):

| Paquete | Versión |
|---|---|
| Django | 6.1 |
| djangorestframework | 3.18.0 |
| djangorestframework-simplejwt | 5.5.1 |
| django-cors-headers | 4.9.0 |
| psycopg[binary] | 3.3.4 |
| python-dotenv | 1.2.2 |

**2. Configurar el `.env`** — copia `nutria-backend/.env.example` a `nutria-backend/.env` y completa los valores. Plantilla completa:

```ini
# ============================================================
# NutrIA Backend - Variables de entorno
# Copia este archivo a .env y completa los valores.
# ============================================================

# ---------- Django ----------
# Clave secreta (genera una nueva con: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
DJANGO_SECRET_KEY=
# Debug (False en producción)
DJANGO_DEBUG=True
# Hosts permitidos, separados por coma
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
# Puerto donde corre el backend Django (3000 = el proxy de Vite lo espera)
DJANGO_PORT=3000
# Zona horaria
DJANGO_TIME_ZONE=UTC
# Orígenes CORS permitidos, separados por coma
CORS_ALLOWED_ORIGINS=http://localhost:5173

# ---------- Base de datos (PostgreSQL en Docker) ----------
DB_NAME=nutria
DB_USER=nutria
# Obligatoria: la usa el contenedor postgres para crear el usuario
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432

# ---------- JWT ----------
# Duración en días de los tokens
JWT_ACCESS_TTL_DAYS=1
JWT_REFRESH_TTL_DAYS=7
```

> El `DJANGO_SECRET_KEY` vacío se llena con el comando indicado; `DB_PASSWORD` debe coincidir con la que usará el contenedor (§4.4). El resto de variables se explican en [§7.1](#71-variables-de-entorno-env).

**3. Aplicar migraciones y sembrar datos:**

```powershell
env\Scripts\python.exe nutria-backend\manage.py makemigrations core   # crear migraciones (una vez)
env\Scripts\python.exe nutria-backend\manage.py migrate               # aplicar migraciones
env\Scripts\python.exe nutria-backend\manage.py seed                  # datos base
```

El comando `seed` crea:

- **Roles**: `1. Administrador`, `2. Usuario`
- **Categorías**: Proteínas, Carbohidratos, Grasas, Bebidas
- **Alimentos** (12 ejemplos): pechuga de pollo, atún, huevo, arroz, avena, papa, aguacate, almendras, aceite de oliva, agua, jugo de naranja, leche descremada.

**4. Crear el superusuario del admin** (la cuenta del panel, independiente de los usuarios de la app):

```powershell
env\Scripts\python.exe nutria-backend\manage.py createsuperuser
```

> Ver [§7.6](#76-panel-de-administración-de-django) para más detalles.

**5. Verificar que el backend arranca:**

```powershell
env\Scripts\python.exe nutria-backend\manage.py runserver 3000
```

Servidor en `http://localhost:3000`.

### 5.2 Frontend (React + Vite)

**1. Instalar [Bun](https://bun.sh)** (no se usa npm):

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**2. Instalar dependencias y arrancar:**

```bash
cd nutria-frontend
bun install
bun run dev
```

Servidor en `http://localhost:5173`.

### 5.3 Verificación rápida

Con backend y frontend corriendo:

1. Abre `http://localhost:5173` y regístrate (o usa el usuario de prueba).
2. Comprueba la biblioteca de alimentos (viene de `GET /api/alimentos`).
3. Entra al admin en `http://localhost:3000/admin/` con el superusuario.

---

## 6. Cómo correr el proyecto (todo instalado)

> Para el uso cotidiano, con todo ya configurado (§4 y §5). Se levantan **3 procesos** en orden:

| # | Proceso | Dónde | Puertos |
|---|---|---|---|
| 1 | Contenedor `nutria-db` (PostgreSQL) | WSL Debian | 5432 |
| 2 | Backend Django | Windows (PowerShell) | 3000 |
| 3 | Frontend Vite | Windows (PowerShell) | 5173 |

### 6.1 Paso 1 — Base de datos (WSL)

Abre una terminal de WSL Debian y verifica que el contenedor ya está arriba:

```bash
docker ps
```

- **`nutria-db` en estado `Up`** → listo, ve al Paso 2. Con `restart: always`, arranca solo al abrir WSL, así que normalmente **no hace falta nada aquí**.
- **No aparece** → levántalo (primera vez o tras `docker compose stop`):

```bash
cd /mnt/c/Users/juanma/Documents/desarrollo/nutrIA/nutria-backend
docker compose up -d
docker ps   # debe aparecer Up (healthy)
```

> 💡 Si te pide `sudo` para docker, consulta §9 (grupo docker).

### 6.2 Paso 2 — Backend Django (Windows)

En una terminal de **PowerShell**, desde la raíz del repo (`C:\Users\juanma\Documents\desarrollo\nutrIA`):

```powershell
env\Scripts\python.exe nutria-backend\manage.py runserver 3000
```

Cuando esté listo verás un log similar a:

```
Starting development server at http://127.0.0.1:3000/
Quit the server with CONTROL-C.
```

Comprueba que responde: abre `http://localhost:3000/api/alimentos` (debe devolver el JSON con los alimentos).

### 6.3 Paso 3 — Frontend Vite (Windows)

En otra terminal de **PowerShell**:

```powershell
cd nutria-frontend
bun run dev
```

Al arrancar verás `http://localhost:5173` en el log.

### 6.4 Verificación final

| URL | Qué debe mostrar |
|---|---|
| `http://localhost:5173` | La app NutrIA (login/registro) |
| `http://localhost:3000/admin/` | Panel admin (login con el superusuario) |
| `http://localhost:3000/api/alimentos` | JSON con los 12 alimentos del seed |

### 6.5 Apagar todo

- **Frontend y backend**: `Ctrl + C` en cada terminal de PowerShell.
- **Base de datos**: se queda corriendo (opcional). Para apagarla:
  - `docker compose down` en WSL (detiene el contenedor y conserva los datos del volumen).
  - La próxima vez que abras WSL volverá sola.

### 6.6 Troubleshooting rápido (día a día)

| Síntoma | Revisa |
|---|---|
| El login dice error de conexión | Que `docker ps` muestre `nutria-db` Up y que `Test-NetConnection localhost -Port 5432` sea `True`. |
| `runserver` dice que el puerto 3000 está en uso | Otra instancia de Django sigue abierta: cierra esa terminal o mata el proceso (ver §9). |
| El frontend carga pero la API no responde | Que el backend esté corriendo en el puerto **3000** (el proxy de Vite apunta ahí, §8.1). |
| Error CORS en la consola del navegador | Que `CORS_ALLOWED_ORIGINS` en `.env` incluya `http://localhost:5173` y reiniciar el backend. |

---

## 7. Backend — Referencia técnica

### 7.1 Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `DJANGO_SECRET_KEY` | Clave secreta de Django. Generar: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DJANGO_DEBUG` | `True` en desarrollo, `False` en producción |
| `DJANGO_ALLOWED_HOSTS` | Hosts permitidos, separados por coma (`localhost,127.0.0.1`) |
| `DJANGO_PORT` | Puerto del backend (`3000`, lo espera el proxy de Vite) |
| `DJANGO_TIME_ZONE` | Zona horaria (`UTC` por defecto) |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos, separados por coma (`http://localhost:5173`) |
| `DB_NAME` | Nombre de la base de datos (`nutria`) |
| `DB_USER` | Usuario de la BD (`nutria`) |
| `DB_PASSWORD` | Contraseña de la BD (la usa el contenedor para crearla) |
| `DB_HOST` | Host de la BD (`localhost` con WSL2 forwarding) |
| `DB_PORT` | Puerto de la BD (`5432`) |
| `JWT_ACCESS_TTL_DAYS` | Vida del token de acceso en días (`1`) |
| `JWT_REFRESH_TTL_DAYS` | Vida del token de refresco en días (`7`) |

### 7.2 docker-compose.yml

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: nutria-db
    restart: always          # arranca solo cuando Docker inicia
    environment:
      POSTGRES_DB: ${DB_NAME:-nutria}
      POSTGRES_USER: ${DB_USER:-nutria}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Define DB_PASSWORD en el archivo .env}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data   # datos persistentes
```

**Comandos útiles:**

```bash
docker compose down        # detener y eliminar el contenedor (conserva el volumen)
docker compose down -v     # lo anterior + borrar los datos (¡ojo!)
docker logs nutria-db      # ver logs
```

### 7.3 Modelos de datos

Tablas (creadas por Django ORM):

#### `roles`
| Columna | Tipo | Notas |
|---|---|---|
| `id_rol` | int PK | `1` Administrador, `2` Usuario |
| `nombre` | varchar(50) | único |

#### `usuarios`
| Columna | Tipo | Notas |
|---|---|---|
| `id_usuario` | int PK | |
| `nombre` | varchar(100) | |
| `email` | varchar(100) | único |
| `contrasena_hash` | varchar(255) | hash (Django `make_password` / `check_password`) |
| `edad` | int | nullable |
| `peso` | decimal(5,2) | kg, nullable |
| `altura` | decimal(5,2) | cm, nullable |
| `objetivo` | varchar(100) | nullable (ej. "Bajar de peso") |
| `calorias_diarias` | int | nullable (meta calórica) |
| `id_rol` | FK → `roles` | |
| `fecha_registro` | datetime | automático |

> El modelo `Usuario` define la propiedad `is_authenticated = True` (requerida por DRF al autenticar) y es el sujeto del JWT (PK `id_usuario`, ver `core/authentication.py`).

#### `categorias`
| Columna | Tipo |
|---|---|
| `id_categoria` | int PK |
| `nombre` | varchar(50) único |

#### `alimentos`
| Columna | Tipo | Notas |
|---|---|---|
| `id_alimento` | int PK | |
| `nombre` | varchar(100) | |
| `calorias` | int | kcal por 100 g |
| `proteinas` | decimal(5,2) | g por 100 g |
| `carbohidratos` | decimal(5,2) | g por 100 g |
| `grasas` | decimal(5,2) | g por 100 g |
| `id_categoria` | FK → `categorias` | |

### 7.4 Endpoints de la API

Prefijo base: `/api`. El frontend consume este contrato exacto.

| Método | Ruta | Auth | Descripción | Cuerpo |
|---|---|---|---|---|
| POST | `/api/auth/login` | — | Inicia sesión | `{ "email", "password" }` |
| POST | `/api/auth/refresh` | — | Renueva el JWT | `{ "refresh" }` |
| GET | `/api/usuarios` | JWT | Lista usuarios | — |
| POST | `/api/usuarios` | — | Registro | `{ "nombre", "email", "contrasena_hash", "edad", "peso", "altura", "id_rol" }` |
| GET | `/api/alimentos` | — | Lista alimentos (público) | — |
| POST | `/api/alimentos` | JWT | Crea alimento | `{ "nombre", "id_categoria", "calorias", "proteinas", "carbohidratos", "grasas" }` |
| PUT | `/api/alimentos/:id` | JWT | Actualiza alimento | igual que POST |
| DELETE | `/api/alimentos/:id` | JWT | Elimina alimento | — |

> Las rutas se registran con y sin barra final (el frontend llama sin barra; `APPEND_SLASH = False`).

#### Respuestas de ejemplo

**Login** (`POST /api/auth/login`):

```json
{
  "mensaje": "Login exitoso",
  "usuario": {
    "id_usuario": 1,
    "nombre": "David Prueba",
    "email": "david@prueba.com",
    "edad": 24,
    "peso": "82.00",
    "altura": "175.00",
    "objetivo": null,
    "calorias_diarias": null,
    "id_rol": 2,
    "fecha_registro": "2026-08-14T21:40:43.726529Z"
  },
  "access": "<token>",
  "refresh": "<token>"
}
```

**Listar alimentos** (`GET /api/alimentos`):

```json
[
  {
    "id_alimento": 1,
    "nombre": "Pechuga de pollo",
    "categoria": "Proteínas",
    "calorias": 165,
    "proteinas": "31.00",
    "carbohidratos": "0.00",
    "grasas": "3.60"
  }
]
```

**Errores**: el backend devuelve `{ "error": "<mensaje>" }` con los códigos HTTP correspondientes (400 validación, 401 credenciales, 404 no encontrado).

### 7.5 Autenticación JWT

- El login devuelve `access` y `refresh`.
- Para los endpoints protegidos, enviar el header:

```
Authorization: Bearer <access_token>
```

- Renovar el token (cuando `access` expire):

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<refresh_token>"}'
```

- El backend usa una autenticación personalizada (`core/authentication.py`) que resuelve el `user_id` del token contra el modelo `Usuario` (PK `id_usuario`), y `SIMPLE_JWT.USER_ID_FIELD = 'id_usuario'`.

### 7.6 Panel de administración de Django

Django incluye un panel de administración web (`/admin/`) que permite gestionar los datos sin tocar SQL: roles, usuarios, categorías y alimentos.

#### 7.6.1 Crear un superusuario

El panel requiere un **superusuario de Django**. Es independiente del modelo `Usuario` de la app: es la cuenta que inicia sesión en `/admin/`, no en la app.

**Forma interactiva** (te pedirá usuario, email y contraseña):

```powershell
env\Scripts\python.exe nutria-backend\manage.py createsuperuser
```

**Forma no interactiva** (todo en una línea; útil para automatizar):

```powershell
env\Scripts\python.exe nutria-backend\manage.py shell -c "from django.contrib.auth.models import User; u = User.objects.create_superuser('admin', 'admin@nutria.com', 'TuClaveSegura123'); u.is_active = True; u.save(); print('Superusuario creado: admin')"
```

> ⚠️ Cambia `'admin'`, `'admin@nutria.com'` y `'TuClaveSegura123'` por tus credenciales. Recuerda que el backend debe estar corriendo y la BD conectada.

#### 7.6.2 Acceder al panel

1. Levantar el backend: `env\Scripts\python.exe nutria-backend\manage.py runserver 3000`
2. Abrir `http://localhost:3000/admin/`
3. Iniciar sesión con el usuario y contraseña del superusuario.

#### 7.6.3 Qué se administra

| Sección | Modelo | Permite |
|---|---|---|
| Roles | `roles` | Ver/crear/editar/eliminar roles (Administrador, Usuario) |
| Usuarios | `usuarios` | Ver/crear/editar usuarios, asignar rol, datos físicos, `objetivo` y `calorias_diarias` |
| Categorías | `categorias` | Gestión de categorías de alimentos |
| Alimentos | `alimentos` | CRUD completo de alimentos (nombre, calorías, macros, categoría) |

El panel incluye búsqueda, filtros y paginación automática gracias a la configuración en `core/admin.py` (`list_display`, `search_fields`, `list_filter`).

> 💡 **Tip:** el panel es la forma más rápida de completar `objetivo` y `calorias_diarias` de un usuario — son los campos que el dashboard lee tras el login (hoy llegan `null` si no se llenan).

---

## 8. Frontend — Referencia

### 8.1 Proxy de API

`nutria-frontend/vite.config.js` redirige todas las peticiones `/api/*` al backend:

```js
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

> Por eso el backend Django debe correr en el puerto **3000**.

### 8.2 Pantallas

- **Login** (`App.jsx` → `HeroLogin`): `POST /api/auth/login`, guarda `usuario` en estado.
- **Registro** (`Registro.jsx`): `POST /api/usuarios`, envía `contrasena_hash` con la contraseña en texto plano (el backend la hashea).
- **Dashboard** (`App.jsx`): objetivo, progreso (mock), rutinas (mock), biblioteca de alimentos desde `GET /api/alimentos`.
- **Biblioteca** (`Alimentos.jsx`): vista standalone de alimentos con filtros por categoría.

---

## 9. Solución de problemas

| Problema | Solución |
|---|---|
| `wsl --install` falla | Asegúrate de que *Plataforma de máquina virtual* y *Subsistema de Windows para Linux* estén habilitados (Opciones de Windows → Características opcionales) y de que la virtualización esté activa en la BIOS. |
| Docker no arranca al abrir WSL | Verifica systemd (`ps -p 1 -o comm=` → `systemd`) y que el servicio esté habilitado: `sudo systemctl enable docker`. |
| `docker compose` no es un comando | Instala el plugin: `sudo apt install -y docker-compose-v2`, o usa `docker-compose up -d`. |
| La conexión a la BD falla desde Windows | Probar `Test-NetConnection localhost -Port 5432`; usar la IP del WSL en `DB_HOST` y `DB_PORT` correcto en `.env`. |
| El contenedor no aparece tras reiniciar | El contenedor usa `restart: always`; si lo detuviste con `docker compose stop`, vuelve a levantarlo con `docker compose up -d`. |
| Permisos en la terminal WSL | Agrega tu usuario al grupo docker (`sudo usermod -aG docker $USER`) o antepone `sudo` a los comandos `docker`. |

**Notas de entorno:**

- **WSL2**: la distro Debian tiene systemd activo y `docker.service` habilitado; con la política `restart: always` del contenedor, Postgres arranca solo al abrir WSL.
- **.env**: no versionar. Usar `.env.example` como plantilla. La contraseña de la BD se define en `DB_PASSWORD`.
- **Windows**: con WSL2, `localhost:5432` se reenvía a Postgres; si fallara, usar `wsl -d Debian hostname -I` en `DB_HOST`.

---

## 10. Roadmap / pendientes

Actualmente hay secciones del dashboard que usan datos mock (no vienen de la API):

- Progreso de peso/calorías semana a semana.
- Rutinas de ejercicio.
- Chat con IA (la integración se agregará próximamente).

Campos opcionales del usuario pendientes de flujo: `objetivo` y `calorias_diarias` (ya existen en el modelo; el dashboard los lee).

---

## ⚡ Quick start — correr el proyecto

> Todo ya instalado. Guía detallada en [§6](#6-cómo-correr-el-proyecto-todo-instalado).

```bash
# 1. BD — WSL Debian (solo si no está Up; normalmente arranca sola)
cd /mnt/c/Users/juanma/Documents/desarrollo/nutrIA/nutria-backend
docker compose up -d

# 2. Backend — Windows (PowerShell), desde la raíz del repo
env\Scripts\python.exe nutria-backend\manage.py runserver 3000

# 3. Frontend — Windows (PowerShell)
cd nutria-frontend
bun run dev
```

| URL | Qué es |
|---|---|
| `http://localhost:5173` | App NutrIA |
| `http://localhost:3000/admin/` | Panel admin (superusuario) |
| `http://localhost:3000/api/alimentos` | API (JSON alimentos) |

Para apagar: `Ctrl + C` en cada terminal. La BD queda corriendo y vuelve sola al abrir WSL.
