# Documentación de Tablas de Supabase

## Tabla: `tour_requests`
*Registro de ciudades solicitadas por usuarios cuando no existe tour en caché. Sirve como lista de notificación pendiente.*

| Campo | Tipo | Formato | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | string | uuid | Identificador único. &lt;pk/&gt; |
| `city` | string | text | Nombre de la ciudad solicitada (formato original, con tildes). |
| `country` | string | text | País en inglés. |
| `language` | string | text | Idioma del usuario en el momento de la solicitud. |
| `slug` | string | text | Clave normalizada (`ciudad_pais`) que enlaza con `tours_cache.city`. |
| `user_email` | string | text | Email del usuario. `'Anónimo'` si no disponible. |
| `created_at` | string | timestamp | Fecha de la solicitud. |
| `notified_at` | string | timestamp | Fecha en que se envió el email de "tour disponible". `NULL` mientras no se haya notificado. |

---


Este documento refleja el **estado exacto y en tiempo real** de las tablas configuradas en la base de datos de Supabase, extraído directamente utilizando la API interna.

## Tabla: `generation_jobs`
*Cola de tareas y registro de auditoría para la generación asíncrona de tours por IA a través de Edge Functions.*

| Campo | Tipo | Formato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `id` | string | uuid | Identificador único del trabajo (Job). <pk/> |
| `city_slug` | string | text | Slug de la ciudad objetivo (ej. `logrono_spain`). |
| `language` | string | text | Idioma de generación solicitado. |
| `city_info` | N/A | jsonb | Metadatos geográficos iniciales (lat, lon, bbox) obtenidos de Nominatim. |
| `overpass_catalog` | N/A | jsonb | Catálogo bruto de POIs extraído de Overpass API antes de generar. |
| `raw_ai_data` | N/A | jsonb | Respuesta cruda (JSON parseado) devuelta por Gemini AI. Útil para depurar alucinaciones o fallos de formato. |
| `status` | string | text | Estado del trabajo (`PENDING_AI`, `PENDING_GIS`, `COMPLETED`, `FAILED`). |
| `error_message` | string | text | Razón del fallo en caso de que el status sea `FAILED`. |
| `created_at` | string | timestamp | Fecha de creación del job. |
| `updated_at` | string | timestamp | Fecha de última actualización de estado. |

---

## Tabla: `profiles`
*Almacena toda la información del usuario: datos personales, preferencias de app y sistema completo de gamificación.*

| Campo | Tipo | Formato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `id` | string | text | ID único que enlaza con Supabase Auth (UID). <pk/> |
| `email` | string | text | Correo electrónico de contacto/registro. |
| `username` | string | text | Nombre de usuario público (@handle). |
| `first_name` | string | text | Nombre de pila. |
| `last_name` | string | text | Apellidos. |
| `name` | string | text | Nombre completo precalculado. |
| `avatar` | string | text | URL del avatar (frecuentemente generado vía Dicebear). |
| `language` | string | text | Idioma preferido por el usuario en la App. |
| `miles` | integer | integer | Puntuación principal global del usuario. |
| `rank` | string | text | Rango de viajero calculado según sus millas (ZERO, SCOUT, ROVER, TITAN, ZENITH). |
| `culture_points` | integer | integer | Puntos acumulados en la categoría de Cultura. |
| `food_points` | integer | integer | Puntos acumulados en la categoría de Gastronomía. |
| `photo_points` | integer | integer | Puntos acumulados en la categoría de Fotografía. |
| `history_points` | integer | integer | Puntos acumulados en la categoría de Historia. |
| `nature_points` | integer | integer | Puntos acumulados en la categoría de Naturaleza. |
| `art_points` | integer | integer | Puntos acumulados en la categoría de Arte. |
| `arch_points` | integer | integer | Puntos acumulados en la categoría de Arquitectura. |
| `badges` | N/A | jsonb | Array de insignias conseguidas por hitos de gamificación. |
| `stamps` | N/A | jsonb | Sellos virtuales del "Pasaporte" ganados al visitar ciudades. |
| `visited_cities` | array | text[] | Lista de slugs de ciudades que el usuario ha visitado físicamente. |
| `completed_tours` | array | text[] | Lista de IDs de tours finalizados. |
| `captured_moments` | N/A | jsonb | Fotos subidas o capturadas por el usuario en las distintas paradas. |
| `interests` | array | text[] | Intereses seleccionados. Actualmente se guardan pero no alteran la IA. |
| `accessibility` | string | text | Nivel de accesibilidad requerido (`standard`, `wheelchair`, `low_walking`). No altera la IA actualmente. |
| `audio_speed` | number | double | Preferencia de velocidad de reproducción (1.0x, 1.2x, etc.). |
| `is_public` | boolean | boolean | Define si el perfil es visible para otros viajeros. |
| `is_admin` | boolean | boolean | Bandera booleana de acceso al panel de administración. |
| `bio` | string | text | Pequeña biografía escrita por el usuario. |
| `age` | integer | integer | Edad calculada o introducida. |
| `birthday` | string | text | Fecha de nacimiento. |
| `city` | string | text | Ciudad de residencia del usuario. |
| `country` | string | text | País de residencia del usuario. |
| `stats` | N/A | jsonb | Estadísticas generales adicionales. |
| `saved_intel` | N/A | jsonb | Puntos de información guardados por el usuario. |
| `join_date` | string | text | Fecha en la que el usuario se unió a la app. |
| `passport_number` | string | text | Número único de pasaporte BDAI generado. |
| `updated_at` | string | timestamp | Fecha de última modificación del perfil. |

---

## Tabla: `tours_cache`
*Tabla principal de lectura del sistema. Contiene los tours ya validados por GIS listos para el consumo del usuario.*

| Campo | Tipo | Formato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `city` | string | text | Clave compuesta principal (Slug de la ciudad). <pk/> |
| `language` | string | text | Idioma de los tours (ej. `es`, `en`). <pk/> |
| `data` | N/A | jsonb | El payload principal: Array validado de tours con sus paradas (`Tour[]`). |
| `route_polylines` | N/A | jsonb | Mapa (`tourId` → `Google Encoded Polyline`). Evita recalcular rutas en OSRM. |
| `status` | string | text | `READY` (listo), `GENERATING` (en proceso de bloqueo), `ERROR` (fallo). |
| `locked_until` | string | timestamp | Tiempo de expiración del bloqueo de generación concurrente (suele ser +10 mins). |
| `error_message` | string | text | Si el estatus es `ERROR`, guarda el motivo a nivel de interfaz de usuario. |
| `updated_at` | string | timestamp | Fecha en la que el caché se guardó o actualizó. |

---

## Tabla: `audio_cache`
*Caché de Text-to-Speech (TTS) que almacena audios (migrado a formato MP3) para evitar costes y latencia regenerando locuciones de la IA.*

| Campo | Tipo | Formato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `id` | string | uuid | Identificador interno de la caché de audio. <pk/> |
| `text_hash` | string | text | Hash (SHA-256) del texto original para identificar si la descripción cambió. |
| `text_fragment` | string | text | Guardado del fragmento de texto original exacto. |
| `language` | string | text | Idioma del audio. |
| `city` | string | text | Ciudad a la que pertenece (para facilitar limpieza y migraciones). |
| `url` | string | text | URL pública del archivo de audio almacenado en Supabase Storage. |
| `created_at` | string | timestamp | Fecha de creación. |

---

## Tabla: `public_profiles` (Vista)
*Vista de solo lectura que expone ciertos campos de `profiles` de forma segura, ocultando emails u otros datos sensibles.*

| Campo | Tipo | Formato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `id` | string | text | ID del perfil público. <pk/> |
| `username` | string | text | Nombre de usuario público. |
| `avatar` | string | text | URL del avatar. |
| `miles` | integer | integer | Puntuación del usuario (Millas). |
| `rank` | string | text | Rango actual. |
| `join_date` | string | text | Fecha de alta. |
| `is_public` | boolean | boolean | Verificación del flag de privacidad. |

---

## Tabla: `error_logs`
*Registro unificado de errores y bugs capturados automáticamente o reportados por usuarios.*

| Campo | Tipo | Formato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `id` | string | uuid | Identificador del log. <pk/> |
| `error_message` | string | text | Mensaje devuelto por el try/catch o por el reporte del usuario. |
| `context` | string | text | Stacktrace, información del navegador (User-Agent), o contexto del componente React. |
| `user_email` | string | text | Email del usuario afectado (o `anonymous`). |
| `language` | string | text | Idioma configurado por el usuario cuando saltó el error. |
| `url` | string | text | URL exacta (`window.location.href`) en la que sucedió. |
| `created_at` | string | timestamp | Momento en el que se registró el error. |
