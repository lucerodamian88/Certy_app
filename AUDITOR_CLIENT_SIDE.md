# Auditor Certy - Versión Client-Side

## ✅ Nueva Arquitectura

La aplicación ahora funciona **100% en el navegador** sin necesidad de servidores Python.

## 🚀 Cómo Usar

### 1. Configurar API Key

**Abre `auditor.html` en un editor de texto** y busca esta línea (aproximadamente línea 216):

```javascript
const API_KEY = "TU_API_KEY_AQUI";
```

**Reemplázala con tu API Key de Google AI Studio:**

```javascript
const API_KEY = "AIzaSy...tu_api_key_real";
```

### 2. Obtener API Key

Si no tienes una API Key:
1. Ve a: https://aistudio.google.com/app/apikey
2. Haz clic en "Create API Key"
3. Copia la key generada

### 3. Abrir la Aplicación

Simplemente **haz doble clic en `auditor.html`** para abrirlo en tu navegador.

**¡Ya no necesitas:**
- ❌ Instalar Python
- ❌ Instalar dependencias (pip install...)
- ❌ Iniciar servidor (`python auditor_server.py`)
- ❌ Configurar variables de entorno

## 🎯 Funcionalidades

### ✅ Lo que hace:
1. **Sube un PDF** arrastrando y soltando o seleccionando
2. **Convierte el PDF a Base64** automáticamente
3. **Envía a Gemini 1.5 Flash** para extracción de datos
4. **Valida matemáticamente:**
   - Hoja 1: Cada ítem debe sumar 100%
   - Hoja 2: Suma de porcentajes mensuales = acumulado final
   - Hoja 2: Suma de montos mensuales = monto total
   - Hoja 2: Consistencia mes a mes

### ⚠️ Importante:
- La columna **"Inc." (Incidencia) se IGNORA** automáticamente
- Los montos y porcentajes de Hoja 2 se separan correctamente usando lógica de rangos

## 📁 Archivos Necesarios

**Para que funcione solo necesitas:**
- `auditor.html` (archivo principal)
- `styles_antigravity_utf8.css` (estilos)
- `styles_fixed.css` (estilos adicionales)
- `Certy_cara.png` (favicon - opcional)

**Ya NO necesitas:**
- ~~auditor_server.py~~
- ~~auditor_logic.py~~
- ~~pdf_parser_local.py~~
- ~~requirements.txt~~

## 🌐 Conexión a Internet

**Sí, necesitas internet** para:
- Cargar Font Awesome (iconos)
- Cargar Google Generative AI SDK
- Comunicarte con la API de Gemini

## 🔐 Seguridad

⚠️ **IMPORTANTE:** Tu API Key estará visible en el código HTML.

**Recomendaciones:**
- No compartas el archivo `auditor.html` con la API Key pegada
- No subas el archivo a repositorios públicos
- Considera usar variables de entorno del navegador para producción

## 💡 Ventajas de la Nueva Versión

✅ **Simplicidad:** Un solo archivo HTML
✅ **Portabilidad:** Funciona en cualquier navegador moderno
✅ **Sin instalaciones:** No requiere Python ni dependencias
✅ **Más rápido:** No hay comunicación servidor ↔ cliente
✅ **Fácil de compartir:** Solo envía el HTML (sin tu API Key)

## 🐛 Solución de Problemas

### "API Key no configurada"
→ Edita el HTML y pega tu API Key en la constante

### "Error: Failed to fetch"
→ Verifica tu conexión a Internet

### "Error: API key not valid"
→ Verifica que tu API Key sea correcta y esté activa

### Los resultados no son precisos
→ Gemini está leyendo el PDF, asegúrate de que esté bien formateado

## 📊 Ejemplo de Uso

1. Abre `auditor.html` en Chrome/Edge/Firefox
2. Arrastra tu PDF al área de Drag & Drop
3. Espera mientras Gemini procesa (5-15 segundos)
4. Revisa los resultados:
   - ✅ Verde = Todo correcto
   - ❌ Rojo = Errores detectados

---

**¡Listo! Ya no necesitas el backend de Python.**
