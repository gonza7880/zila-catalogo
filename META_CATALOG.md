# ZILA — Catálogo para Meta

El catálogo público de ZILA expone un feed CSV compatible con Meta Commerce Manager:

- Producción: `https://zila.com.ar/meta-feed.csv`
- Endpoint técnico: `https://zila.com.ar/api/meta-feed`

## Fuente de datos

El feed consulta en tiempo real las mismas tablas de Supabase que usa el storefront:

- `products`
- `product_variants`
- `product_images`

Solo incluye productos activos. El stock se calcula sumando las variantes activas y el precio se toma de `base_price`.

Cada producto conserva el SKU como ID estable y enlaza a una URL profunda del catálogo, por ejemplo:

`https://zila.com.ar/?producto=ADELA&utm_source=meta&utm_medium=catalogo&utm_campaign=catalogo_zila`

El storefront reconoce el parámetro `producto` y abre directamente la ficha correspondiente.

## Campos enviados a Meta

- `id`
- `title`
- `description`
- `availability`
- `condition`
- `price`
- `link`
- `image_link`
- `brand`
- `product_type`
- `material`
- `custom_label_0` (colección)

El feed usa un producto por SKU/modelo. Los talles y colores siguen administrándose dentro de ZILA y no generan productos duplicados en Meta.

## Alta en Commerce Manager

1. Crear o elegir el catálogo de ZILA.
2. Agregar una fuente de datos mediante feed programado.
3. Usar `https://zila.com.ar/meta-feed.csv`.
4. Configurar la actualización automática, idealmente diaria.
5. Revisar el diagnóstico de artículos luego de la primera importación.
6. Conectar el catálogo con Instagram, Facebook y WhatsApp Business según corresponda.

## Notas

Las imágenes deben poder ser descargadas públicamente por Meta. Las imágenes nuevas subidas desde el administrador usan Supabase Storage. Algunas imágenes históricas todavía usan enlaces públicos de Google Drive; si Meta rechazara alguno de esos recursos, conviene migrarlo a Supabase Storage.
