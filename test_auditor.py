"""
Script de prueba para verificar la lógica del auditor sin necesidad de PDF.
Esto te permite probar que las validaciones matemáticas funcionan correctamente.
"""

from auditor_logic import AuditorCerty

# Datos de prueba 1: TODO CORRECTO (debe aprobar)
datos_correctos = {
    "items_hoja_1": [
        {"descripcion": "Movimiento de Suelos", "porcentajes_mensuales": [20.0, 30.0, 50.0]},
        {"descripcion": "Hormigón Armado", "porcentajes_mensuales": [10.0, 40.0, 50.0]}
    ],
    "datos_curva_hoja_2": {
        "porcentajes_mensuales": [15.0, 35.0, 50.0],
        "porcentajes_acumulados": [15.0, 50.0, 100.0],
        "montos_mensuales": [1500.0, 3500.0, 5000.0],
        "montos_acumulados": [1500.0, 5000.0, 10000.0]
    }
}

# Datos de prueba 2: CON ERRORES (debe detectar problemas)
datos_con_errores = {
    "items_hoja_1": [
        {"descripcion": "Movimiento de Suelos", "porcentajes_mensuales": [20.0, 30.0, 50.0]},
        {"descripcion": "Hormigón Armado", "porcentajes_mensuales": [10.0, 40.0, 40.0]}  # Error: suma 90
    ],
    "datos_curva_hoja_2": {
        "porcentajes_mensuales": [15.0, 35.0, 50.0],
        "porcentajes_acumulados": [15.0, 50.0, 100.0],
        "montos_mensuales": [1500.0, 3500.0, 5000.5],  # Error: suma no coincide
        "montos_acumulados": [1500.0, 5000.0, 10000.0]
    }
}

print("=" * 60)
print("PRUEBA 1: Datos Correctos (sin errores)")
print("=" * 60)
auditor = AuditorCerty()
errores = auditor.auditar_plan_trabajo(datos_correctos)

if not errores:
    print("[OK] RESULTADO: APROBADO")
    print("   Todos los controles pasaron correctamente.")
else:
    print("[ERROR] RESULTADO: ERRORES DETECTADOS (esto no deberia pasar)")
    for error in errores:
        print(f"   - {error}")

print("\n" + "=" * 60)
print("PRUEBA 2: Datos Con Errores (debe detectar 2 errores)")
print("=" * 60)
errores = auditor.auditar_plan_trabajo(datos_con_errores)

if not errores:
    print("[ERROR] RESULTADO: APROBADO (esto no deberia pasar)")
else:
    print(f"[OK] RESULTADO: ERRORES DETECTADOS ({len(errores)} errores encontrados)")
    for i, error in enumerate(errores, 1):
        print(f"   {i}. {error}")

print("\n" + "=" * 60)
print("Pruebas completadas")
print("=" * 60)
