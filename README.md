# Hoy

**Hoy** es una app web instalable (PWA) para iPhone que junta en un solo sitio tu rutina diaria, el gimnasio, tu actividad al caminar, tus tareas, tus gastos y tus notas. Desarrollada por Javier Lorenzo.

- 100 % estática: HTML, CSS y JavaScript (módulos ES), sin dependencias ni compilación.
- Funciona sin conexión (service worker) y se instala como app.
- Tus datos se guardan solo en tu dispositivo (`localStorage`, clave `hoy.v1`). Sin analíticas ni servicios externos.
- Interfaz oscura con celeste y negro, degradados y animaciones sutiles (respeta *reducir movimiento* del sistema).

## Qué incluye

- **Hoy**: anillo de progreso del día, tarjeta **Mi día** (trabajo, curso y trayectos a pie), rutina diaria con casillas y contadores (creatina, agua, gym, pasos…), racha con llama animada, días de la semana y resumen de los últimos 7 días. Tareas con alta rápida. Los hábitos pueden enlazarse al gym o a la meta de pasos.
- **Gym**:
  - *Entrenar*: registra series (kg × repeticiones), temporizador de descanso, aviso de récords personales, objetivo semanal con racha y historial. La pantalla se mantiene encendida durante el entreno.
  - *Rutinas*: crea las tuyas o añade plantillas (Push/Pull/Legs, Full body, Torso/Pierna), asigna días de la semana y usa la biblioteca de ejercicios (con gráfica de progreso).
  - *Progreso*: calendario mensual de entrenos, volumen, grupos musculares y récords.
  - *Cuerpo*: registro de peso con gráfica, IMC, metabolismo basal, calorías y macros según tu objetivo, agua y creatina orientativas.
  - *Calcular*: 1RM con tabla de porcentajes y calculadora de discos.
- **Actividad**: pasos, kilómetros y tiempo andando según tu horario (trabajo L–V 9:00–14:00, curso L–J 16:00–20:00 por defecto), timeline del día, barras semanales y registro manual de pasos reales. En iPhone/Safari no se puede leer Apple Health: los pasos se estiman por horario y distancias que tú configuras, o puedes pegar los pasos del reloj o del móvil a mano.
- **Gastos**: total mensual en euros, barras por categoría y navegación entre meses.
- **Notas**: la primera línea es el título.
- **Ajustes**: nombre, exportar e importar copia en JSON y borrado total con doble confirmación.

Los cálculos de nutrición y actividad son orientativos y no sustituyen el consejo de un profesional sanitario.

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
styles.css            Estilos (celeste/negro, safe-area del iPhone)
sw.js                 Service worker (caché sin conexión)
manifest.webmanifest  Manifiesto de la PWA
js/main.js            Arranque, pestañas y eventos
js/data.js            Estado, validación, ejercicios, plantillas y horario
js/calc.js            Cálculos puros (1RM, IMC, macros, discos, rachas, pasos)
js/ui.js              Hoja inferior, avisos, gráficas, iconos y llama
js/habits.js          Lógica de hábitos programados y auto (gym/pasos)
js/walk.js            Plan diario de trayectos y pasos estimados
js/hoy.js, gym.js, actividad.js, gastos.js, notas.js, ajustes.js
icons/                Iconos de la app
```

## Para desarrolladores

Cada vez que cambies archivos de la app, sube el número de `CACHE` en `sw.js` (por ejemplo `hoy-v3`) para que los dispositivos descarguen la versión nueva. Si añades un archivo nuevo, inclúyelo también en la lista `ASSETS`.

---

© 2026 Javier Lorenzo. Todos los derechos reservados.
