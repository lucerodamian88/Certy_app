"""
Script para probar la conexión a Gemini API
"""
import os
import google.generativeai as genai

# Configurar API key
API_KEY = os.environ.get('GEMINI_API_KEY')

if not API_KEY:
    print("ERROR: No se encontró GEMINI_API_KEY")
    print("Configura tu API key:")
    print('  $env:GEMINI_API_KEY="tu_api_key_aqui"')
    exit(1)

print(f"API Key configurada: {API_KEY[:10]}...")

try:
    # Configurar genai
    genai.configure(api_key=API_KEY)
    
    # Crear modelo
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Prueba simple
    print("\nProbando conexión a Gemini...")
    response = model.generate_content("Responde solo con la palabra: OK")
    
    print(f"\n✓ ÉXITO: Gemini respondió: {response.text}")
    print("\nLa API funciona correctamente.")
    
except Exception as e:
    print(f"\n✗ ERROR al conectar con Gemini:")
    print(f"  {type(e).__name__}: {str(e)}")
    print("\nPosibles causas:")
    print("  1. API Key inválida o expirada")
    print("  2. Cuota de API excedida")
    print("  3. Región bloqueada")
