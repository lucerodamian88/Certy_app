# Guía Rápida - Auditor Certy

## ✅ Estado de la Implementación

- ✅ Backend: Integración real con Gemini API
- ✅ Validaciones matemáticas: Funcionando correctamente
- ✅ Servidor Flask: Listo para recibir PDFs
- ✅ Frontend: Conectado al backend real
- ✅ Dependencias: Instaladas correctamente

## 🚀 Cómo Usar

### Paso 1: Configurar API Key de Gemini

```powershell
# Opción A: Temporal (solo esta sesión)
$env:GEMINI_API_KEY="tu_api_key_aqui"

# Opción B: Permanente (recomendado)
setx GEMINI_API_KEY "tu_api_key_aqui"
```

🔑 **Obtén tu API key aquí:** https://aistudio.google.com/app/apikey

### Paso 2: Iniciar el Servidor

```powershell
# Usa el script de inicio automático
.\start_auditor.bat

# O manualmente:
python auditor_server.py
```

Deberías ver:
```
✓ API Key configurada
🚀 Servidor Auditor Certy iniciado en http://localhost:5000
```

### Paso 3: Abrir la Interfaz

Abre `auditor.html` en tu navegador (doble clic o usando Live Server).

### Paso 4: Subir un PDF

1. Arrastra y suelta tu PDF de Plan de Trabajo
2. Espera mientras Gemini procesa el documento
3. Revisa los resultados de la auditoría

## 🧪 Probar Sin PDF

Si quieres verificar que las validaciones funcionan antes de usar un PDF real:

```powershell
python test_auditor.py
```

Este script prueba la lógica matemática sin necesidad de API key o PDFs.

## 📊 Qué Valida el Auditor

### Control 1: Suma de filas (Hoja 1)
Cada ítem debe sumar 100% entre todos sus meses.

**Ejemplo de error:**
```
ERROR: El ítem 'Hormigón Armado' suma 90.0%, debe sumar 100%.
```

### Control 2: Suma de porcentajes mensuales (Hoja 2)
La suma de todos los porcentajes mensuales debe coincidir con el acumulado final.

### Control 3: Suma de montos mensuales (Hoja 2)
La suma de montos mensuales debe coincidir con el monto total del contrato.

**Ejemplo de error:**
```
ERROR: La suma de montos mensuales ($1,200,500) no coincide con el monto total ($1,200,000).
```

### Control 4: Consistencia horizontal
Cada acumulado debe ser igual al anterior + el mensual correspondiente.

## ❓ Solución de Problemas

### "No se encontró GEMINI_API_KEY"
→ Configura tu API key (ver Paso 1)

### "Error de conexión... servidor no está ejecutándose"
→ Inicia el servidor con `python auditor_server.py` o `.\start_auditor.bat`

### Puerto 5000 ya está en uso
→ Cambia el puerto en `auditor_server.py` (línea final) y en `auditor.html` (URL del fetch)

### Google AI deprecation warning
→ Es solo una advertencia. El código funciona correctamente. Google migrará a `google.genai` en futuras versiones.

## 📁 Archivos Clave

- **`auditor.html`** - Interfaz de usuario (drag & drop)
- **`auditor_server.py`** - Servidor backend Flask
- **`auditor_logic.py`** - Lógica de procesamiento y validación
- **`test_auditor.py`** - Script de pruebas sin PDF
- **`start_auditor.bat`** - Script de inicio rápido

## 🎯 Siguiente Paso

1. Configura tu API key
2. Ejecuta `.\start_auditor.bat`
3. Abre `auditor.html` en tu navegador
4. ¡Sube un PDF y prueba!

---

**Nota:** El sistema ahora procesa PDFs REALES usando Gemini. Los datos falsos ($1.200.500) han sido eliminados completamente.
