# ZILA — Deploy

## Arquitectura
- Vercel: hosting del catálogo.
- Supabase: autenticación, productos, variantes, stock, imágenes y datos del negocio.
- `/admin`: panel privado para edición.
- El storefront consulta Supabase y conserva `products-data.js` como respaldo de emergencia.

## Supabase
El proyecto productivo ya fue inicializado y cargado con la base validada del prototipo.

Para agregar un administrador:
1. Crear el usuario en Supabase > Authentication > Users.
2. Ejecutar `sql/03_add_admin_template.sql` reemplazando el email de ejemplo por el usuario creado.

## Frontend
La URL del proyecto y la publishable key están en `supabase-config.js`. La publishable key puede estar en el navegador cuando RLS está correctamente configurado.

**Nunca** incluir `service_role`, contraseña de base de datos u otras claves secretas en el frontend.

## Vercel
Importar `gonza7880/zila-catalogo`, usar el directorio raíz del repositorio y desplegar como sitio estático.

Rutas:
- Tienda: `/`
- Administrador: `/admin`
