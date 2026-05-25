# 📌 Logo Rocatrol AI — instrucciones para Julio

## Para que aparezca el logo en el sidebar

1. **Descarga el logo** de Rocatrol AI que tienes (el de la R con circuitos azules + texto "Rocatrol IA").
2. **Guárdalo en esta carpeta** `public/` con el nombre EXACTO:

   ```
   logo-rocatrol-ai.png
   ```

3. Tamaño recomendado: **transparente PNG**, alto ~180px (el sidebar lo ajustará automáticamente a 36px de alto).
4. Refresca el navegador con **Ctrl + Shift + R**.

## Si no haces esto

El sidebar muestra un fallback con texto "**📋 Rocatrol AI**" (el "AI" en dorado). Funciona pero sin tu branding.

## Ruta completa donde debe quedar

```
c:\Users\spijh\OneDrive - Roca Globla builders llc\IA TRABAJO\rocatrol_IA\public\logo-rocatrol-ai.png
```

## Variantes opcionales (futuro)

Si quieres versiones diferentes:
- `logo-rocatrol-ai.png` — versión principal (la que pide el sidebar)
- `logo-rocatrol-ai-dark.png` — variante para fondo oscuro (todavía no usada)
- `logo-rocatrol-ai-icon.png` — solo el icono "R" sin texto (para favicon futuro)

## Para favicon del navegador

Aparte del logo del sidebar, si quieres cambiar el icono pequeño que sale en la pestaña del navegador:
1. Convierte el logo a **`favicon.ico`** (multi-resolución 16x16, 32x32, 48x48)
2. Guárdalo aquí en `public/` con ese nombre exacto: `public/favicon.ico`
3. Next.js lo detecta automáticamente

Hay convertidores gratis online: favicon.io o realfavicongenerator.net
