# GEMINI.md — Reglas del Proyecto y Programación Agéntica (NutrIA)

Este archivo define las directrices obligatorias para el Agente Orquestador y todos los Subagentes en el proyecto **NutrIA**.

---

## 1. Activación Permanente de Skills del Proyecto

Todo agente (Orquestador o Subagente) debe operar bajo las siguientes skills disponibles en `.agents/skills/`:

| Skill | Ámbito de Aplicación | Directriz Clave |
| :--- | :--- | :--- |
| **`caveman`** | Comunicación & Respuestas | **Respuesta directa primero, sin relleno.** Eliminar saludos, cortesías o cierres vacíos. Mantener intactos código, comandos, paths, números y errores. Claro, conciso y técnico. |
| **`ponytail`** | Código & Arquitectura | **Desarrollador Senior Pragmático / YAGNI.** La mejor línea de código es la que no se escribe. Solucionar con el cambio más pequeño y completo posible. Cero abstracciones prematuras ni envoltorios innecesarios. Código limpio, testeable y mantenible. |
| **`frontend-design`** | Frontend (`nutria-frontend`) | **Diseño intencional y auténtico.** Prohibido el look genérico de IA (cards idénticas con gradientes repetitivos, textos en ALL-CAPS innecesarios, acentos arbitrarios). Paleta de colores deliberada, tipografía con jerarquía real, UI limpia y accesible enfocada en el usuario de nutrición. |

---

## 2. Protocolo de Orquestación y Subagentes

El mayor riesgo en programación agéntica es la dispersión (subagentes que asumen demasiado alcance, modifican archivos ajenos o generan respuestas eternas). 

### Reglas para el Orquestador (Parent Agent)

1. **Descomposición Atómica:** Nunca delegues tareas abiertas o ambiguas (ej: *"implementa el módulo de comidas"*). Divide siempre en tareas atómicas y autocontenidas.
2. **El Contrato Cuádruple:** Todo `invoke_subagent` debe incluir obligatoriamente:
   - **Objetivo Único (Single Responsibility):** Qué problema exacto debe resolver.
   - **Perímetro de Archivos (File Fence):** Lista explícita de archivos/directorios que tiene permiso de leer y modificar. Prohibido tocar fuera de ese perímetro.
   - **Instrucción de Skills:** Recordar al subagente: *"Aplica `caveman` para tu reporte y `ponytail` para el código (y `frontend-design` si es UI)"*.
   - **Criterio de Aceptación (Definition of Done - DoD):** Condición exacta para considerar la tarea terminada (ej: *"endpoint responde 200 con test unitario pasando"*).
3. **Control del Flujo:** El orquestador integra los resultados, ejecuta pruebas globales y decide el siguiente paso. Los subagentes no orquestan a otros subagentes a menos que se defina explícitamente.

#### Plantilla para invocar un Subagente:
```text
Rol: [Frontend Specialist / Backend Specialist / Bug Fixer]
Objetivo: Implementar validación de macros en el serializer de comidas.
Perímetro permitido:
  - nutria-backend/core/serializers/meal.py
  - nutria-backend/core/tests/test_meal_serializers.py
Skills requeridas: caveman (comunicación directa), ponytail (mínimo código limpio).
Definition of Done:
  1. Validación implementada sin añadir dependencias nuevas.
  2. Tests unitarios cubren límites y pasan exitosamente.
Reporte requerido: Formato caveman (Status, Archivos modificados, Tests ejecutados, Riesgos/omitido).
```

### Reglas para los Subagentes

1. **Aislamiento Estricto:** Trabaja únicamente dentro del perímetro asignado. Si descubres que se requiere un cambio fuera de tu alcance, repórtalo al Orquestador; no lo toques.
2. **Finalización Inmediata:** Una vez cumplido el DoD, detén la ejecución. No agregues refactorizaciones "de paso", comentarios obvios ni optimizaciones no solicitadas.
3. **Reporte Ultraconciso (`caveman`):** Al concluir o fallar, responde con estructura concisa:
   - **Estado:** Éxito / Bloqueo.
   - **Cambios:** Archivos modificados y qué se hizo en 1 línea por archivo.
   - **Verificación:** Comando o test ejecutado y su resultado.
   - **Límites / Riesgos:** 1 línea indicando qué se omitió o qué debe saber el orquestador (`ponytail`).

---

## 3. Estándares de Código Limpio y Arquitectura

### Backend (`nutria-backend`) — Django 6 + DRF + PostgreSQL
- **Clean Code:** Estructura modular estándar de Django. Nombres descriptivos, funciones pequeñas con una sola responsabilidad.
- **Tipado & Robustez:** Uso de type hints en lógica de negocio y servicios.
- **Consultas Eficientes:** Evitar problema N+1 usando `select_related` y `prefetch_related`.
- **Manejo de Errores:** Validaciones a nivel de Serializer/Model. Respuestas de error coherentes en formato JSON con códigos HTTP adecuados.
- **Dependencias:** No agregar paquetes a `requirements.txt` sin justificación estricta. Priorizar biblioteca estándar y DRF.

### Frontend (`nutria-frontend`) — React + Vite + Bun
- **Clean Components:** Componentes pequeños, funcionales, desacoplados y con props explícitas.
- **Estado Predecible:** Manejar estado local con hooks nativos (`useState`, `useReducer`); evitar sobrecargar el contexto global.
- **Estilo & UI (`frontend-design`):**
  - Aplicar tokens semánticos de diseño (espaciados, colores, fuentes).
  - Interactividad intuitiva para usuarios de salud y nutrición (feedback visual en guardado, estados de carga y error legibles).
  - Evitar duplicación de clases y selectores CSS conflictivos.
- **Validaciones:** Validación en cliente para UX inmediata, manteniendo sincronía con los contratos del backend.

---

## 4. Filosofía de Trabajo y Buenas Prácticas

1. **Comprobar antes de dar por terminado:** No asumas que el código funciona. Ejecuta linting, build o tests correspondientes (`bun run build`, `python manage.py test`, etc.).
2. **Preservar el Contexto:** Respeta la configuración de base de datos en Docker / WSL descrita en `README.md`. No modifiques `.env` ni credenciales sin confirmación.
3. **Mínimo Ruido, Máxima Precisión:** Mensajes claros, cambios atómicos y trazabilidad en cada paso.

