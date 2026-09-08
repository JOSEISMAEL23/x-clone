# Clon de X (Twitter)

Red social funcional que implementa el núcleo de X: publicar mensajes cortos, dar "me gusta" y seguir a otros usuarios.

**Aplicación en producción:** https://x-clone-neon-nu.vercel.app/

Proyecto de certificación — Desarrollo Web.
Autor: José Ismael Martínez Lozada.

---

## Qué hace

- **Registro e inicio de sesión** con correo y contraseña. La sesión persiste al recargar la página.
- **Publicar tweets** de hasta 280 caracteres, con contador en vivo.
- **Dar y quitar "me gusta"**, con respuesta inmediata en pantalla.
- **Perfiles públicos** de cada usuario, con sus tweets y sus contadores de seguidores y seguidos.
- **Seguir y dejar de seguir** a otros usuarios.
- **Editar el perfil propio**: nombre, biografía y foto.
- **Rutas privadas protegidas**: sin sesión, la aplicación redirige al inicio de sesión.

---

## Tecnologías

| Capa | Herramienta | Por qué |
|---|---|---|
| Interfaz | React 19 | Componentes reutilizables; `TweetCard` se escribe una vez y sirve para el feed y los perfiles. |
| Construcción | Vite 8 | Recarga instantánea en desarrollo y empaquetado optimizado para producción. |
| Estilos | Tailwind CSS 4 | Clases utilitarias; el CSS final solo incluye lo que se usa. |
| Navegación | React Router 7 | Cambio de vista sin recargar la página. |
| Iconos | lucide-react | Iconos como componentes de React. |
| Backend | Supabase | PostgreSQL, autenticación y almacenamiento de archivos. |
| Despliegue | Vercel | Publicación automática con cada push a `main`. |

No hay un servidor propio: el navegador consulta directamente a Supabase. La seguridad de los datos recae en las políticas **Row Level Security** de PostgreSQL, no en el frontend.

---

## Estructura

```
src/
├── lib/
│   ├── supabase.js        Cliente único de Supabase
│   └── formatTime.js      Convierte fechas en "ahora", "5m", "3h", "2d"
├── context/
│   └── AuthContext.jsx    Sesión, perfil y funciones de autenticación
├── components/
│   ├── ProtectedRoute.jsx Bloquea las páginas privadas sin sesión
│   ├── Layout.jsx         Estructura compartida (barra lateral + contenido)
│   ├── Sidebar.jsx        Navegación y cierre de sesión
│   ├── ComposeTweet.jsx   Formulario para publicar
│   └── TweetCard.jsx      Tarjeta de un tweet, con su botón de "me gusta"
├── pages/
│   ├── Login.jsx          Inicio de sesión
│   ├── Register.jsx       Registro
│   ├── Feed.jsx           Timeline principal
│   ├── Profile.jsx        Perfil de un usuario y botón de seguir
│   └── EditProfile.jsx    Edición de perfil y subida de avatar
├── App.jsx                Definición de rutas
└── main.jsx               Punto de entrada

database/
└── schema.sql             Tablas, políticas RLS, trigger y políticas de Storage
```

---

## Modelo de datos

Cuatro tablas en PostgreSQL, más `auth.users` que administra Supabase.

| Tabla | Columnas | Descripción |
|---|---|---|
| `profiles` | `id, username, full_name, avatar_url, bio, created_at` | Datos públicos del usuario. Su `id` es el mismo de `auth.users`. |
| `tweets` | `id, user_id, content, created_at` | Cada publicación. |
| `likes` | `id, user_id, tweet_id, created_at` | Tabla intermedia usuario–tweet. |
| `follows` | `follower_id, following_id, created_at` | Quién sigue a quién. Llave primaria compuesta. |

`likes` y `follows` resuelven relaciones **muchos a muchos**. En `follows`, ambas columnas apuntan a `profiles`: es una relación **reflexiva** entre usuarios.

El esquema completo, con restricciones y políticas, está en [`database/schema.sql`](database/schema.sql).

---

## Seguridad

- **Row Level Security activo en las cuatro tablas.** La lectura es pública, como corresponde a una red social; la escritura exige que `auth.uid()` coincida con el dueño del registro.
- **La clave `anon` es pública por diseño**: identifica el proyecto, no otorga permisos. Los permisos los decide PostgreSQL con las políticas RLS.
- **Credenciales fuera del repositorio**: `.env.local` está cubierto por `.gitignore`. En Vercel se cargan como variables de entorno del proyecto.
- **Creación de perfil garantizada por la base de datos**: un trigger sobre `auth.users` inserta la fila en `profiles` al registrarse, así que es imposible tener un usuario sin perfil.
- **Storage segmentado por usuario**: cada avatar se guarda en `{id del usuario}/avatar.{ext}` y la política exige que esa carpeta coincida con `auth.uid()`.
- **XSS**: React escapa el contenido interpolado en JSX, así que un tweet con etiquetas HTML se muestra como texto.

---

## Ejecutar en local

Requiere Node.js 20 o superior y un proyecto de Supabase.

```bash
git clone https://github.com/JOSEISMAEL23/x-clone.git
cd x-clone
npm install
```

Crea un archivo `.env.local` a partir de la plantilla:

```bash
cp .env.example .env.local
```

Y coloca tus credenciales de Supabase (Project Settings → API):

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon
```

Prepara la base de datos ejecutando [`database/schema.sql`](database/schema.sql) en el editor SQL de Supabase. Después crea un bucket público llamado `avatars` en Storage.

Luego:

```bash
npm run dev
```

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga instantánea |
| `npm run build` | Construye la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente lo construido |
| `npm run lint` | Analiza el código con ESLint |

---

## Despliegue

Desplegado en Vercel con integración continua: cada push a `main` construye y publica automáticamente.

El archivo `vercel.json` contiene una regla de reescritura necesaria en cualquier aplicación de página única: como solo existe físicamente `index.html`, sin ella recargar la página en `/feed` devolvería un error 404. La regla hace que toda ruta entregue `index.html`, y React Router resuelve la vista en el navegador.

---

## Limitaciones conocidas

Documentadas de forma deliberada, con la solución que aplicaría:

| Limitación | Solución |
|---|---|
| El feed carga todos los tweets, sin paginación | Usar `.range()` y cargar por bloques al hacer scroll |
| Los "me gusta" y seguimientos no revierten si la petición falla | Guardar el valor previo, comprobar el `error` y restaurarlo |
| El perfil hace cinco consultas en serie | Lanzarlas en paralelo con `Promise.all` |
| Los errores se muestran con `alert()` | Notificaciones dentro de la interfaz |
| Sin ruta 404 | Añadir `<Route path="*">` |
| Sin verificación de correo al registrarse | Activar *Confirm email* en Supabase Auth |
| Sin freno a los intentos de inicio de sesión | CAPTCHA en el formulario |
| Sin pruebas automatizadas | Vitest con React Testing Library |

---

## Alcance

El requerimiento era construir el **núcleo** de X, y está completo. Quedan fuera del alcance, como evolución natural del producto: respuestas a tweets, retweets, notificaciones, búsqueda, imágenes en las publicaciones y feed filtrado por usuarios seguidos.
