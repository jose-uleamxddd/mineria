# 🚀 GUÍA DE INICIO RÁPIDO

## Requisitos Previos

- **Node.js** v16 o superior ([Descargar](https://nodejs.org/))
- **npm** (viene con Node.js)
- Terminal/PowerShell

---

## ⚡ Opción 1: Inicio Manual (Recomendado para aprender)

### Paso 1: Instalar Dependencias

Ejecuta estos comandos uno por uno:

```bash
# Instalar dependencias del Servicio de Pagos
cd servicio-pagos
npm install

# Volver e instalar dependencias del Servicio de Pedidos
cd ..
cd servicio-pedidos
npm install

# Volver e instalar dependencias del API Gateway
cd ..
cd api-gateway
npm install

# Instalar dependencias del script de pruebas
cd ..
cd test-scripts
npm install
```

### Paso 2: Iniciar los Servicios

Abre **3 terminales separadas** (o 3 pestañas en tu terminal):

**Terminal 1 - Servicio de Pagos:**
```bash
cd servicio-pagos
npm start
```
✅ Verás: `🏦 SERVICIO DE PAGOS (INESTABLE)` en puerto 3002

**Terminal 2 - Servicio de Pedidos:**
```bash
cd servicio-pedidos
npm start
```
✅ Verás: `📦 SERVICIO DE PEDIDOS` en puerto 3001

**Terminal 3 - API Gateway:**
```bash
cd api-gateway
npm start
```
✅ Verás: `🚀 API GATEWAY CON RESILIENCIA` en puerto 3000

### Paso 3: Verificar que Todo Funciona

Abre una **4ta terminal** y ejecuta:

```bash
curl http://localhost:3000/api/health
```

✅ Si ves una respuesta JSON, todo está funcionando!

---

## 🔥 Opción 2: Inicio Rápido (Todos los servicios a la vez)

### Paso 1: Instalar Dependencias Globales

```bash
npm install
```

### Paso 2: Instalar Dependencias de Todos los Servicios

```bash
npm run install-all
```

### Paso 3: Iniciar Todo

```bash
npm start
```

Esto iniciará los 3 servicios simultáneamente en una sola terminal.

---

## 🐳 Opción 3: Docker Compose (Más fácil)

Si tienes Docker instalado:

```bash
docker-compose up --build
```

Esto inicia todo automáticamente. Para detener:

```bash
docker-compose down
```

---

## 🧪 Ejecutar Pruebas

### Prueba Automatizada (Recomendado)

```bash
cd test-scripts
npm start
```

Esto ejecutará un script que:
1. Crea pedidos automáticamente
2. Procesa múltiples pagos
3. Demuestra cómo funciona el Circuit Breaker
4. Muestra estadísticas finales

### Pruebas Manuales

Consulta el archivo [PRUEBAS.md](./PRUEBAS.md) para ejemplos de comandos curl.

**Ejemplo rápido:**

```bash
# 1. Consultar productos
curl http://localhost:3000/api/productos

# 2. Crear un pedido
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productoId": 1, "cantidad": 1}],
    "cliente": {"nombre": "Test", "email": "test@test.com"},
    "metodoPago": "tarjeta_credito"
  }'

# 3. Procesar pago (reemplaza PED-1 con el ID que obtuviste)
curl -X POST http://localhost:3000/api/pedidos/PED-1/pagar

# 4. Ver estado del Circuit Breaker
curl http://localhost:3000/api/circuit-breaker/status
```

---

## 📊 Endpoints Útiles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `http://localhost:3000/api/productos` | GET | Listar productos |
| `http://localhost:3000/api/pedidos` | POST | Crear pedido |
| `http://localhost:3000/api/pedidos/:id` | GET | Consultar pedido |
| `http://localhost:3000/api/pedidos/:id/pagar` | POST | **Procesar pago (CON resiliencia)** |
| `http://localhost:3000/api/circuit-breaker/status` | GET | Estado del Circuit Breaker |
| `http://localhost:3000/api/health` | GET | Health check |
| `http://localhost:3002/pagos/stats` | GET | Estadísticas del servicio de pagos |

---

## 🎯 ¿Qué Observar?

### 1. Circuit Breaker en Acción

Ejecuta múltiples pagos para ver cómo el Circuit Breaker:
- Empieza CERRADO 🟢
- Detecta fallos y se ABRE 🔴
- Activa el FALLBACK 💡
- Se recupera después de 5 segundos 🟡

### 2. Diferencia de Tiempos

**Con Circuit Breaker ABIERTO:**
- Respuesta: < 10ms
- Estado: FALLBACK activado
- Usuario recibe respuesta inmediata

**Sin Circuit Breaker:**
- Respuesta: 2000ms (timeout)
- Error 500
- Mala experiencia de usuario

### 3. Logs en las Terminales

Observa los logs en cada terminal:
- `[GATEWAY]` - Decisiones del Circuit Breaker
- `[PEDIDOS]` - Lógica de negocio
- `[PAGOS]` - Fallos simulados

---

## 🐛 Solución de Problemas

### Error: "Puerto ya en uso"

Si ves `EADDRINUSE`, significa que el puerto ya está ocupado:

```bash
# En Windows PowerShell:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# En Linux/Mac:
lsof -i :3000
kill -9 <PID>
```

### Error: "Cannot find module"

Asegúrate de instalar las dependencias:

```bash
npm install
```

### Los servicios no se comunican

Verifica que estén en los puertos correctos:
- API Gateway: `http://localhost:3000`
- Servicio Pedidos: `http://localhost:3001`
- Servicio Pagos: `http://localhost:3002`

---

## 📚 Siguientes Pasos

1. ✅ Lee el [README.md](./README.md) completo para entender la arquitectura
2. ✅ Revisa [ARQUITECTURA.md](./ARQUITECTURA.md) para diagramas detallados
3. ✅ Ejecuta las pruebas en [PRUEBAS.md](./PRUEBAS.md)
4. ✅ Modifica el código para experimentar
5. ✅ Cambia los parámetros del Circuit Breaker y observa el comportamiento

---

## 🎓 Conceptos Aprendidos

Al completar este proyecto habrás aprendido:

- ⚡ **Circuit Breaker**: Protección contra fallos en cascada
- ⏱️ **Timeout**: Límites de tiempo para operaciones
- 🔄 **Retry**: Reintentos automáticos con backoff exponencial
- 💡 **Fallback**: Respuestas alternativas
- 🏗️ **Arquitectura de Microservicios**: Comunicación entre servicios
- 📊 **Observabilidad**: Monitoreo y métricas

---

## 📞 ¿Necesitas Ayuda?

1. Revisa los archivos de documentación
2. Observa los logs en las terminales
3. Usa los endpoints de health check
4. Consulta el estado del Circuit Breaker

---

¡Feliz aprendizaje! 🚀
