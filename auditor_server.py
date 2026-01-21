from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from auditor_logic import AuditorCerty
from pdf_parser_local import extraer_datos_pdf_local
import json

app = Flask(__name__)
CORS(app)

# Configurar API Key desde variable de entorno
API_KEY = os.environ.get('GEMINI_API_KEY')

# Modo de prueba (cambiar a False cuando la API funcione)
# True = Usa parser local de PDF (sin Gemini)
# False = Usa Gemini API
TEST_MODE = True

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
            
            # Paso 1: Extraer datos del PDF
            if TEST_MODE:
                print(f"[!] MODO PRUEBA: Usando parser local (pdfplumber) para {file.filename}")
                data = extraer_datos_pdf_local(temp_path)
            else:
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
                    ],
                    'test_mode': TEST_MODE
                })
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'ERRORES DETECTADOS',
                    'results': [{'type': 'error', 'text': error} for error in errores],
                    'test_mode': TEST_MODE
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
    return jsonify({
        'status': 'ok',
        'message': 'Auditor Certy Backend en funcionamiento',
        'test_mode': TEST_MODE
    })

@app.route('/toggle-test-mode', methods=['POST'])
def toggle_test_mode():
    """Endpoint para alternar entre modo prueba y modo producción."""
    global TEST_MODE
    TEST_MODE = not TEST_MODE
    return jsonify({
        'test_mode': TEST_MODE,
        'message': f"Modo {'PRUEBA' if TEST_MODE else 'PRODUCCIÓN'} activado"
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("   AUDITOR CERTY - Servidor Backend")
    print("="*60)
    
    if TEST_MODE:
        print("[!] MODO PRUEBA ACTIVADO")
        print("   Se usara parser LOCAL de PDF (pdfplumber)")
        print("   Lectura: SI analiza el PDF real")
        print("   Para usar Gemini API, cambia TEST_MODE = False")
    else:
        if not API_KEY:
            print("[!] ADVERTENCIA: No se encontro GEMINI_API_KEY")
            print("   Configura tu API key:")
            print("   $env:GEMINI_API_KEY='tu_api_key_aqui'")
        else:
            print("[OK] API Key configurada")
    
    print("\n[*] Servidor iniciado en http://localhost:5000")
    print("="*60 + "\n")
    
    app.run(debug=True, port=5000)
