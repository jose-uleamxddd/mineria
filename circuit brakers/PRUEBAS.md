# 🧪 EJEMPLOS DE PRUEBAS - Comandos CURL

Este archivo contiene ejemplos de comandos para probar manualmente el sistema.

## 📋 Tabla de Contenidos

1. [Health Checks](#health-checks)
2. [Consultar Productos](#consultar-productos)
3. [Crear Pedidos](#crear-pedidos)
4. [Procesar Pagos](#procesar-pagos)
5. [Monitorear Circuit Breaker](#monitorear-circuit-breaker)
6. [Estadísticas](#estadísticas)

---

## 🏥 Health Checks

### Verificar API Gateway
```bash
curl http://localhost:3000/api/health
```

### Verificar Servicio de Pedidos
```bash
curl http://localhost:3001/health
```

### Verificar Servicio de Pagos
```bash
curl http://localhost:3002/pagos/health
```

---

## 🛒 Consultar Productos

### Listar todos los productos
```bash
curl http://localhost:3000/api/productos
```

**Respuesta esperada:**
```json
{
  "productos": [
    {
      "id": 1,
      "nombre": "Laptop Dell XPS",
      "precio": 1299.99,
      "stock": 10
    },
    {
      "id": 2,
      "nombre": "Mouse Logitech MX",
      "precio": 99.99,
      "stock": 50
    }
  ],
  "total": 5
}
```

---

## 📦 Crear Pedidos

### Crear un pedido con un producto
```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "productoId": 1, "cantidad": 1 }
    ],
    "cliente": {
      "nombre": "Juan Pérez",
      "email": "juan@example.com"
    },
    "metodoPago": "tarjeta_credito"
  }'
```

### Crear un pedido con múltiples productos
```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "productoId": 1, "cantidad": 1 },
      { "productoId": 2, "cantidad": 2 },
      { "productoId": 3, "cantidad": 1 }
    ],
    "cliente": {
      "nombre": "María García",
      "email": "maria@example.com"
    },
    "metodoPago": "paypal"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "pedido": {
    "id": "PED-1",
    "total": 1549.96,
    "estado": "PENDIENTE",
    "createdAt": "2025-12-17T10:30:00.000Z"
  },
  "mensaje": "Pedido creado exitosamente"
}
```

### Consultar un pedido específico
```bash
curl http://localhost:3000/api/pedidos/PED-1
```

---

## 💳 Procesar Pagos

### Procesar pago de un pedido (CON RESILIENCIA)
```bash
curl -X POST http://localhost:3000/api/pedidos/PED-1/pagar
```

**Escenario 1: Pago exitoso (Circuit Breaker CERRADO)**
```json
{
  "success": true,
  "mensaje": "Pago procesado exitosamente",
  "pedido": {
    "id": "PED-1",
    "estado": "PAGADO",
    "transaccionId": "TXN-1702814400000-abc123"
  },
  "pago": {
    "success": true,
    "transaccionId": "TXN-1702814400000-abc123",
    "monto": 1549.96,
    "estado": "APROBADO"
  }
}
```

**Escenario 2: Fallback activado (Circuit Breaker ABIERTO)**
```json
{
  "success": true,
  "mensaje": "Pedido registrado - Pago pendiente de procesamiento",
  "pedido": {
    "id": "PED-1",
    "estado": "PENDIENTE_PROCESAMIENTO"
  },
  "pagoInfo": {
    "fallback": true,
    "mensaje": "El servicio de pagos no está disponible. Tu pedido será procesado más tarde.",
    "instrucciones": "Te notificaremos por email cuando tu pago sea procesado."
  },
  "advertencia": "El servicio de pagos está experimentando problemas."
}
```

### Procesar pago directamente (SIN RESILIENCIA - Para comparación)
⚠️ Este endpoint llama directamente al servicio sin protección del Circuit Breaker

```bash
curl -X POST http://localhost:3001/pedidos/PED-1/procesar-pago
```

**Observa que:**
- ⏱️ Puede tardar hasta 5 segundos (sin timeout)
- ❌ Retorna error 500 si falla
- 🔥 No hay fallback, solo error

---

## 📊 Monitorear Circuit Breaker

### Consultar estado del Circuit Breaker
```bash
curl http://localhost:3000/api/circuit-breaker/status
```

**Respuesta:**
```json
{
  "circuitBreaker": "Payment Service",
  "estado": "CERRADO 🟢",
  "estadisticas": {
    "fires": 25,
    "successes": 18,
    "failures": 7,
    "rejects": 3,
    "timeouts": 2,
    "fallbacks": 5,
    "latencyMean": 850,
    "percentiles": {
      "0.5": 500,
      "0.95": 1800,
      "0.99": 2000
    }
  },
  "configuracion": {
    "timeout": 2000,
    "errorThreshold": 50,
    "resetTimeout": 5000
  }
}
```

**Interpretación:**
- `estado`: Estado actual del circuit breaker
  - 🟢 `CERRADO`: Todo normal
  - 🔴 `ABIERTO`: Servicio caído, usando fallback
  - 🟡 `SEMI-ABIERTO`: Probando recuperación

- `fires`: Total de llamadas realizadas
- `successes`: Llamadas exitosas
- `failures`: Llamadas fallidas
- `rejects`: Llamadas rechazadas (circuito abierto)
- `fallbacks`: Veces que se ejecutó el fallback
- `latencyMean`: Latencia promedio en ms

### Resetear estadísticas del Circuit Breaker
```bash
curl -X POST http://localhost:3000/api/circuit-breaker/reset
```

---

## 📈 Estadísticas

### Estadísticas del Servicio de Pagos
```bash
curl http://localhost:3002/pagos/stats
```

**Respuesta:**
```json
{
  "totalRequests": 50,
  "successfulPayments": 35,
  "failedPayments": 15,
  "averageLatency": 1200,
  "tasaExito": "70.00%",
  "tasaFallo": "30.00%"
}
```

### Resetear estadísticas del Servicio de Pagos
```bash
curl -X POST http://localhost:3002/pagos/reset-stats
```

---

## 🧪 Escenarios de Prueba

### Escenario 1: Flujo Completo Exitoso

```bash
# 1. Consultar productos
curl http://localhost:3000/api/productos

# 2. Crear un pedido
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{ "productoId": 1, "cantidad": 1 }],
    "cliente": { "nombre": "Test", "email": "test@test.com" },
    "metodoPago": "tarjeta_credito"
  }'

# 3. Procesar el pago (reemplaza PED-X con el ID real)
curl -X POST http://localhost:3000/api/pedidos/PED-1/pagar

# 4. Verificar estado del pedido
curl http://localhost:3000/api/pedidos/PED-1
```

---

### Escenario 2: Activar el Circuit Breaker

Ejecuta este comando **múltiples veces** (10-15 veces) para forzar fallos:

```bash
# Ejecuta esto en un loop
for i in {1..15}; do
  echo "Intento $i"
  curl -X POST http://localhost:3000/api/pedidos/PED-1/pagar
  echo "\n---"
  sleep 1
done
```

**En PowerShell (Windows):**
```powershell
1..15 | ForEach-Object {
    Write-Host "Intento $_"
    curl -X POST http://localhost:3000/api/pedidos/PED-1/pagar
    Write-Host "---"
    Start-Sleep -Seconds 1
}
```

**Observa:**
1. Los primeros requests pueden fallar con error 500
2. Después de varios fallos, el Circuit Breaker se ABRE
3. Los siguientes requests reciben respuesta de FALLBACK inmediatamente
4. Respuesta en <10ms vs 2000ms de timeout

**Verificar que el circuito está abierto:**
```bash
curl http://localhost:3000/api/circuit-breaker/status
# Debe mostrar: "estado": "ABIERTO 🔴"
```

---

### Escenario 3: Recuperación del Circuit Breaker

```bash
# 1. Verifica que el circuito está abierto
curl http://localhost:3000/api/circuit-breaker/status

# 2. Espera 5 segundos (resetTimeout)
sleep 5

# 3. Verifica el nuevo estado (debería estar en SEMI-ABIERTO)
curl http://localhost:3000/api/circuit-breaker/status

# 4. Intenta procesar un pago (request de prueba)
curl -X POST http://localhost:3000/api/pedidos/PED-1/pagar

# 5. Si tuvo éxito, el circuito vuelve a CERRADO
curl http://localhost:3000/api/circuit-breaker/status
```

---

### Escenario 4: Comparar CON y SIN Resiliencia

**CON Resiliencia (a través del API Gateway):**
```bash
time curl -X POST http://localhost:3000/api/pedidos/PED-1/pagar
```

**SIN Resiliencia (directo al servicio):**
```bash
time curl -X POST http://localhost:3001/pedidos/PED-1/procesar-pago
```

**Compara:**
- Tiempo de respuesta
- Manejo de errores
- Disponibilidad del sistema

---

## 🐛 Debugging

### Ver logs en tiempo real

**Terminal 1 - API Gateway:**
```bash
cd api-gateway
npm start
```

**Terminal 2 - Servicio de Pedidos:**
```bash
cd servicio-pedidos
npm start
```

**Terminal 3 - Servicio de Pagos:**
```bash
cd servicio-pagos
npm start
```

Observa los logs en cada terminal mientras ejecutas los requests.

---

## 📝 Notas Importantes

1. **Circuit Breaker se abre cuando:**
   - Más del 50% de requests fallan
   - En una ventana de 10 segundos

2. **Circuit Breaker se cierra cuando:**
   - Pasan 5 segundos (resetTimeout)
   - El request de prueba es exitoso

3. **Timeouts configurados:**
   - Servicio de Pagos: 2 segundos
   - Servicio de Pedidos: 3 segundos

4. **Servicio de Pagos (simulación):**
   - 30% de probabilidad de fallo
   - Latencia: 200ms - 3000ms

---

## 🎯 Tips

- Usa [Postman](https://www.postman.com/) o [Thunder Client](https://www.thunderclient.com/) para pruebas más visuales
- Ejecuta el script automatizado: `npm run test` (en la carpeta raíz)
- Monitorea el estado del Circuit Breaker regularmente
- Compara el comportamiento con y sin resiliencia

---

¡Felices pruebas! 🚀
