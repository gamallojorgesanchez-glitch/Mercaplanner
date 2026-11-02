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
- El catálogo empieza vacío. El importador lee la primera hoja de un Excel (`.xlsx` o `.xls`) y acepta las columnas `Nombre`, `Marca`, `Categoría`, `Formato`, `Precio` y `Código_postal` (también reconoce nombres ingleses equivalentes).
- Antes de importar se pide confirmar que el archivo procede de una fuente autorizada y contiene precios verificados. Los productos añadidos manualmente siempre aparecen como pendientes y sus precios no se usan para estimar el presupuesto.
- Las recetas incluidas son una pequeña semilla demostrativa, todavía no la biblioteca revisada de 60 recetas acordada.
- Si se declara una alergia o intolerancia, el generador se bloquea: esta versión aún no cuenta con fichas verificadas de alérgenos.
- La planificación, la lista y la despensa son locales y de un solo hogar. No hay cuentas, invitaciones ni sincronización entre dispositivos.

## Próxima fase

Conectar el modelo de datos local con Supabase/PostgreSQL, implementar cuentas y permisos de hogares, ampliar y revisar la biblioteca de recetas y completar la validación del catálogo y alérgenos antes de usar la planificación en hogares reales.

