# Sitio Web — Prototipo Ago

Sitio local. No está publicado en ningún lado todavía.

## Para verlo

Doble clic en **`Abrir sitio.cmd`**. Se abre una ventana negra y el navegador.
Deja la ventana negra abierta mientras lo veas; al cerrarla, el sitio se apaga.

También funciona abriendo `index.html` con doble clic, sin el .cmd.

Para ver también las fichas sin terminar, añade `?borradores=1` al final de la
dirección: `http://localhost:8321/trabajos.html?borradores=1`

## Qué hay

| Página | Qué es |
|---|---|
| `index.html` | Inicio |
| `trabajos.html` | Catálogo histórico, con filtros |
| `trabajo.html` | Ficha de un trabajo |
| `piezas.html` | Tus diseños propios, con configurador y precio |
| `herramientas.html` | Herramientas, insumos e impresos 3D |
| `producto.html` | Ficha de una pieza o herramienta |
| `taller.html` | Quién eres y cómo funciona un encargo |
| `contacto.html` | Tus datos |

## Dónde se cambia el contenido

Todo está en la carpeta **`datos/`**. No hace falta tocar nada más.

- **`datos/trabajos.js`** — el catálogo histórico
- **`datos/tienda.js`** — piezas y herramientas a la venta
- **`datos/marca.js`** — tu WhatsApp, correo, Instagram
- **`datos/textos.js`** — las palabras de la interfaz y las listas de
  tipos, materiales y acabados

Cada archivo empieza con un comentario que explica cada campo.

### Publicar un trabajo que está en borrador

En `datos/trabajos.js`, busca la línea de esa pieza y:

1. Escribe el `resumen` en español y en inglés.
2. Confirma el `anio` y quítale el `anio_estimado: true`.
3. Rellena `materiales` y `acabado` con claves de `datos/textos.js`.
4. Cambia `publicado: false` por `publicado: true`.

Guarda y refresca el navegador.

### Añadir una foto

Mete la imagen en `img/trabajos/` y apunta el campo `imagen` a ella.
Si es foto de verdad y no render, pon `es_render: false` para que
desaparezca el aviso de «falta la foto».

### Añadir un video

Mete el .mp4 en `video/` y apunta el campo `video` a él.
Mientras esté en `null`, la ficha muestra un hueco que dice «Video pendiente».

## Poner las piezas en 3D

El navegador **no puede abrir un `.skp`**: es formato cerrado de Trimble
y no existe forma. Hay que exportar. Pero eso ya está automatizado: son
dos clics para los 32 proyectos de golpe, no uno por uno.

**1. Dentro de SketchUp** (2024), una sola vez:

> Extensiones → Prototipo Ago → **Exportar modelos a la web**

Antes de arrancar te pregunta y te dice cuántos va a hacer. Va abriendo
un archivo tras otro; la pantalla parpadea y tarda unos minutos. Guarda
lo que tengas abierto antes.

Si quieres ver primero qué va a tocar, sin exportar nada, usa
*«Ver qué se exportaría»* en el mismo menú.

**2. Fuera de SketchUp**, clic derecho → Ejecutar con PowerShell:

> `D:\Claude Vault\Herramientas\Convertir-modelos.ps1`

Convierte todos los `.dae` a `.glb` (entre 5 y 10 veces más livianos) y
escribe solo la lista `datos/modelos.js`.

**3. Refresca la página.** Los botones «Ver en 3D» aparecen solos, en los
trabajos y en las piezas. No hay que editar ningún dato.

La conexión se hace por el **nombre de la carpeta del proyecto**: la
carpeta `Repicero Estefania` busca `modelos/repicero-estefania.glb`. Por
eso cada ficha tiene el campo `carpeta`.

Notas:
- La librería 3D (`js/vendor/`, 732 KB) solo se descarga en el navegador
  del cliente cuando pulsa el botón, no al abrir la página.
- Si alguna pieza necesita un modelo distinto al de su carpeta, ponle el
  campo `modelo3d: "modelos/loquesea.glb"` y ese manda.
- La carpeta `modelos\_dae` son los intermedios: se puede borrar después.
- Si algún modelo sale acostado, gigante o del revés, avísame: es el eje
  o la unidad del export, y se corrige en el conversor.

## Lo que todavía no es real

- Los precios de **`datos/tienda.js`** los inventé yo para que vieras la
  página funcionando. Todo lo que tiene `ejemplo: true` hay que revisarlo.
- Las imágenes del catálogo son la miniatura del modelo de SketchUp,
  no fotos. Salen con una etiqueta «3D» encima a propósito.
- El texto de `taller.html` es un borrador mío. Reescríbelo.
- El WhatsApp y el Instagram en `datos/marca.js` son suposiciones.
