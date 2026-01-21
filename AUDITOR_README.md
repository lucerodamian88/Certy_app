# Auditor Certy - Documentación de Uso Real

## 🚀 Configuración Inicial

### 1. Instalar Dependencias

```powershell
pip install -r requirements.txt
```

### 2. Configurar API Key de Gemini

Necesitas una API Key de Google AI (Gemini). Si no tienes una:
1. Ve a https://aistudio.google.com/app/apikey
2. Crea una nueva API key
3. Configúrala en tu entorno:

```powershell
# En PowerShell (Windows)
$env:GEMINI_API_KEY="TU_API_KEY_AQUI"
```

O de forma permanente:
```powershell
setx GEMINI_API_KEY "TU_API_KEY_AQUI"
```

### 3. Iniciar el Servidor Backend

```powershell
python auditor_server.py
```

Deberías ver:
```
✓ API Key configurada
🚀 Servidor Auditor Certy iniciado en http://localhost:5000
```

### 4. Abrir el Frontend

Abre `auditor.html` en tu navegador o usa Live Server.

## 🔧 Cómo Funciona

### Flujo Completo:

1. **Usuario sube PDF** → El frontend (`auditor.html`) envía el archivo al servidor Flask
2. **Backend recibe PDF** → `auditor_server.py` guarda temporalmente el archivo
3. **Procesamiento con Gemini** → El PDF se sube a Gemini API (`gemini-1.5-flash`)
4. **Extracción de datos** → Gemini extrae el JSON con los porcentajes y montos
5. **Validación matemática** → Se ejecutan todos los controles:
   - ✓ Suma de cada fila debe ser 100%
   - ✓ Suma de porcentajes mensuales = Total acumulado
   - ✓ Suma de montos mensuales = Monto total del contrato
   - ✓ Consistencia horizontal (acumulados mes a mes)
6. **Respuesta al frontend** → El servidor devuelve JSON con los errores encontrados (o éxito)
7. **Visualización** → El frontend muestra los resultados en formato amigable

## 📋 Ejemplo de Uso

1. Sube un PDF de Plan de Trabajo con la estructura esperada
2. El sistema procesará automáticamente
3. Verás resultados como:
   - ✅ APROBADO (si todo está correcto)
   - ❌ ERROR: El ítem 'Hormigón Armado' suma 90%, debe sumar 100%
   - ❌ ERROR: La suma de montos mensuales ($1,200,500) no coincide con el monto total ($1,200,000)

## 🛠️ Estructura de Archivos

- **auditor.html** → Frontend con drag & drop
- **auditor_server.py** → Servidor Flask (Backend)
- **auditor_logic.py** → Lógica de procesamiento y validación
- **requirements.txt** → Dependencias Python

## ⚠️ Solución de Problemas

### Error: "No se encontró GEMINI_API_KEY"
→ Configura la variable de entorno con tu API key (ver paso 2)

### Error: "Error de conexión"
→ Asegúrate de que el servidor esté corriendo (`python auditor_server.py`)

### Error: "CORS"
→ El servidor ya tiene CORS habilitado, pero verifica que estés usando `localhost:5000`

## 🔐 Seguridad

- **NO** compartas tu API key en repositorios públicos
- Usa variables de entorno para manejar credenciales
- Los archivos PDF se eliminan automáticamente después del procesamiento
