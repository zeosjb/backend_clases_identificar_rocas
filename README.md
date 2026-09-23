# API educativa de identificación de rocas

Esta API permite administrar un catálogo de rocas y datos relacionados. También incluye una demostración de búsqueda textual para orientar una identificación a partir de propiedades escritas. **No procesa imágenes ni contiene un modelo de inteligencia artificial o machine learning.**

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
| Usuarios | `/api/user` | Solo registro e inicio de sesión; no expone CRUD de contraseñas |

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

### Demo de identificación por propiedades

`GET /api/rock/identificar?q=oscuro` busca coincidencias parciales, sin distinguir mayúsculas de minúsculas según el comportamiento de SQLite/LIKE, en propiedades textuales de catálogo (nombre, composición, fórmula, ambiente, usos, color, textura, entre otras). Devuelve `{ query, method: "text-match", total, rocks }`. Es una ayuda educativa de búsqueda, **no identifica muestras ni infiere minerales**.

### Registro e inicio de sesión

- `POST /api/user/registro`: `userName`, `email`, `password` (mínimo 8 caracteres) y `roleId` son obligatorios; `phone` es opcional. La contraseña se transforma con bcrypt antes de persistir.
- `POST /api/user/login`: recibe `email` y `password`; devuelve un JWT.
- `src/middlewares/validateToken.js`: middleware Bearer disponible para rutas que deban protegerse. Comprueba firma, vencimiento y existencia del usuario. No se aplica automáticamente a CRUDs: esta versión es un proyecto didáctico abierto y no implementa autorización por rol.
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

**Objetivo:** agregar un filtro numérico para que una persona pueda buscar rocas dentro de un rango de dureza de Mohs. Este endpoint es un ejercicio nuevo; todavía no está implementado.

Implementa `GET /api/rock/dureza?min=5&max=7` y responde con una lista de rocas cuya dureza esté entre ambos límites, inclusive. Trabaja por capas: define la ruta, delega la lógica al servicio y deja que el controlador traduzca el resultado a una respuesta HTTP. No pongas consultas ni reglas de negocio directamente en la ruta.

**Criterios de aceptación**

- `min` y `max` son obligatorios, numéricos y no negativos; si falta uno o el rango es inválido (`min > max`), responde `400` con un mensaje claro.
- Una búsqueda válida devuelve `200` y solo incluye rocas con `hardness >= min` y `hardness <= max`.
- Agrega pruebas para: resultados dentro y fuera del rango, límites inclusivos y entradas inválidas.
- Actualiza esta sección con un ejemplo `curl` y la forma de la respuesta cuando termines.

**Pista:** `src/routes/rock.route.js` ya muestra cómo declarar rutas específicas antes de las rutas CRUD genéricas; `src/services/crudService.js` y `src/utils/queryOptions.js` sirven como referencias para mantener cada responsabilidad en su capa.

**Fuera de alcance:** no se necesita machine learning ni reconocimiento por imagen. El objetivo es practicar validación, consultas Sequelize, capas y pruebas automatizadas.
