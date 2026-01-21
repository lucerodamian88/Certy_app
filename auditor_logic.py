import os
import json
import google.generativeai as genai
from typing import List, Dict

# Configurar API Key (Se asume que el usuario la tiene en su entorno)
# genai.configure(api_key="TU_API_KEY")

class AuditorCerty:
    def __init__(self, api_key: str = None):
        if api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def extraer_datos_pdf(self, pdf_path: str) -> Dict:
        """
        Extrae datos del PDF usando Gemini 1.5 Flash.
        """
        prompt = """
        Analiza este documento PDF (Plan de Trabajo) y extrae los datos requeridos en formato JSON estricto.
        Estructura requerida:
        {
          "items_hoja_1": [
            {
              "descripcion": "Nombre del ítem",
              "porcentajes_mensuales": [float, float, ...]
            }
          ],
          "datos_curva_hoja_2": {
            "porcentajes_mensuales": [float, ...],
            "porcentajes_acumulados": [float, ...],
            "montos_mensuales": [float, ...],
            "montos_acumulados": [float, ...]
          }
        }
        Asegúrate de que los números sean floats. Si un valor no está presente, usa 0.0.
        No incluyas texto fuera del JSON. Responde ÚNICAMENTE con el JSON válido.
        """
        
        try:
            # Subir el archivo PDF a la API de Gemini
            sample_file = genai.upload_file(path=pdf_path, display_name="Plan de Trabajo")
            
            # Generar el contenido usando el modelo
            response = self.model.generate_content([sample_file, prompt])
            
            # Extraer el texto de la respuesta
            response_text = response.text.strip()
            
            # Limpiar markdown code blocks si están presentes
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            # Parsear JSON
            data = json.loads(response_text.strip())
            return data
            
        except Exception as e:
            raise Exception(f"Error al procesar PDF con Gemini: {str(e)}")

    def auditar_plan_trabajo(self, data: Dict) -> List[str]:
        """
        Realiza la auditoría matemática sobre los datos extraídos.
        """
        errores = []
        tolerancia = 0.01

        # 1. Control Hoja 1 (Suma de Filas)
        for item in data.get("items_hoja_1", []):
            suma = sum(item.get("porcentajes_mensuales", []))
            if abs(suma - 100.0) > tolerancia:
                errores.append(f"ERROR: El ítem '{item['descripcion']}' suma {round(suma, 2)}%, debe sumar 100%.")

        # 2. Control Hoja 2 (Consistencia Vertical - Porcentajes)
        curva = data.get("datos_curva_hoja_2", {})
        suma_perc_mensuales = sum(curva.get("porcentajes_mensuales", []))
        total_perc_acumulado = curva.get("porcentajes_acumulados", [])[-1] if curva.get("porcentajes_acumulados") else 0
        
        if abs(suma_perc_mensuales - total_perc_acumulado) > tolerancia:
            errores.append(f"ERROR: La suma de porcentajes mensuales ({round(suma_perc_mensuales, 2)}%) no coincide con el total acumulado ({round(total_perc_acumulado, 2)}%).")

        # 3. Control Hoja 2 (Consistencia Vertical - Montos)
        suma_montos_mensuales = sum(curva.get("montos_mensuales", []))
        total_monto_acumulado = curva.get("montos_acumulados", [])[-1] if curva.get("montos_acumulados") else 0

        if abs(suma_montos_mensuales - total_monto_acumulado) > tolerancia:
            errores.append(f"ERROR: La suma de montos mensuales ({round(suma_montos_mensuales, 2)}) no coincide con el monto total del contrato ({round(total_monto_acumulado, 2)}).")

        # 4. Control Hoja 2 (Consistencia Horizontal / Acumulada)
        perc_mensuales = curva.get("porcentajes_mensuales", [])
        perc_acumulados = curva.get("porcentajes_acumulados", [])
        
        for i in range(1, len(perc_mensuales)):
            if abs(perc_acumulados[i] - (perc_acumulados[i-1] + perc_mensuales[i])) > tolerancia:
                errores.append(f"ERROR: Inconsistencia en acumulado mes {i+1}. {perc_acumulados[i-1]} + {perc_mensuales[i]} != {perc_acumulados[i]}")

        return errores

def run_audit(pdf_path):
    auditor = AuditorCerty()
    print(f"--- Procesando: {pdf_path} ---")
    
    # Paso A: Extracción
    try:
        data = auditor.extraer_datos_pdf(pdf_path)
        print("Datos extraídos con éxito.")
    except Exception as e:
        print(f"Error en extracción: {e}")
        return

    # Paso B: Auditoría
    reporte = auditor.auditar_plan_trabajo(data)
    
    if not reporte:
        print("RESULTADO: APROBADO ✓ (Sin errores detectados)")
    else:
        print("RESULTADO: ERRORES DETECTADOS X")
        for err in reporte:
            print(f"- {err}")

if __name__ == "__main__":
    # Ejemplo de uso
    run_audit("ejemplo_plan_trabajo.pdf")
