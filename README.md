# ZILA — Catálogo online + administrador

Catálogo público de ZILA Calzados con panel privado `/admin`, Supabase y despliegue preparado para Vercel.

## Estado
- Storefront conectado a Supabase.
- Panel `/admin` con autenticación y permisos RLS.
- Productos, variantes, stock e imágenes administrables.
- Selección de productos y consulta por WhatsApp.
- Guía de talles y datos del negocio.
- Base de Supabase ya inicializada con los productos validados del prototipo.

## Rutas
- Tienda: `/`
- Administrador: `/admin`

## Seguridad
`supabase-config.js` contiene únicamente la URL y la publishable key de Supabase. No guardar `service_role`, contraseñas de base de datos ni otras claves secretas en el frontend.

Ver `DEPLOY.md` para configuración y mantenimiento.
