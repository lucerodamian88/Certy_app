from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from auditor_logic import AuditorCerty

app = Flask(__name__)
CORS(app)  # Permitir peticiones desde el frontend

# Configurar API Key desde variable de entorno
API_KEY = os.environ.get('GEMINI_API_KEY')

@app.route('/audit', methods=['POST'])
def audit_pdf():
    """
    Endpoint para recibir el PDF y devolver el resultado de la auditoría.
    """
    try:
        # Verificar que se envió un archivo
        if 'file' not in request.files:
            return jsonify({'error': 'No se envió ningún archivo'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'Nombre de archivo vacío'}), 400
        
        if not file.filename.endswith('.pdf'):
            return jsonify({'error': 'El archivo debe ser un PDF'}), 400
        
        # Guardar temporalmente el archivo
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Crear instancia del auditor
            auditor = AuditorCerty(api_key=API_KEY)
            
            # Paso 1: Extraer datos del PDF usando Gemini
            data = auditor.extraer_datos_pdf(temp_path)
            
            # Paso 2: Realizar auditoría matemática
            errores = auditor.auditar_plan_trabajo(data)
            
            # Construir respuesta
            if not errores:
                return jsonify({
                    'status': 'success',
                    'message': 'APROBADO ✓',
                    'results': [
                        {'type': 'success', 'text': 'Todos los controles pasaron correctamente.'}
                    ]
                })
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'ERRORES DETECTADOS',
                    'results': [{'type': 'error', 'text': error} for error in errores]
                })
        
        finally:
            # Limpiar archivo temporal
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Error al procesar el archivo',
            'results': [{'type': 'error', 'text': f'Error: {str(e)}'}]
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint para verificar que el servidor está funcionando."""
    return jsonify({'status': 'ok', 'message': 'Auditor Certy Backend en funcionamiento'})

if __name__ == '__main__':
    if not API_KEY:
        print("⚠️  ADVERTENCIA: No se encontró GEMINI_API_KEY en las variables de entorno.")
        print("   Configura tu API key antes de usar el auditor:")
        print("   set GEMINI_API_KEY=tu_api_key_aqui")
    else:
        print("✓ API Key configurada")
    
    print("\n🚀 Servidor Auditor Certy iniciado en http://localhost:5000")
    app.run(debug=True, port=5000)
