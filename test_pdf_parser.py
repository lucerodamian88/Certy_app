"""
Script de prueba para verificar que el parser local detecta correctamente
las columnas y excluye "Inc." de los porcentajes mensuales.
"""
import sys
import json
from pdf_parser_local import extraer_datos_pdf_local

def probar_extraccion(pdf_path):
    print("="*70)
    print(f"PROBANDO EXTRACCIÓN DE: {pdf_path}")
    print("="*70)
    
    try:
        datos = extraer_datos_pdf_local(pdf_path)
        
        print("\n📊 DATOS EXTRAÍDOS:\n")
        print(json.dumps(datos, indent=2, ensure_ascii=False))
        
        print("\n" + "="*70)
        print("VERIFICACIÓN DE SUMAS:")
        print("="*70)
        
        # Verificar suma de cada ítem
        for i, item in enumerate(datos.get("items_hoja_1", []), 1):
            porcentajes = item.get("porcentajes_mensuales", [])
            suma = sum(porcentajes)
            descripcion = item.get("descripcion", "")
            
            status = "✓ OK" if abs(suma - 100.0) <= 0.01 else "✗ ERROR"
            print(f"{status} Item {i}: {descripcion}")
            print(f"   Porcentajes: {porcentajes}")
            print(f"   Suma: {suma:.2f}%")
            
            if abs(suma - 100.0) > 0.01:
                print(f"   ⚠️  Diferencia: {suma - 100.0:.2f}%")
            print()
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python test_pdf_parser.py <ruta_al_pdf>")
        print("\nEjemplo:")
        print("  python test_pdf_parser.py mi_plan_trabajo.pdf")
    else:
        probar_extraccion(sys.argv[1])
