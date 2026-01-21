"""
Parser de PDF local para extraer tablas y números de Planes de Trabajo.
Alternativa a Gemini API cuando hay problemas de conectividad.
"""
import pdfplumber
import re
from typing import Dict, List

def extraer_numeros_de_texto(texto: str) -> List[float]:
    """Extrae todos los números decimales de un texto."""
    # Buscar números con o sin decimales, incluyendo separadores de miles
    patron = r'-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?'
    numeros = re.findall(patron, texto)
    
    resultado = []
    for num in numeros:
        # Normalizar: reemplazar coma por punto para decimales
        num_limpio = num.replace(',', '.')
        # Eliminar puntos que son separadores de miles
        if num_limpio.count('.') > 1:
            partes = num_limpio.split('.')
            num_limpio = ''.join(partes[:-1]) + '.' + partes[-1]
        try:
            resultado.append(float(num_limpio))
        except:
            pass
    
    return resultado

def extraer_tabla_como_matriz(page) -> List[List[str]]:
    """Extrae la primera tabla encontrada en una página como matriz."""
    tables = page.extract_tables()
    if tables and len(tables) > 0:
        return tables[0]
    return []

def extraer_porcentajes_de_fila(fila: List[str]) -> List[float]:
    """Extrae porcentajes de una fila de tabla."""
    porcentajes = []
    for celda in fila:
        if celda:
            # Buscar números que parezcan porcentajes (0-100)
            numeros = extraer_numeros_de_texto(celda)
            for num in numeros:
                if 0 <= num <= 100:
                    porcentajes.append(num)
    return porcentajes

def extraer_datos_pdf_local(pdf_path: str) -> Dict:
    """
    Extrae datos de un PDF de Plan de Trabajo usando pdfplumber.
    Intenta detectar automáticamente las tablas y porcentajes.
    """
    try:
        with pdfplumber.open(pdf_path) as pdf:
            items_hoja_1 = []
            datos_curva = {
                "porcentajes_mensuales": [],
                "porcentajes_acumulados": [],
                "montos_mensuales": [],
                "montos_acumulados": []
            }
            
            # Procesar página 1 (Hoja 1)
            if len(pdf.pages) > 0:
                page1 = pdf.pages[0]
                tabla = extraer_tabla_como_matriz(page1)
                
                if tabla:
                    for fila in tabla[1:]:  # Saltar header
                        if fila and len(fila) > 0:
                            descripcion = fila[0] if fila[0] else "Item"
                            porcentajes = extraer_porcentajes_de_fila(fila[1:])
                            
                            if porcentajes:
                                items_hoja_1.append({
                                    "descripcion": descripcion.strip(),
                                    "porcentajes_mensuales": porcentajes
                                })
            
            # Procesar página 2 (Hoja 2 - Curva)
            if len(pdf.pages) > 1:
                page2 = pdf.pages[1]
                tabla = extraer_tabla_como_matriz(page2)
                
                if tabla:
                    # Intentar detectar columnas
                    for fila in tabla[1:]:  # Saltar header
                        if fila and len(fila) >= 4:
                            # Asumiendo: [Mes, %Mensual, %Acum, MontoMensual, MontoAcum]
                            perc_mens = extraer_numeros_de_texto(fila[1]) if len(fila) > 1 else []
                            perc_acum = extraer_numeros_de_texto(fila[2]) if len(fila) > 2 else []
                            monto_mens = extraer_numeros_de_texto(fila[3]) if len(fila) > 3 else []
                            monto_acum = extraer_numeros_de_texto(fila[4]) if len(fila) > 4 else []
                            
                            if perc_mens:
                                datos_curva["porcentajes_mensuales"].extend(perc_mens)
                            if perc_acum:
                                datos_curva["porcentajes_acumulados"].extend(perc_acum)
                            if monto_mens:
                                datos_curva["montos_mensuales"].extend(monto_mens)
                            if monto_acum:
                                datos_curva["montos_acumulados"].extend(monto_acum)
            
            # Si no encontramos datos, devolver estructura vacía pero válida
            if not items_hoja_1:
                # Extraer TODOS los números del PDF como fallback
                todo_texto = " ".join([page.extract_text() or "" for page in pdf.pages])
                numeros = extraer_numeros_de_texto(todo_texto)
                porcentajes = [n for n in numeros if 0 <= n <= 100]
                
                if porcentajes:
                    # Agrupar en items de 3 meses (asumiendo plan trimestral)
                    for i in range(0, min(len(porcentajes), 9), 3):
                        items_hoja_1.append({
                            "descripcion": f"Item {len(items_hoja_1)+1}",
                            "porcentajes_mensuales": porcentajes[i:i+3]
                        })
            
            return {
                "items_hoja_1": items_hoja_1,
                "datos_curva_hoja_2": datos_curva
            }
    
    except Exception as e:
        raise Exception(f"Error al parsear PDF localmente: {str(e)}")

if __name__ == "__main__":
    # Test básico
    import sys
    if len(sys.argv) > 1:
        resultado = extraer_datos_pdf_local(sys.argv[1])
        import json
        print(json.dumps(resultado, indent=2, ensure_ascii=False))
