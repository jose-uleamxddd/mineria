# 🏗️ Arquitectura del Sistema - Vista Detallada

## Diagrama C4 - Nivel de Contenedores

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                              CONTEXTO DEL SISTEMA                             │
│                                                                               │
│   ┌─────────────┐                                                            │
│   │             │                                                             │
│   │   CLIENTE   │         Realiza pedidos y pagos                            │
│   │  (Usuario)  │                                                             │
│   │             │                                                             │
│   └──────┬──────┘                                                             │
│          │                                                                    │
│          │ HTTP/REST                                                          │
│          │                                                                    │
│   ┌──────▼────────────────────────────────────────────────────────────────┐  │
│   │                                                                        │  │
│   │                    SISTEMA DE E-COMMERCE                               │  │
│   │            (Plataforma de pedidos con resiliencia)                     │  │
│   │                                                                        │  │
│   └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                          VISTA DE CONTENEDORES                                │
│                                                                               │
│                                                                               │
│   ┌─────────────┐                                                            │
│   │   Cliente   │                                                             │
│   │ (Navegador) │                                                             │
│   └──────┬──────┘                                                             │
│          │                                                                    │
│          │ [1] HTTP Request                                                  │
│          │ POST /api/pedidos/PED-1/pagar                                     │
│          │                                                                    │
│   ┌──────▼────────────────────────────────────────────────────────────────┐  │
│   │                                                                        │  │
│   │                        API GATEWAY                                     │  │
│   │                      (Node.js + Express)                               │  │
│   │                         Puerto: 3000                                   │  │
│   │                                                                        │  │
│   │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │  │
│   │  ┃            PATRONES DE RESILIENCIA                              ┃  │  │
│   │  ┃                                                                  ┃  │  │
│   │  ┃  [Circuit Breaker] ⚡                                           ┃  │  │
│   │  ┃  • Estado: CLOSED / OPEN / HALF_OPEN                           ┃  │  │
│   │  ┃  • Threshold: 50% errores                                      ┃  │  │
│   │  ┃  • Reset: 5 segundos                                           ┃  │  │
│   │  ┃                                                                  ┃  │  │
│   │  ┃  [Timeout] ⏱️                                                   ┃  │  │
│   │  ┃  • Límite: 2 segundos (Pagos)                                  ┃  │  │
│   │  ┃  • Límite: 3 segundos (Pedidos)                                ┃  │  │
│   │  ┃                                                                  ┃  │  │
│   │  ┃  [Retry] 🔄                                                     ┃  │  │
│   │  ┃  • Max intentos: 3                                              ┃  │  │
│   │  ┃  • Exponential backoff: 100ms, 200ms, 400ms                    ┃  │  │
│   │  ┃                                                                  ┃  │  │
│   │  ┃  [Fallback] 💡                                                  ┃  │  │
│   │  ┃  • Respuesta alternativa cuando falla                           ┃  │  │
│   │  ┃  • Estado: PENDIENTE_PROCESAMIENTO                              ┃  │  │
│   │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │  │
│   │                                                                        │  │
│   └───────┬───────────────────────────────────────────┬────────────────────┘  │
│           │                                           │                       │
│           │ [2] HTTP Request                          │ [3] HTTP Request      │
│           │ GET /pedidos/PED-1                        │ POST /pagos/procesar  │
│           │ (Sin resiliencia)                         │ (CON resiliencia)     │
│           │                                           │                       │
│   ┌───────▼──────────────────────┐          ┌────────▼──────────────────────┐│
│   │                              │          │                               ││
│   │   SERVICIO DE PEDIDOS        │          │    SERVICIO DE PAGOS          ││
│   │   (Node.js + Express)        │          │    (Node.js + Express)        ││
│   │     Puerto: 3001             │          │      Puerto: 3002             ││
│   │                              │          │                               ││
│   │  Responsabilidades:          │          │  ⚠️ SERVICIO INESTABLE        ││
│   │  • Catálogo de productos     │          │                               ││
│   │  • Crear pedidos             │          │  Características:             ││
│   │  • Consultar pedidos         │          │  • 30% fallos (Error 500)    ││
│   │  • Validar stock             │          │  • Latencia: 200ms - 3000ms  ││
│   │                              │          │  • Simula servicio externo   ││
│   │  Base de Datos:              │          │                               ││
│   │  ┌────────────────────────┐  │          │  Endpoints:                   ││
│   │  │  In-Memory Map         │  │          │  • POST /pagos/procesar       ││
│   │  │  (Educativo)           │  │          │  • GET  /pagos/stats          ││
│   │  └────────────────────────┘  │          │                               ││
│   │                              │          │                               ││
│   └──────────────────────────────┘          └───────────────────────────────┘│
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos - Procesamiento de Pago

### 1. Escenario Normal (Circuit Breaker CERRADO 🟢)

```
┌──────────┐
│ Cliente  │
└────┬─────┘
     │
     │ POST /api/pedidos/PED-1/pagar
     │
     ▼
┌─────────────────────────────────────────┐
│         API GATEWAY                     │
│                                         │
│  1. Verifica Circuit Breaker: CERRADO   │
│  2. Prepara timeout de 2s               │
│  3. Llama al Servicio de Pagos          │
└────┬────────────────────────────────────┘
     │
     │ HTTP POST
     │ {pedidoId, monto, metodoPago}
     │
     ▼
┌──────────────────────────────────┐
│    SERVICIO DE PAGOS             │
│                                  │
│  1. Simula latencia (500ms)      │
│  2. Aleatorio: ¿Falla? NO (70%)  │
│  3. Procesa pago exitosamente    │
└────┬─────────────────────────────┘
     │
     │ Response 200 OK
     │ {transaccionId, estado: APROBADO}
     │
     ▼
┌─────────────────────────────────────────┐
│         API GATEWAY                     │
│                                         │
│  1. Recibe respuesta en 500ms           │
│  2. Circuit Breaker: ✅ SUCCESS         │
│  3. Mantiene estado: CERRADO            │
└────┬────────────────────────────────────┘
     │
     │ Response 200 OK
     │ {success: true, transaccionId}
     │
     ▼
┌──────────┐
│ Cliente  │ ✅ Pago exitoso
└──────────┘

Tiempo total: ~500ms
```

---

### 2. Escenario con Fallos (Circuit Breaker se ABRE 🔴)

```
┌──────────┐
│ Cliente  │
└────┬─────┘
     │
     │ [Request 1] POST /api/pedidos/PED-1/pagar
     │
     ▼
┌─────────────────────────────────────────┐
│         API GATEWAY                     │
│  Circuit Breaker: CERRADO 🟢            │
└────┬────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│    SERVICIO DE PAGOS             │
│  Aleatorio: FALLO (30%)          │
└────┬─────────────────────────────┘
     │
     │ Response 500 Internal Server Error
     │
     ▼
┌─────────────────────────────────────────┐
│         API GATEWAY                     │
│  Circuit Breaker: ❌ FAILURE            │
│  Tasa de fallo: 30%                     │
│  Estado: Aún CERRADO                    │
└────┬────────────────────────────────────┘
     │
     │ Response 500
     │
     ▼
┌──────────┐
│ Cliente  │ ❌ Error
└────┬─────┘
     │
     │ [Request 2] POST /api/pedidos/PED-2/pagar
     │
     ▼
┌─────────────────────────────────────────┐
│         API GATEWAY                     │
│  Circuit Breaker: CERRADO 🟢            │
└────┬────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│    SERVICIO DE PAGOS             │
│  Aleatorio: FALLO (30%)          │
└────┬─────────────────────────────┘
     │
     │ Response 500 Internal Server Error
     │
     ▼
┌─────────────────────────────────────────┐
│         API GATEWAY                     │
│  Circuit Breaker: ❌ FAILURE            │
│  Tasa de fallo: 55% (>50% threshold!)   │
│  🔴 CAMBIO DE ESTADO: ABIERTO           │
└────┬────────────────────────────────────┘
     │
     │ Response 500
     │
     ▼
┌──────────┐
│ Cliente  │ ❌ Error
└────┬─────┘
     │
     │ [Request 3] POST /api/pedidos/PED-3/pagar
     │
     ▼
┌─────────────────────────────────────────┐
│         API GATEWAY                     │
│  Circuit Breaker: ABIERTO 🔴            │
│                                         │
│  ⚡ NO llama al Servicio de Pagos      │
│  💡 Ejecuta FALLBACK inmediatamente     │
│                                         │
│  Tiempo: < 10ms (vs 2000ms timeout)    │
└────┬────────────────────────────────────┘
     │
     │ Response 202 Accepted
     │ {
     │   success: true,
     │   estado: PENDIENTE_PROCESAMIENTO,
     │   mensaje: "Será procesado más tarde"
     │ }
     │
     ▼
┌──────────┐
│ Cliente  │ ✅ Respuesta rápida con fallback
└──────────┘

Tiempo total: ~10ms (sin llamar al servicio)
```

---

### 3. Recuperación del Circuit Breaker

```
Circuit Breaker: ABIERTO 🔴
(No permite llamadas al Servicio de Pagos)
          │
          │ Pasan 5 segundos (resetTimeout)
          │
          ▼
Circuit Breaker: SEMI-ABIERTO 🟡
(Permite 1 request de prueba)
          │
          ▼
┌──────────────────────────┐
│  Request de prueba       │
│  al Servicio de Pagos    │
└──────┬───────────────────┘
       │
       ├─────── ¿Respuesta exitosa?
       │
       ├─ SÍ ──────────────────────────┐
       │                               │
       │                               ▼
       │                    Circuit Breaker: CERRADO 🟢
       │                    Sistema recuperado
       │
       │
       └─ NO ──────────────────────────┐
                                       │
                                       ▼
                         Circuit Breaker: ABIERTO 🔴
                         Espera otros 5 segundos
```

---

## Componentes y Responsabilidades

### API Gateway

| Componente | Tecnología | Responsabilidad |
|------------|-----------|-----------------|
| **Servidor HTTP** | Express.js | Recibir requests de clientes |
| **Circuit Breaker** | Opossum | Proteger contra fallos en cascada |
| **HTTP Client** | Axios | Comunicación con servicios backend |
| **Retry Logic** | Custom | Reintentar requests fallidos |
| **Fallback Handler** | Opossum | Respuestas alternativas |

### Servicio de Pedidos

| Componente | Tecnología | Responsabilidad |
|------------|-----------|-----------------|
| **Servidor HTTP** | Express.js | API REST |
| **Base de Datos** | In-Memory Map | Almacenar pedidos (educativo) |
| **Validación** | Custom | Validar stock y datos |
| **Catálogo** | JSON | Productos disponibles |

### Servicio de Pagos

| Componente | Tecnología | Responsabilidad |
|------------|-----------|-----------------|
| **Servidor HTTP** | Express.js | API REST |
| **Simulador de Fallos** | Custom | 30% fallos aleatorios |
| **Simulador de Latencia** | Custom | 200ms - 3000ms variable |
| **Estadísticas** | In-Memory | Tracking de tasa de éxito |

---

## Métricas y Observabilidad

### Métricas del Circuit Breaker

```javascript
{
  "fires": 100,           // Total de llamadas
  "successes": 70,        // Llamadas exitosas (70%)
  "failures": 30,         // Llamadas fallidas (30%)
  "rejects": 15,          // Llamadas rechazadas (circuito abierto)
  "timeouts": 5,          // Timeouts
  "fallbacks": 20,        // Veces que se ejecutó el fallback
  "latencyMean": 850,     // Latencia promedio en ms
  "percentiles": {
    "0.5": 500,           // Mediana: 500ms
    "0.95": 1800,         // 95% de requests < 1800ms
    "0.99": 2000          // 99% de requests < 2000ms
  }
}
```

### Estadísticas del Servicio de Pagos

```javascript
{
  "totalRequests": 100,
  "successfulPayments": 70,
  "failedPayments": 30,
  "tasaExito": "70%",
  "tasaFallo": "30%",
  "averageLatency": 1200
}
```

---

## Ventajas de la Arquitectura

### Sin Patrones de Resiliencia ❌

```
Request al Servicio de Pagos (fallando)
   │
   ├─ Intento 1: Espera 2s → Timeout → Error
   ├─ Intento 2: Espera 2s → Timeout → Error
   ├─ Intento 3: Espera 2s → Timeout → Error
   └─ Total: 6 segundos de espera

Resultado:
• Usuario espera 6 segundos
• Servidor sobrecargado con requests inútiles
• Error propagado al cliente
• Sistema no disponible
```

### Con Patrones de Resiliencia ✅

```
Request al Servicio de Pagos (fallando)
   │
   ├─ Circuit Breaker detecta: ABIERTO
   ├─ NO llama al servicio (ahorra tiempo)
   ├─ Ejecuta Fallback: <10ms
   └─ Total: <10ms

Resultado:
• Usuario recibe respuesta inmediata
• Servidor no se sobrecarga
• Respuesta útil (fallback)
• Sistema sigue disponible
```

---

## Conclusión

Esta arquitectura demuestra cómo los patrones de resiliencia transforman un sistema frágil en uno robusto:

1. **Circuit Breaker**: Previene fallos en cascada
2. **Timeout**: Libera recursos rápidamente
3. **Retry**: Maneja fallos transitorios
4. **Fallback**: Mantiene el sistema disponible

El resultado es un sistema que **degrada elegantemente** en lugar de fallar completamente.
