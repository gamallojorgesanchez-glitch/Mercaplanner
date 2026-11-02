# Mercaplanner — Especificación funcional del MVP

**Estado:** requisitos acordados en la fase de descubrimiento  
**Versión:** 1.0  
**Fecha:** 2 de noviembre de 2026  
**Nombre del producto:** provisional

## 1. Propósito

Aplicación web adaptable para ayudar a hogares en España a planificar la alimentación mensual, ajustar las compras al presupuesto y organizar las compras en Mercadona. Debe usar precios y productos verificables, respetar las restricciones alimentarias y reducir el esfuerzo de decidir qué cocinar y comprar.

## 2. Alcance del MVP

Incluye:

- Cuentas con correo electrónico y contraseña.
- Hogares compartidos, con varios hogares por cuenta.
- Configuración de hogar, comensales, horarios, preferencias y restricciones.
- Generación y revisión de un menú para un mes natural desde una biblioteca revisada de aproximadamente 60 recetas.
- Catálogo Mercadona importado por administración desde Excel.
- Lista de compra vinculada al menú aprobado y a los productos de despensa.
- Planificación de compras en fechas elegidas por el usuario.
- Registro de compras y precios pagados.
- Despensa sencilla, basada en la presencia del producto y confirmación de reposición.
- Resumen de presupuesto, gasto y próxima compra.
- Avisos dentro de la aplicación para fechas de compra.

No incluye en esta versión: productos de limpieza e higiene, historial mensual, estadísticas y gráficos, exportación PDF, modo sin conexión ni recetas propias de los usuarios. La biblioteca inicial de recetas se preparará y revisará antes de generar menús.

## 3. Usuarios, hogares y permisos

- Una cuenta puede crear o pertenecer a varios hogares.
- Cada hogar tiene una persona creadora administradora, que gestiona los miembros y ajustes.
- Las personas invitadas pueden consultar y editar menú, despensa y compras.
- La invitación se podrá enviar por correo electrónico o compartir mediante enlace/código.
- Eliminar una cuenta elimina también el hogar y todos sus datos, aunque existan otros miembros. Esta decisión afecta a todos los miembros del hogar.

## 4. Configuración del hogar

Antes de generar el primer menú, se completa la configuración inicial. Los campos que no apliquen podrán quedar vacíos.

Se registran:

- Presupuesto mensual de alimentación.
- Tienda o código postal de referencia.
- Adultos y niños del hogar; edades infantiles agrupadas en 0–5, 6–11 y 12–17 años.
- Productos imprescindibles, elegidos desde el catálogo si están disponibles. El usuario indica el producto; el planificador calcula la cantidad.
- Preferencias, alimentos que no gustan, alergias e intolerancias por persona.
- Productos que hay en la despensa.
- Comidas y días que se quieren planificar: desayuno, comida, merienda y/o cena.
- Estilo de cocina: preparar a diario, cocinar por adelantado o combinar ambos.

El hogar configura un horario semanal habitual de comidas y comensales. Podrá cambiar el número de adultos y niños en días o comidas concretos.

## 5. Restricciones alimentarias

- Las alergias e intolerancias son exclusiones estrictas para la selección.
- Si la ficha de alérgenos de un producto no está verificada o está incompleta, no se recomendará como opción segura.
- Si una comida tiene comensales con restricciones diferentes, el plan podrá proponer platos separados para esos grupos.
- Las preferencias y alimentos no deseados se aplican por persona.

## 6. Calendario y menú mensual

- El usuario elige entre planificar el resto del mes actual o el mes natural siguiente completo.
- Puede seleccionar qué tipos de comida y días incluir; no está obligado a planificar las cuatro comidas.
- La biblioteca inicial contendrá aproximadamente 60 recetas revisadas, con mayor variedad para comidas y cenas, y opciones de desayuno y merienda.
- Las recetas se administran mediante Excel y cada una contendrá nombre, categoría de comida, ingredientes, cantidades, raciones, preparación, tiempo, instrucciones y coste estimado.
- Los costes se calculan usando los formatos reales del catálogo y precios verificados. No se muestran cifras nutricionales.
- Se podrán repetir recetas para favorecer el ahorro; se indicará el número de repeticiones.
- Si no hay suficientes recetas compatibles, se repetirán las recetas aptas y se avisará. No se generarán recetas nuevas mediante IA.
- El usuario revisa y aprueba el menú antes de que se genere su lista de compra.
- Al regenerar el menú se reemplaza el menú completo, incluidos los platos editados o aprobados anteriormente.
- Si cambia el presupuesto, se ofrecerá recalcular el menú.
- Si cambian los comensales u horarios, se ofrecerá recalcular el menú y la compra; los cambios se aplicarán solo tras aceptación.

## 7. Catálogo Mercadona

### 7.1 Datos de producto

Cuando existan en el archivo, cada ficha puede incluir: nombre, marca, categoría, precio, formato, cantidad, precio por kg/litro/unidad, información nutricional, ingredientes, alérgenos, disponibilidad, tienda/zona e imagen. No se inferirán datos ausentes como si fueran reales.

Las imágenes se cargarán mediante URL incluida en Excel o las añadirá administración. Si falta una imagen, se mostrará un marcador genérico.

### 7.2 Importación y actualización

- La administración importa archivos `.xlsx`.
- Cada carga se declara catálogo completo o actualización incremental.
- Las filas válidas se publican automáticamente; las filas con errores se omiten y se informa del detalle del error.
- Administración establece cuánto tiempo permanece vigente cada carga.
- El catálogo mostrará su fecha de actualización.
- Los precios y disponibilidad se consultan para la tienda o código postal elegido cuando el archivo contenga datos de esa zona.
- Si no hay precio verificado para esa zona, se muestra el producto sin precio; no se sustituye por el de otra zona.
- El catálogo comienza vacío y debe comunicarlo claramente hasta la primera importación.
- Habrá una sección para explorar productos.

### 7.3 Productos no disponibles

- Un producto imprescindible que no esté en catálogo puede registrarse manualmente, sin precio, y se marca como pendiente.
- Un ingrediente ausente en catálogo activa una propuesta de equivalente disponible. Se solicita aprobación antes de cambiar la receta o compra.
- Si un producto sube de precio o deja de estar disponible, la aplicación propone una sustitución y espera aprobación.

## 8. Presupuesto y coste

- El presupuesto mensual se aplica únicamente a alimentación.
- El coste planificado de la compra descuenta los productos que el usuario confirma que ya tiene.
- No se afirmará que el plan respeta el presupuesto si hay productos sin precio verificado.
- Si faltan precios, se mostrará el total conocido y un aviso de que el total es incompleto.
- Si los imprescindibles exceden el presupuesto, se conserva el límite y se pide al usuario elegir qué quitar o sustituir.
- Al registrar el precio realmente pagado, este actualiza el gasto de esa compra y se puede proponer como precio de referencia para esa tienda.

## 9. Despensa y lista de compra

- La despensa registra presencia de productos, sin cantidad ni fecha de caducidad.
- Antes de planificar una compra, el usuario confirma si tiene suficiente de cada producto o si debe reponerlo.
- La lista se genera después de aprobar el menú.
- Se presenta como lista única organizada por categorías de producto; no separa imprescindibles, ingredientes de recetas y opcionales.
- Se pueden añadir productos manualmente desde el catálogo. Los imprescindibles ausentes del catálogo se permiten como excepción y quedan sin precio.
- Cada fila puede mostrar producto, imagen si existe, precio, cantidad necesaria, formato, unidades, importe y categoría.
- Cambiar un plato no modifica la lista hasta que el usuario elija actualizarla.
- Se pueden marcar productos comprados y registrar su precio pagado; si no se registra, se usa el precio del catálogo.
- La lista requiere conexión a internet.

## 10. Planificación de compras y avisos

- El usuario define cuántas compras hará y selecciona fechas concretas en el calendario.
- El sistema reparte los productos entre fechas teniendo en cuenta las necesidades del menú, conservación y frescura cuando haya datos suficientes.
- Se muestra el gasto previsto por fecha de compra cuando los precios están disponibles.
- Los avisos aparecen dentro de la aplicación el día de compra; se podrá activar también un aviso el día anterior.

## 11. Inicio y navegación

La pantalla de inicio tendrá un resumen sencillo de presupuesto mensual, gasto registrado y próxima compra. No incluirá gráficos ni estadísticas en el MVP.

Secciones iniciales: Inicio, Mi hogar, Presupuesto, Menú mensual, Lista de compra, Catálogo Mercadona, Mi despensa, Recetas y Configuración. La interfaz será responsive, con navegación sencilla y colores verde, blanco y neutros.

## 12. Uso de IA

- Un optimizador determinista basado en reglas y datos verificados selecciona recetas y calcula cantidades y costes.
- La IA se usa para explicar las propuestas y sugerir sustituciones.
- La IA no inventa productos, precios, recetas ni datos nutricionales.
- Toda sustitución requiere aprobación explícita antes de actualizar menú o lista.

## 13. Criterios de aceptación del MVP

1. Crear una cuenta, crear un hogar y compartirlo con permisos acordados.
2. Completar la configuración del hogar y personalizar comensales por comida y fecha.
3. Importar un Excel de catálogo completo o incremental, validar filas y ver la fecha de actualización.
4. Mantener el catálogo vacío sin datos iniciales y no mostrar precios ficticios.
5. Explorar productos por categoría y zona cuando haya datos disponibles.
6. Generar un menú del periodo elegido desde las recetas revisadas, respetando restricciones y tamaños de ración.
7. Revisar y aprobar el menú para generar una lista con cantidades y precios verificables disponibles.
8. Descontar productos de despensa según confirmación del usuario.
9. Distribuir la compra en fechas elegidas, registrar compras y precios pagados, y recibir avisos dentro de la aplicación.
10. Mostrar con claridad costes incompletos, datos desactualizados, incompatibilidades y sustituciones pendientes de aprobación.

## 14. Decisiones técnicas pendientes

La arquitectura, tecnologías, formato exacto de las plantillas Excel, proveedor de autenticación, almacenamiento, despliegue y los detalles de implementación quedan para la fase de creación. Deben respetar las reglas anteriores, especialmente la trazabilidad de precios y la seguridad de restricciones alimentarias.

