# Hoy

**Hoy** es una app web instalable (PWA) para iPhone que reúne en un solo sitio tus tareas del día, hábitos con racha, gastos mensuales y notas. Desarrollada por Javier Lorenzo.

- 100 % estática: HTML, CSS y JavaScript, sin dependencias ni compilación.
- Funciona sin conexión (service worker).
- Tus datos se guardan solo en tu dispositivo (`localStorage`, clave `hoy.v1`). No hay analíticas ni servicios externos.
- Modo claro y oscuro automáticos.

## Instalar en el iPhone

1. Abre la URL de la app en **Safari**.
2. Pulsa **Compartir**.
3. Elige **Añadir a pantalla de inicio**.

URL: https://cab-soluciones.github.io/hoy-cursor/

## Probar en local

```bash
python3 -m http.server 8000
```

Abre <http://localhost:8000/> en el navegador.

## Copia de seguridad

En **Ajustes** puedes exportar e importar tus datos en JSON.

---

© 2026 Javier Lorenzo. Todos los derechos reservados.
