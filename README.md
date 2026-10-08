# Hoy

**Hoy** es una app web instalable (PWA) para iPhone que junta en un solo sitio tu rutina diaria, el gimnasio, tus tareas, tus gastos y tus notas. Desarrollada por Javier Lorenzo.

- 100 % estática: HTML, CSS y JavaScript (módulos ES), sin dependencias ni compilación.
- Funciona sin conexión (service worker) y se instala como app.
- Tus datos se guardan solo en tu dispositivo (`localStorage`, clave `hoy.v1`). Sin analíticas ni servicios externos.
- Modo claro y oscuro automáticos.

## Qué incluye

- **Hoy**: anillo de progreso del día y rutina diaria con casillas y contadores (creatina, 10 vasos de agua, ir al gym, proteína…), con racha, días de la semana y resumen de los últimos 7 días. Tareas con alta rápida.
- **Gym**:
  - *Entrenar*: registra series (kg × repeticiones) con el peso de la última vez, temporizador de descanso, aviso de récords personales e historial. La pantalla se mantiene encendida durante el entreno.
  - *Rutinas*: crea las tuyas o añade plantillas (Push/Pull/Legs, Full body, Torso/Pierna), asigna días de la semana y usa la biblioteca de ejercicios (con los tuyos propios y su gráfica de progreso).
  - *Cuerpo*: registro de peso con gráfica, IMC, metabolismo basal, calorías y macros según tu objetivo, agua y creatina orientativas.
  - *Calcular*: 1RM con tabla de porcentajes y calculadora de discos.
- **Gastos**: total mensual en euros, barras por categoría y navegación entre meses.
- **Notas**: la primera línea es el título.
- **Ajustes**: nombre, exportar e importar copia en JSON y borrado total con doble confirmación.

Los cálculos de nutrición son orientativos y no sustituyen el consejo de un profesional sanitario.

## Instalar en el iPhone

1. Abre la URL de la app en **Safari**.
2. Pulsa **Compartir**.
3. Elige **Añadir a pantalla de inicio**.

URL: https://cab-soluciones.github.io/hoy-cursor/

## Probar en local

```bash
python3 -m http.server 8000
```

Abre <http://localhost:8000/> en el navegador. Los módulos ES requieren servir los archivos por HTTP (no vale abrir `index.html` con doble clic).

## Estructura

```
index.html            Estructura y metadatos de la PWA
styles.css            Estilos (claro/oscuro, safe-area del iPhone)
sw.js                 Service worker (caché sin conexión)
manifest.webmanifest  Manifiesto de la PWA
js/main.js            Arranque, pestañas y eventos
js/data.js            Estado, validación, ejercicios y plantillas
js/calc.js            Cálculos puros (1RM, IMC, macros, discos, rachas, récords)
js/ui.js              Hoja inferior, avisos, gráficas e iconos
js/hoy.js, gym.js, gastos.js, notas.js, ajustes.js   Una vista por archivo
icons/                Iconos de la app
```

## Para desarrolladores

Cada vez que cambies archivos de la app, sube el número de `CACHE` en `sw.js` (por ejemplo `hoy-v3`) para que los dispositivos descarguen la versión nueva. Si añades un archivo nuevo, inclúyelo también en la lista `ASSETS`.

---

© 2026 Javier Lorenzo. Todos los derechos reservados.
