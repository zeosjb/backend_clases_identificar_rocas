# API de identificación de rocas

Esta API permite administrar un catálogo de rocas y datos relacionados. También incluye una demostración de búsqueda textual para orientar una identificación de rocas.

## Inicio rápido

1. Instala Node.js y las dependencias: `npm install`.
2. Configura `.env` (ver abajo).
3. Inicia el servicio: `npm start` o, para desarrollo, `npm run dev`.
4. Consulta `http://localhost:8080/api/rock`.
5. Ejecuta las pruebas: `npm test`.

La primera conexión crea las tablas que faltan en SQLite. El servidor solo comienza a escuchar después de autenticar y sincronizar los modelos.

### Variables de entorno

| Variable | Uso | Valor local sugerido |
|---|---|---|
| `PORT` | Puerto HTTP | `8080` |
| `DATABASE_NAME` | Nombre del archivo SQLite, dentro de `src/database` | `rock` |
| `JWT_SECRET` | Secreto para firmar y verificar tokens | valor aleatorio privado |
| `JWT_EXPIRES_IN` | Duración del token al iniciar sesión | `1d` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_USERNAME` | Cuenta de administrador creada al arrancar si no existe | `admin@example.test` / contraseña propia / `admin` |
| `GUEST_SESSION_TTL_HOURS` | Vigencia de una sesión de invitado | `72` |

Ejemplo de `.env` (sin credenciales reales):

```dotenv
PORT=8080
DATABASE_NAME=rock
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=1d
ADMIN_EMAIL=admin@example.test
ADMIN_PASSWORD=change-this-password
ADMIN_USERNAME=admin
GUEST_SESSION_TTL_HOURS=72
```

> TODO(student): la cátedra pide un archivo `.env.example` en el repositorio con este contenido. Créalo y no subas tu `.env` real.

Sin `ADMIN_EMAIL`/`ADMIN_PASSWORD` se usa un valor de desarrollo (`admin@example.test` / `ChangeMe123!`); con `NODE_ENV=production` el servidor exige `ADMIN_PASSWORD`. El seeder nunca sobrescribe un administrador existente.

No publiques secretos en Git. El fallback JWT existe solo para facilitar la demostración local y debe reemplazarse en despliegues.

## Arquitectura: el recorrido de una petición

`src/server.js` carga configuración, espera la conexión y prepara la base de datos. Después `src/app.js` construye Express, instala middlewares, monta rutas y centraliza errores. Una ruta traduce URL y método HTTP a una función del controlador; el controlador convierte la petición en respuesta HTTP; el servicio encapsula operaciones de dominio y persistencia; el modelo Sequelize valida y consulta SQLite.

| Capa | Responsabilidad | Ejemplos |
|---|---|---|
| Configuración | Conexión Sequelize y opciones | `src/config/database.js` |
| Modelos | Esquema, validaciones y relaciones | `Rock`, `Category`, `Type` |
| Rutas | Asignar métodos y URLs a controladores | `src/routes/rock.route.js` |
| Controladores | Códigos HTTP, entrada/salida y delegación | `createCrudController` |
| Servicios | CRUD, paginación y límites de campos | `createCrudService` |
| Utilidades | Lógica compartida sin estado HTTP | `buildListOptions` |
| Middleware | Funciones transversales antes/después de rutas | JSON, CORS, Morgan y manejador de errores |

Los controladores genéricos usan `next(error)` para que el middleware global aplique un formato consistente. Las asociaciones se registran en `src/models/index.js`, y el arranque sincroniza el conjunto completo de modelos.

## Endpoints

Todos los recursos genéricos aceptan `GET /`, `POST /`, `GET /:id`, `PATCH /:id` y `DELETE /:id`. El listado devuelve `{ items, total, page, limit }`; `DELETE` correcto responde `204`. Los modelos usan borrado lógico cuando tienen `paranoid: true`.

| Recurso | Prefijo | Notas |
|---|---|---|
| Rocas | `/api/rock` | Campos de catálogo y búsqueda `search` |
| Categorías | `/api/category` | Clasificación de rocas |
| Tipos | `/api/type` | Tipo asociado a una roca |
| Roles | `/api/role` | Rol asociado a usuarios |
| Logros | `/api/achievement` | Nombre, slug, descripción y experiencia |
| Análisis | `/api/analysis` | Registro asociado a usuario y roca; no representa predicción ML |
| Colecciones | `/api/collection` | Asociación usuario-roca |
| Logros de usuario | `/api/user-achievement` | Unión usuario-logro |
| Usuarios | `/api/user` | Registro, inicio de sesión, perfil propio y listado para Admin; no expone CRUD de contraseñas |

### Consultas y ejemplo

Los listados admiten `page` (desde 1), `limit` (por defecto 20, máximo 100), `search` y `searchBy`. El campo de búsqueda debe pertenecer a la lista permitida por el recurso. Ejemplo: `GET /api/rock?search=basalto&searchBy=name&page=1&limit=10`.

```json
{
  "name": "Basalto",
  "scientificName": "Basalt",
  "typeId": 1,
  "categoryId": 1,
  "index": 10,
  "composition": "Plagioclasa y piroxeno",
  "formula": "Variable",
  "environment": "Volcánico",
  "commonUses": "Construcción",
  "hardness": 6,
  "streak": "Gris",
  "color": "Oscuro",
  "texture": "Afanítica",
  "density": 2.9,
  "transparency": 0,
  "tenacity": 1,
  "imgUrl": "https://example.org/basalt.jpg",
  "mindatUrl": "https://www.mindat.org/"
}
```

Los campos obligatorios adicionales dependen de cada modelo y los IDs referenciales deben existir. Sequelize reporta errores de validación y unicidad como `400`.

### Catálogo: filtros, tipos y categorías

- `GET /api/rock?typeId=1&categoryId=2`: filtra por tipo y/o categoría (enteros positivos, si no `400`). Se combina con `search`, `page` y `limit`.
- `GET /api/type/:id/rocks` y `GET /api/category/:id/rocks`: rocas de un tipo o categoría (`404` si no existe).
- Los nombres de tipos y categorías son únicos (`400` si se repiten). `DELETE` de un tipo o categoría con rocas asociadas responde `409`.
- Validaciones de roca: campos obligatorios, `hardness` entre 1 y 10 (escala de Mohs), `typeId`/`categoryId` existentes y `scientificName`/`index` únicos. Solo se aceptan los campos del catálogo (lista blanca).
- Las escrituras del catálogo requieren rol Admin (ver matriz de roles).

### Demo de identificación por propiedades

`GET /api/rock/identificar?q=oscuro` busca coincidencias parciales, sin distinguir mayúsculas de minúsculas según el comportamiento de SQLite/LIKE, en propiedades textuales de catálogo (nombre, composición, fórmula, ambiente, usos, color, textura, entre otras). Devuelve `{ query, method: "text-match", total, rocks }`. Es una ayuda educativa de búsqueda, **no identifica muestras ni infiere minerales**.

### Registro e inicio de sesión

- `POST /api/user/registro`: `userName`, `email` y `password` (mínimo 8 caracteres) son obligatorios; `phone` es opcional. La contraseña se transforma con bcrypt antes de persistir. **El rol siempre es `Usuario autenticado`**: un `roleId` enviado por el cliente se ignora, así nadie puede autoasignarse privilegios.
- `POST /api/user/login`: recibe `email` y `password`; devuelve un JWT. Las cuentas con `status: "blocked"` reciben `403`.
- `GET /api/user/me` y `PATCH /api/user/me` (Bearer): perfil propio; solo se puede editar `userName` y `phone` (nunca rol ni estado).
- `GET /api/user` y `GET /api/user/:id` (solo Admin): consulta de usuarios registrados.
- `src/middlewares/validateToken.js`: middleware Bearer (`validateToken.optional` deja pasar peticiones anónimas). Comprueba firma, vencimiento, existencia y estado activo del usuario y carga su rol.
- `src/middlewares/authorizeRoles.js`: `authorizeRoles('Admin')` responde `403` si el rol no está permitido. `src/middlewares/guards.js` exporta las cadenas listas `adminOnly` y `authenticated`.

### Roles y permisos

| Recurso | Anónimo / invitado | Usuario autenticado | Admin |
|---|---|---|---|
| Catálogo (`rock`, `type`, `category`, `achievement`) lectura | sí | sí | sí |
| Catálogo escritura (POST/PATCH/DELETE) | `401` | `403` | sí |
| `role`, `analysis`, `collection`, `user-achievement` (CRUD crudo) | `401` | `403` | sí |
| `/api/user` (listado) | `401` | `403` | sí |
- `User.prototype.toJSON`: elimina `password` de las respuestas serializadas.

## Clases, funciones y modelos

- `start` (`src/server.js`): carga variables, autentica Sequelize, sincroniza y recién entonces escucha; los fallos evitan un servidor parcialmente listo.
- `createApp` (`src/app.js`): crea una instancia Express aislada, monta recursos y error/not-found handlers.
- `createCrudRouter(model, options)` (`src/routes/crud.route.js`): conecta cinco operaciones HTTP genéricas con un modelo.
- `createCrudController(service, resourceName)` (`src/controllers/crud.controller.js`): adapta parámetros de ruta y estados HTTP a operaciones de servicio.
- `createCrudService({ model, searchableFields, allowedFields })` (`src/services/crudService.js`): implementa listar, buscar por clave, crear, actualizar y eliminar; filtra campos inmutables y puede restringir escrituras con una lista permitida.
- `buildListOptions(query, searchableFields)` (`src/utils/queryOptions.js`): valida números de página, limita resultados y crea condiciones `LIKE` únicamente para campos autorizados.
- `UserController` (`src/controllers/user.controller.js`): implementa registro y autenticación; `validateToken` (`src/middlewares/validateToken.js`) protege rutas mediante Bearer JWT.

Los modelos Sequelize corresponden a las entidades `Achievement`, `Analysis`, `Category`, `Collection`, `Rock`, `Role`, `Type`, `User` y `UserAchievement`. Las asociaciones describen, por ejemplo, una categoría con muchas rocas, y usuarios con colecciones, análisis y logros.

## Respuestas y errores

- `200`: lectura o modificación exitosa.
- `201`: recurso creado.
- `204`: eliminado.
- `400`: datos, filtros o referencias inválidas.
- `401`: token ausente, inválido o vencido.
- `404`: recurso o ruta inexistente.
- `409`: usuario duplicado en registro.
- `500`: error interno no esperado.

## Pruebas

`npm test` corre las pruebas integradas con `node:test`. Cubren validación/paginación/búsqueda y el comportamiento CRUD del servicio, incluidos campos inmutables y registros inexistentes. Agrega pruebas al introducir nuevas reglas de dominio para mantener claro qué garantiza cada capa.

# Corrección de claves compuestas

`UserAchievement` tiene clave primaria compuesta `(userId, achievementId)`. Para un registro individual se requieren ambas claves en la ruta:

- `GET /api/user-achievement/:userId/:achievementId`
- `PATCH /api/user-achievement/:userId/:achievementId`
- `DELETE /api/user-achievement/:userId/:achievementId`

La creación/listado siguen en `POST /api/user-achievement` y `GET /api/user-achievement`. Ejemplo: `GET /api/user-achievement/7/3` recupera el logro 3 del usuario 7; `PATCH` solo puede cambiar `rockId`, no la identidad de la asociación. `DELETE` elimina exactamente esa unión.

No se cambió política de autenticación para Analysis o Collection.

## Desafío para la clase de hoy: encontrar rocas por dureza

**Objetivo:** agregar un filtro numérico para que una persona pueda buscar rocas dentro de un rango de dureza de Mohs
Implementa `GET /api/rock/dureza?min=5&max=7` y responde con una lista de rocas cuya dureza esté entre ambos límites, inclusive. Trabaja por capas: define la ruta, delega la lógica al servicio y deja que el controlador traduzca el resultado a una respuesta HTTP. No pongas consultas ni reglas de negocio directamente en la ruta.

**Criterios de aceptación**

- `min` y `max` son obligatorios, numéricos y no negativos; si falta uno o el rango es inválido (`min > max`), responde `400` con un mensaje claro.
- Una búsqueda válida devuelve `200` y solo incluye rocas con `hardness >= min` y `hardness <= max`.
- Agrega pruebas para: resultados dentro y fuera del rango, límites inclusivos y entradas inválidas.
- Actualiza esta sección con un ejemplo `curl` y la forma de la respuesta cuando termines.

**Pista:** `src/routes/rock.route.js` ya muestra cómo declarar rutas específicas antes de las rutas CRUD genéricas; `src/services/crudService.js` y `src/utils/queryOptions.js` sirven como referencias para mantener cada responsabilidad en su capa.

**Solución de referencia** (ruta `src/routes/rock.route.js` → `byHardness` en `src/controllers/rock.controller.js` → `findByHardness` en `src/services/rockService.js`; pruebas en `test/rockHardness.test.js`):

```bash
curl "http://localhost:8080/api/rock/dureza?min=5&max=7"
```

```json
{
  "min": 5,
  "max": 7,
  "total": 3,
  "rocks": [ { "id": 1, "name": "Basalto", "hardness": 6 } ]
}
```

Una consulta inválida responde `400`, por ejemplo `GET /api/rock/dureza?min=8&max=5` → `{ "message": "min no puede ser mayor que max" }`. Faltan parámetros: `Los parámetros min y max son obligatorios`; valores no numéricos o negativos: `min y max deben ser numéricos y no negativos`.

## SQLite: ubicación y datos de demostración

Al ejecutar `npm start`, el proceso inicia `src/server.js`: autentica la conexión, crea las tablas faltantes con Sequelize, carga datos de demostración y recién entonces levanta Express (que se construye mediante `createApp` en `src/app.js`). Si falla cualquiera de esos pasos, el proceso termina con error en vez de anunciar que la API está lista.

Por defecto, la base es `src/database/rock.sqlite`, independiente de la carpeta desde la que se invoque Node. `DATABASE_NAME` cambia el nombre del archivo en esa misma carpeta; solo acepta letras, números, guiones y guiones bajos. No se ejecuta `force: true` ni se borra el archivo existente.

En la primera ejecución, el seeder agrega solo registros que faltan: tipos, categorías, roles de Estudiante/Docente, dos logros y cuatro rocas de ejemplo (basalto, granito, arenisca y pizarra). Para detectar filas existentes usa nombres estables o `scientificName`; nunca reemplaza valores que ya editaste. En reinicios no duplica los ejemplos. La siembra es inicialización didáctica, no reconocimiento por imagen ni un modelo de aprendizaje automático. Para una base nueva sin los ejemplos, configura otro `DATABASE_NAME`; conserva el archivo anterior si necesitas sus datos.
