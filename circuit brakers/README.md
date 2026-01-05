# 🛡️ Patrones de Resiliencia en Microservicios - E-Commerce Educativo

Proyecto educativo que demuestra la implementación de patrones de resiliencia en una arquitectura de microservicios.

## 📋 Tabla de Contenidos

- [Descripción de la Arquitectura](#descripción-de-la-arquitectura)
- [Patrones de Resiliencia Implementados](#patrones-de-resiliencia-implementados)
- [Diagrama de Arquitectura](#diagrama-de-arquitectura)
- [Flujos de Ejecución](#flujos-de-ejecución)
- [Instalación y Ejecución](#instalación-y-ejecución)
- [Pruebas del Sistema](#pruebas-del-sistema)
- [Estructura del Proyecto](#estructura-del-proyecto)

---

## 🏗️ Descripción de la Arquitectura

Este proyecto implementa una arquitectura de microservicios simplificada con **3 componentes principales**:

### 1. **API Gateway** (Puerto 3000)
- **Responsabilidad**: Punto de entrada único para todas las peticiones
- **Tecnología**: Node.js + Express + Opossum (Circuit Breaker)
- **Función clave**: Implementa TODOS los patrones de resiliencia
- **Comunicación**: HTTP REST con los servicios backend

### 2. **Servicio de Pedidos** (Puerto 3001)
- **Responsabilidad**: Gestión de pedidos y catálogo de productos
- **Tecnología**: Node.js + Express + Axios
- **Base de datos**: In-memory (Map) - Solo para propósitos educativos
- **Comunicación**: Expone API REST

### 3. **Servicio de Pagos** (Puerto 3002) - ⚠️ INESTABLE
- **Responsabilidad**: Procesamiento de pagos
- **Tecnología**: Node.js + Express
- **Características**: 
  - **30% de probabilidad de fallo** (Error 500)
  - **Latencia variable** (200ms - 3000ms)
  - Simula un servicio externo poco confiable

---

## 🛡️ Patrones de Resiliencia Implementados

### 1. ⚡ **Circuit Breaker** (Interruptor de Circuito)

**¿Qué es?**  
Un patrón que previene que una aplicación intente ejecutar operaciones que probablemente fallarán.

**¿Cómo funciona?**

```
Estado CERRADO (Normal) 🟢
    ↓
    | Se detectan muchos fallos (>50%)
    ↓
Estado ABIERTO (Protegido) 🔴
    ↓
    | Después de 5 segundos
    ↓
Estado SEMI-ABIERTO (Probando) 🟡
    ↓
    | Si el request funciona
    ↓
Estado CERRADO (Normal) 🟢
```

**Implementación en el código:**

```javascript
const circuitBreakerOptions = {
  timeout: 2000,              // Timeout de 2 segundos
  errorThresholdPercentage: 50, // Abre si >50% fallan
  resetTimeout: 5000,          // Prueba cerrar después de 5s
};

const paymentCircuitBreaker = new CircuitBreaker(
  callPaymentService, 
  circuitBreakerOptions
);
```

**¿Dónde se aplica?**  
En el API Gateway, protegiendo las llamadas al Servicio de Pagos.

**Beneficio:**
- ✅ Evita llamadas innecesarias a un servicio caído
- ✅ Respuestas rápidas (no espera 2 segundos si ya sabe que falla)
- ✅ Permite que el servicio se recupere

---

### 2. ⏱️ **Timeout** (Tiempo Límite)

**¿Qué es?**  
Establece un límite de tiempo máximo para que una operación se complete.

**¿Por qué es importante?**  
Sin timeout, un request puede quedar "colgado" indefinidamente, consumiendo recursos.

**Implementación en el código:**

```javascript
// Timeout en el Circuit Breaker
timeout: 2000  // 2 segundos máximo

// Timeout en axios
const response = await axios.post(url, data, {
  timeout: 2000  // 2 segundos
});
```

**Configuración:**
- **Servicio de Pagos**: 2 segundos
- **Servicio de Pedidos**: 3 segundos

**Beneficio:**
- ✅ Previene requests que cuelgan indefinidamente
- ✅ Libera recursos rápidamente
- ✅ Mejora la experiencia del usuario

---

### 3. 🔄 **Retry** (Reintentos)

**¿Qué es?**  
Reintenta automáticamente una operación fallida antes de devolver un error.

**Estrategia: Exponential Backoff**  
Cada reintento espera el doble de tiempo que el anterior:

```
Intento 1: Inmediato
    ↓ Fallo
Intento 2: Espera 100ms
    ↓ Fallo
Intento 3: Espera 200ms
    ↓ Fallo
Intento 4: Espera 400ms
```

**Implementación en el código:**

```javascript
async function retryWithBackoff(fn, maxRetries = 3, delay = 100) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < maxRetries) {
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  throw lastError;
}
```

**¿Dónde se aplica?**  
En el API Gateway, para llamadas al Servicio de Pedidos (GET productos, POST pedidos).

**Beneficio:**
- ✅ Maneja fallos transitorios (problemas temporales de red)
- ✅ Aumenta la tasa de éxito
- ✅ No sobrecarga el servicio (gracias al backoff)

---

### 4. 💡 **Fallback** (Respuesta Alternativa)

**¿Qué es?**  
Proporciona una respuesta alternativa cuando el servicio principal no está disponible.

**Estrategia: Degradación Elegante**  
En lugar de mostrar un error, el sistema:
1. Acepta el pedido
2. Lo marca como "PENDIENTE_PROCESAMIENTO"
3. Notifica al usuario que será procesado más tarde

**Implementación en el código:**

```javascript
paymentCircuitBreaker.fallback((pedidoId, monto, metodoPago) => {
  return {
    success: false,
    fallback: true,
    estado: 'PENDIENTE_PROCESAMIENTO',
    mensaje: 'Tu pedido ha sido registrado y será procesado cuando el servicio se recupere.',
    instrucciones: 'Te notificaremos por email cuando tu pago sea procesado.'
  };
});
```

**¿Cuándo se activa?**
- Cuando el Circuit Breaker está **ABIERTO** (🔴)
- Cuando la llamada al servicio falla después de los reintentos
- Cuando hay un timeout

**Beneficio:**
- ✅ El sistema sigue funcionando aunque un servicio falle
- ✅ Mejor experiencia de usuario (mensaje claro en lugar de error)
- ✅ Mantiene la disponibilidad del sistema

---

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE                                 │
│                      (Navegador/App)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP Request
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY :3000                           │
│                                                                 │
│  🛡️ PATRONES DE RESILIENCIA                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⚡ Circuit Breaker  (Protección)                         │  │
│  │ ⏱️  Timeout          (2s límite)                         │  │
│  │ 🔄 Retry            (3 intentos)                         │  │
│  │ 💡 Fallback         (Respuesta alternativa)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬─────────────────────────────────┬──────────────────┘
             │                                 │
             │ HTTP REST                       │ HTTP REST
             ▼                                 ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│  SERVICIO DE PEDIDOS     │    │   SERVICIO DE PAGOS             │
│       :3001              │    │        :3002                    │
│                          │    │                                 │
│  📦 Gestiona:            │    │  ⚠️ INESTABLE                   │
│  • Catálogo productos    │    │                                 │
│  • Creación pedidos      │    │  • 30% fallos (500 errors)     │
│  • Consulta estado       │    │  • Latencia 200ms-3000ms       │
│                          │    │  • Simula servicio externo     │
│  DB: In-Memory (Map)     │    │                                 │
└──────────────────────────┘    └─────────────────────────────────┘
```

---

## 🔄 Flujos de Ejecución

### Flujo 1: ✅ **Pago Exitoso (Circuito Cerrado)**

```
1. Cliente solicita: POST /api/pedidos/PED-1/pagar
   ↓
2. API Gateway verifica estado del Circuit Breaker: 🟢 CERRADO
   ↓
3. API Gateway llama al Servicio de Pagos (con timeout de 2s)
   ↓
4. Servicio de Pagos responde exitosamente en 500ms
   ↓
5. Circuit Breaker registra: ✅ SUCCESS
   ↓
6. API Gateway retorna: 200 OK
   {
     "success": true,
     "mensaje": "Pago procesado exitosamente",
     "transaccionId": "TXN-12345"
   }
```

---

### Flujo 2: ❌ **Pago Falla - Circuit Breaker se Abre**

```
1. Cliente: POST /api/pedidos/PED-1/pagar
   ↓
2. API Gateway llama al Servicio de Pagos
   ↓
3. Servicio de Pagos responde: 500 Internal Server Error (FALLO 1)
   ↓
4. Circuit Breaker registra: ❌ FAILURE (tasa de fallo aumenta)
   ↓
5. Cliente: POST /api/pedidos/PED-2/pagar
   ↓
6. Servicio de Pagos: 500 Error (FALLO 2)
   ↓
7. Circuit Breaker: Tasa de fallo > 50% → Estado cambia a 🔴 ABIERTO
   ↓
8. Cliente: POST /api/pedidos/PED-3/pagar
   ↓
9. Circuit Breaker detecta estado ABIERTO
   ↓
10. NO llama al Servicio de Pagos (evita fallo en cascada)
    ↓
11. Ejecuta FALLBACK inmediatamente
    ↓
12. Retorna: 202 Accepted
    {
      "success": true,
      "mensaje": "Pedido registrado - Pago pendiente",
      "estado": "PENDIENTE_PROCESAMIENTO",
      "advertencia": "Procesaremos tu pago lo antes posible"
    }
    
⏱️ Tiempo de respuesta: < 10ms (vs 2000ms esperando timeout)
```

**¿Qué evitamos?**
- ✅ NO hacer llamadas innecesarias a un servicio caído
- ✅ NO esperar 2 segundos por un timeout
- ✅ NO propagar el error al cliente
- ✅ El sistema sigue funcionando

---

### Flujo 3: 🔄 **Circuit Breaker se Recupera**

```
Circuit Breaker está 🔴 ABIERTO (Servicio de Pagos caído)
   ↓
⏱️ Pasan 5 segundos (resetTimeout)
   ↓
Circuit Breaker cambia a 🟡 SEMI-ABIERTO
   ↓
Cliente: POST /api/pedidos/PED-10/pagar
   ↓
Circuit Breaker permite 1 request de prueba
   ↓
¿El Servicio de Pagos responde OK?
   │
   ├─ SÍ → Circuit Breaker vuelve a 🟢 CERRADO
   │        El sistema se recuperó completamente
   │
   └─ NO → Circuit Breaker vuelve a 🔴 ABIERTO
           Espera otros 5 segundos antes de reintentar
```

---

### Flujo 4: 🔄 **Retry con Exponential Backoff**

```
Cliente: GET /api/productos
   ↓
API Gateway intenta llamar al Servicio de Pedidos
   ↓
Intento 1: ❌ Fallo (timeout / error red)
   ↓
⏱️ Espera 100ms (backoff)
   ↓
Intento 2: ❌ Fallo
   ↓
⏱️ Espera 200ms (backoff exponencial)
   ↓
Intento 3: ✅ ÉXITO
   ↓
Retorna productos al cliente

Total: 3 intentos antes de fallar definitivamente
```

---

## 🚀 Instalación y Ejecución

### Requisitos Previos

- **Node.js** v16 o superior
- **npm** o **yarn**

### Paso 1: Instalar Dependencias

Ejecuta estos comandos en cada carpeta:

```bash
# Instalar dependencias del API Gateway
cd api-gateway
npm install

# Instalar dependencias del Servicio de Pedidos
cd ../servicio-pedidos
npm install

# Instalar dependencias del Servicio de Pagos
cd ../servicio-pagos
npm install
```

### Paso 2: Iniciar los Servicios

Abre **3 terminales** y ejecuta cada servicio:

**Terminal 1: Servicio de Pagos**
```bash
cd servicio-pagos
npm start
```

**Terminal 2: Servicio de Pedidos**
```bash
cd servicio-pedidos
npm start
```

**Terminal 3: API Gateway**
```bash
cd api-gateway
npm start
```

### Paso 3: Verificar que los Servicios están Activos

```bash
# Verificar API Gateway
curl http://localhost:3000/api/health

# Verificar Servicio de Pedidos
curl http://localhost:3001/health

# Verificar Servicio de Pagos
curl http://localhost:3002/pagos/health
```

---

## 🧪 Pruebas del Sistema

### Prueba 1: Consultar Productos

```bash
curl http://localhost:3000/api/productos
```

**Respuesta esperada:**
```json
{
  "productos": [
    { "id": 1, "nombre": "Laptop Dell XPS", "precio": 1299.99, "stock": 10 },
    { "id": 2, "nombre": "Mouse Logitech MX", "precio": 99.99, "stock": 50 }
  ]
}
```

---

### Prueba 2: Crear un Pedido

```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "productoId": 1, "cantidad": 1 },
      { "productoId": 2, "cantidad": 2 }
    ],
    "cliente": {
      "nombre": "Juan Pérez",
      "email": "juan@example.com"
    },
    "metodoPago": "tarjeta_credito"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "pedido": {
    "id": "PED-1",
    "total": 1499.97,
    "estado": "PENDIENTE"
  }
}
```

---

### Prueba 3: Procesar Pago (Demostrar Resiliencia)

**Ejecuta múltiples veces para ver diferentes escenarios:**

```bash
# Pago 1
curl -X POST http://localhost:3000/api/pedidos/PED-1/pagar

# Pago 2
curl -X POST http://localhost:3000/api/pedidos/PED-1/pagar

# Pago 3
curl -X POST http://localhost:3000/api/pedidos/PED-1/pagar
```

**Posibles respuestas:**

**Escenario A: Pago Exitoso (Circuit Breaker CERRADO)**
```json
{
  "success": true,
  "mensaje": "Pago procesado exitosamente",
  "transaccionId": "TXN-1234567890",
  "estado": "PAGADO"
}
```

**Escenario B: Fallback Activado (Circuit Breaker ABIERTO)**
```json
{
  "success": true,
  "mensaje": "Pedido registrado - Pago pendiente de procesamiento",
  "estado": "PENDIENTE_PROCESAMIENTO",
  "advertencia": "El servicio de pagos está experimentando problemas."
}
```

---

### Prueba 4: Monitorear el Circuit Breaker

```bash
curl http://localhost:3000/api/circuit-breaker/status
```

**Respuesta:**
```json
{
  "circuitBreaker": "Payment Service",
  "estado": "CERRADO 🟢",
  "estadisticas": {
    "fires": 10,
    "successes": 7,
    "failures": 3,
    "timeouts": 1,
    "fallbacks": 3,
    "latencyMean": 850
  }
}
```

---

### Prueba 5: Simular Fallo en Cascada (Sin Resiliencia)

Para ver la diferencia, puedes probar llamando **directamente** al Servicio de Pedidos:

```bash
# Crear un pedido directamente (sin pasar por el Gateway)
curl -X POST http://localhost:3001/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{ "productoId": 1, "cantidad": 1 }],
    "cliente": { "nombre": "Test", "email": "test@test.com" },
    "metodoPago": "tarjeta_credito"
  }'

# Intentar procesar el pago (SIN protección del Circuit Breaker)
curl -X POST http://localhost:3001/pedidos/PED-1/procesar-pago
```

**Observa:**
- ⏱️ El request puede tardar hasta 5 segundos (timeout)
- ❌ Si el servicio de Pagos falla, recibes un error 500
- 🔥 Si haces múltiples requests, todos esperan el timeout completo

**Con el API Gateway (CON resiliencia):**
- ⚡ El Circuit Breaker abre después de algunos fallos
- 💡 Los siguientes requests reciben respuesta inmediata con Fallback
- ✅ El sistema sigue funcionando

---

## 📁 Estructura del Proyecto

```
circuit-brakers/
│
├── api-gateway/                   # API Gateway con resiliencia
│   ├── index.js                   # Implementación completa
│   ├── package.json
│   └── README.md
│
├── servicio-pedidos/              # Servicio de Pedidos
│   ├── index.js                   # Lógica de pedidos
│   ├── package.json
│   └── README.md
│
├── servicio-pagos/                # Servicio de Pagos (inestable)
│   ├── index.js                   # Simulación de fallos
│   ├── package.json
│   └── README.md
│
├── README.md                       # Este archivo
├── ARQUITECTURA.md                 # Documentación detallada
└── package.json                    # Dependencias globales (opcional)
```

---

## 📚 Conceptos Clave Aprendidos

### 1. **Fallos en Cascada**
Cuando un servicio falla, puede causar que toda la arquitectura falle. Los patrones de resiliencia previenen esto.

### 2. **Circuit Breaker**
Protege tu sistema de hacer llamadas repetidas a un servicio que está fallando.

### 3. **Timeout**
Evita que requests "cuelguen" indefinidamente, mejorando la experiencia del usuario.

### 4. **Retry**
Maneja fallos transitorios (problemas temporales de red) reintentando automáticamente.

### 5. **Fallback**
Proporciona respuestas alternativas para mantener el sistema funcionando.

---

## 🎯 Conclusiones

### ¿Qué pasa SIN patrones de resiliencia?

- ❌ Timeouts largos (usuarios esperando)
- ❌ Errores propagados al cliente
- ❌ Servicios sobrecargados con requests inútiles
- ❌ Fallo en cascada (un servicio cae, todos caen)

### ¿Qué logramos CON patrones de resiliencia?

- ✅ **Respuestas rápidas** (< 10ms con Circuit Breaker abierto)
- ✅ **Sistema disponible** (aunque servicios fallen)
- ✅ **Mejor experiencia de usuario** (mensajes claros vs errores)
- ✅ **Protección contra fallos en cascada**
- ✅ **Recuperación automática** (Circuit Breaker se cierra)

---

## 🔗 Referencias

- [Circuit Breaker Pattern - Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Opossum - Circuit Breaker Library](https://nodeshift.dev/opossum/)
- [Resilience Patterns - Microsoft Azure](https://docs.microsoft.com/en-us/azure/architecture/patterns/category/resiliency)

---

## 👨‍💻 Autor

Proyecto educativo creado para demostrar patrones de resiliencia en microservicios.

## 📄 Licencia

MIT - Uso libre para propósitos educativos
