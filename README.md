# Mercaplanner

Primera versión local para probar el flujo de organización del hogar, menú, catálogo, despensa y compra.

## Requisitos

- Node.js 20.9 o posterior
- pnpm

## Ejecutar en local

```bash
pnpm install
pnpm dev
```

Abre <http://127.0.0.1:3000>. No hacen falta claves de API ni servicios de pago. Para detener el servidor, usa `Ctrl+C` en la terminal.

## Datos en esta versión

- Los datos del hogar se guardan en `localStorage` del navegador en el que se usa la aplicación.
- GitHub sincroniza el código y la documentación; no sincroniza los datos personales del navegador.
- El catálogo empieza vacío. La fuente de referencia de precios es la [tienda online oficial de Mercadona](https://tienda.mercadona.es/). El importador lee la primera hoja de un Excel (`.xlsx` o `.xls`) con datos contrastados allí; acepta las columnas `Nombre`, `Marca`, `Categoría`, `Formato`, `Precio` y `Código_postal` (también reconoce nombres ingleses equivalentes), y opcionalmente `URL`, `Alias` y `Fecha_actualizacion` (`AAAA-MM-DD`). Los alias permiten vincular el nombre comercial del producto con el ingrediente de una receta.
- La app no descarga precios automáticamente ni usa una API no oficial: pide confirmar que el Excel se ha comprobado en la tienda oficial, y conserva la fuente y fecha de consulta para cada producto. Si la fecha del Excel no está en formato `AAAA-MM-DD`, aplica la fecha seleccionada en pantalla. Un producto añadido a mano solo queda verificado si incluye precio y URL de tienda.mercadona.es; los demás aparecen como pendientes. El campo Alias permite relacionar el nombre comercial con el ingrediente de una receta.
- Mercadona indica que los precios online coinciden con los de tienda física; el precio final de productos de peso variable puede cambiar según la cantidad preparada. Consulta [la explicación oficial de precios](https://ayuda.tienda.mercadona.es/hc/es/articles/360000857491-Precios-de-los-productos-SPB).
- Las recetas incluidas son una pequeña semilla demostrativa, todavía no la biblioteca revisada de 60 recetas acordada.
- Si se declara una alergia o intolerancia, el generador se bloquea: esta versión aún no cuenta con fichas verificadas de alérgenos.
- La planificación, la lista y la despensa son locales y de un solo hogar. No hay cuentas, invitaciones ni sincronización entre dispositivos.

## Próxima fase

Conectar el modelo de datos local con Supabase/PostgreSQL, implementar cuentas y permisos de hogares, ampliar y revisar la biblioteca de recetas y completar la validación del catálogo y alérgenos antes de usar la planificación en hogares reales.

