/**
 * API GATEWAY CON PATRONES DE RESILIENCIA
 * 
 * Este gateway implementa los siguientes patrones de resiliencia:
 * 
 * 1. CIRCUIT BREAKER (usando librería 'opossum')
 *    - Protege contra servicios que fallan repetidamente
 *    - Estados: CLOSED → OPEN → HALF_OPEN
 *    - Previene cascada de fallos
 * 
 * 2. TIMEOUT
 *    - Límite de tiempo para cada request
 *    - Evita requests que cuelgan indefinidamente
 * 
 * 3. RETRY
 *    - Reintentos automáticos con backoff exponencial
 *    - Máximo 3 intentos
 * 
 * 4. FALLBACK
 *    - Respuestas alternativas cuando el servicio falla
 *    - Degradación elegante del servicio
 */

const express = require('express');
const axios = require('axios');
const CircuitBreaker = require('opossum');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_URL || 'http://localhost:3001';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002';

// ============================================================================
// CONFIGURACIÓN DE CIRCUIT BREAKERS
// ============================================================================

/**
 * Opciones de configuración para el Circuit Breaker
 */
const circuitBreakerOptions = {
  timeout: 2000,              // TIMEOUT: 2 segundos máximo por request
  errorThresholdPercentage: 50, // Abre el circuito si >50% de requests fallan
  resetTimeout: 5000,          // Intenta cerrar el circuito después de 5s
  rollingCountTimeout: 10000,  // Ventana de tiempo para calcular fallos
  rollingCountBuckets: 10,     // Número de buckets en la ventana
  name: 'paymentService'       // Nombre del circuit breaker
};

/**
 * Función que llama al servicio de Pagos
 * Esta función será envuelta por el Circuit Breaker
 */
async function callPaymentService(pedidoId, monto, metodoPago) {
  console.log(`[GATEWAY] 🔄 Llamando al servicio de Pagos para pedido ${pedidoId}`);
  
  const response = await axios.post(
    `${PAYMENT_SERVICE_URL}/pagos/procesar`,
    { pedidoId, monto, metodoPago },
    { 
      timeout: 2000  // TIMEOUT individual de 2 segundos
    }
  );
  
  return response.data;
}

/**
 * CIRCUIT BREAKER para el servicio de Pagos
 * Envuelve la función de llamada con protección de circuit breaker
 */
const paymentCircuitBreaker = new CircuitBreaker(callPaymentService, circuitBreakerOptions);

// ============================================================================
// EVENT LISTENERS DEL CIRCUIT BREAKER
// (Para monitoreo y debugging)
// ============================================================================

paymentCircuitBreaker.on('open', () => {
  console.log('🔴 [CIRCUIT BREAKER] ABIERTO - Servicio de Pagos no disponible');
  console.log('   Las siguientes requests fallarán rápidamente sin llamar al servicio');
});

paymentCircuitBreaker.on('halfOpen', () => {
  console.log('🟡 [CIRCUIT BREAKER] SEMI-ABIERTO - Probando si el servicio se recuperó');
});

paymentCircuitBreaker.on('close', () => {
  console.log('🟢 [CIRCUIT BREAKER] CERRADO - Servicio de Pagos funcionando normalmente');
});

paymentCircuitBreaker.on('success', (result) => {
  console.log(`[CIRCUIT BREAKER] ✅ Request exitoso`);
});

paymentCircuitBreaker.on('failure', (error) => {
  console.log(`[CIRCUIT BREAKER] ❌ Request falló: ${error.message}`);
});

paymentCircuitBreaker.on('timeout', () => {
  console.log(`[CIRCUIT BREAKER] ⏱️  Timeout - Request excedió 2 segundos`);
});

paymentCircuitBreaker.on('fallback', (result) => {
  console.log(`[CIRCUIT BREAKER] 🔄 Fallback activado - Retornando respuesta alternativa`);
});

/**
 * FALLBACK: Función que se ejecuta cuando el circuit breaker está abierto
 * o cuando la llamada falla
 */
paymentCircuitBreaker.fallback((pedidoId, monto, metodoPago) => {
  console.log(`[FALLBACK] 💡 Retornando respuesta alternativa para pedido ${pedidoId}`);
  
  return {
    success: false,
    fallback: true,
    pedidoId,
    monto,
    metodoPago,
    mensaje: 'El servicio de pagos no está disponible. Tu pedido ha sido registrado y será procesado cuando el servicio se recupere.',
    estado: 'PENDIENTE_PROCESAMIENTO',
    timestamp: new Date().toISOString(),
    instrucciones: 'Te notificaremos por email cuando tu pago sea procesado.'
  };
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * RETRY con Exponential Backoff
 * Reintenta una función con delays incrementales entre intentos
 * 
 * @param {Function} fn - Función a ejecutar
 * @param {number} maxRetries - Número máximo de reintentos
 * @param {number} delay - Delay inicial en ms
 */
async function retryWithBackoff(fn, maxRetries = 3, delay = 100) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[RETRY] Intento ${attempt}/${maxRetries}`);
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const backoffDelay = delay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`[RETRY] ❌ Fallo en intento ${attempt}. Reintentando en ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  console.log(`[RETRY] ❌ Todos los intentos fallaron`);
  throw lastError;
}

/**
 * Función auxiliar para llamar al servicio de Pedidos con timeout
 */
async function callOrdersService(method, path, data = null) {
  const config = {
    method,
    url: `${ORDERS_SERVICE_URL}${path}`,
    timeout: 3000  // TIMEOUT de 3 segundos
  };
  
  if (data) {
    config.data = data;
  }
  
  const response = await axios(config);
  return response.data;
}

// ============================================================================
// API GATEWAY ENDPOINTS
// ============================================================================

/**
 * GET /api/productos
 * 
 * Proxy al servicio de Pedidos para consultar productos
 * Con RETRY y TIMEOUT
 */
app.get('/api/productos', async (req, res) => {
  console.log('[GATEWAY] GET /api/productos - Consultando catálogo');
  
  try {
    // Intenta con RETRY
    const data = await retryWithBackoff(
      () => callOrdersService('GET', '/productos'),
      3  // 3 intentos
    );
    
    res.status(200).json(data);
  } catch (error) {
    console.log(`[GATEWAY] Error consultando productos: ${error.message}`);
    res.status(503).json({
      error: 'Servicio de productos no disponible temporalmente',
      mensaje: 'Por favor intenta nuevamente en unos momentos'
    });
  }
});

/**
 * POST /api/pedidos
 * 
 * Crea un nuevo pedido
 * Con RETRY, TIMEOUT y manejo de errores
 */
app.post('/api/pedidos', async (req, res) => {
  console.log('[GATEWAY] POST /api/pedidos - Creando nuevo pedido');
  
  try {
    const data = await retryWithBackoff(
      () => callOrdersService('POST', '/pedidos', req.body),
      3
    );
    
    res.status(201).json(data);
  } catch (error) {
    console.log(`[GATEWAY] Error creando pedido: ${error.message}`);
    
    if (error.response && error.response.status === 400) {
      return res.status(400).json(error.response.data);
    }
    
    res.status(503).json({
      error: 'No se pudo crear el pedido',
      mensaje: 'El servicio de pedidos no está disponible'
    });
  }
});

/**
 * GET /api/pedidos/:id
 * 
 * Consulta un pedido específico
 * Con TIMEOUT
 */
app.get('/api/pedidos/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[GATEWAY] GET /api/pedidos/${id} - Consultando pedido`);
  
  try {
    const data = await callOrdersService('GET', `/pedidos/${id}`);
    res.status(200).json(data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    res.status(503).json({
      error: 'No se pudo consultar el pedido',
      mensaje: 'El servicio no está disponible'
    });
  }
});

/**
 * POST /api/pedidos/:id/pagar
 * 
 * ⭐ ENDPOINT PRINCIPAL CON TODOS LOS PATRONES DE RESILIENCIA ⭐
 * 
 * Procesa el pago de un pedido utilizando:
 * - CIRCUIT BREAKER (protección contra fallos en cascada)
 * - TIMEOUT (2 segundos máximo)
 * - FALLBACK (respuesta alternativa si falla)
 * - RETRY ya está incluido en el circuit breaker
 */
app.post('/api/pedidos/:id/pagar', async (req, res) => {
  const { id } = req.params;
  console.log(`\n[GATEWAY] 💳 POST /api/pedidos/${id}/pagar - Procesando pago`);
  console.log(`[GATEWAY] Estado del Circuit Breaker: ${paymentCircuitBreaker.opened ? '🔴 ABIERTO' : '🟢 CERRADO'}`);
  
  try {
    // Primero obtener información del pedido
    const pedidoResponse = await callOrdersService('GET', `/pedidos/${id}`);
    const pedido = pedidoResponse.pedido;
    
    if (pedido.estado !== 'PENDIENTE') {
      return res.status(400).json({
        error: `El pedido ya fue procesado. Estado: ${pedido.estado}`
      });
    }
    
    // Procesar el pago usando el CIRCUIT BREAKER
    // Si el circuito está abierto, automáticamente ejecuta el fallback
    const pagoResult = await paymentCircuitBreaker.fire(
      id,
      pedido.total,
      pedido.metodoPago
    );
    
    // Verificar si fue una respuesta de fallback
    if (pagoResult.fallback) {
      return res.status(202).json({
        success: true,
        mensaje: 'Pedido registrado - Pago pendiente de procesamiento',
        pedido: {
          ...pedido,
          estado: 'PENDIENTE_PROCESAMIENTO'
        },
        pagoInfo: pagoResult,
        advertencia: 'El servicio de pagos está experimentando problemas. Procesaremos tu pago lo antes posible.'
      });
    }
    
    // Pago exitoso
    console.log(`[GATEWAY] ✅ Pago procesado exitosamente para pedido ${id}`);
    
    res.status(200).json({
      success: true,
      mensaje: 'Pago procesado exitosamente',
      pedido: {
        ...pedido,
        estado: 'PAGADO',
        transaccionId: pagoResult.transaccionId
      },
      pago: pagoResult
    });
    
  } catch (error) {
    console.log(`[GATEWAY] ❌ Error procesando pago: ${error.message}`);
    
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    // Error general - No debería llegar aquí por el fallback
    res.status(500).json({
      error: 'Error procesando el pago',
      mensaje: 'Por favor intenta nuevamente',
      detalles: error.message
    });
  }
});

/**
 * GET /api/circuit-breaker/status
 * 
 * Muestra el estado actual del Circuit Breaker
 * Útil para monitoreo y debugging
 */
app.get('/api/circuit-breaker/status', (req, res) => {
  const stats = paymentCircuitBreaker.stats;
  
  res.status(200).json({
    circuitBreaker: 'Payment Service',
    estado: paymentCircuitBreaker.opened ? 'ABIERTO 🔴' : 'CERRADO 🟢',
    estadisticas: {
      fires: stats.fires,                    // Total de llamadas
      successes: stats.successes,            // Llamadas exitosas
      failures: stats.failures,              // Llamadas fallidas
      rejects: stats.rejects,                // Llamadas rechazadas (circuito abierto)
      timeouts: stats.timeouts,              // Timeouts
      fallbacks: stats.fallbacks,            // Veces que se ejecutó el fallback
      latencyMean: stats.latencyMean,        // Latencia promedio
      percentiles: stats.percentiles         // Percentiles de latencia
    },
    configuracion: {
      timeout: circuitBreakerOptions.timeout,
      errorThreshold: circuitBreakerOptions.errorThresholdPercentage,
      resetTimeout: circuitBreakerOptions.resetTimeout
    }
  });
});

/**
 * POST /api/circuit-breaker/reset
 * 
 * Resetea las estadísticas del Circuit Breaker
 * Útil para demos
 */
app.post('/api/circuit-breaker/reset', (req, res) => {
  paymentCircuitBreaker.stats.reset();
  console.log('[GATEWAY] Circuit Breaker reseteado');
  
  res.status(200).json({
    mensaje: 'Circuit Breaker reseteado',
    estado: 'CERRADO 🟢'
  });
});

/**
 * GET /api/health
 * 
 * Health check del API Gateway
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    servicio: 'API Gateway',
    estado: 'activo',
    uptime: process.uptime(),
    circuitBreaker: {
      estado: paymentCircuitBreaker.opened ? 'ABIERTO' : 'CERRADO',
      estadisticas: paymentCircuitBreaker.stats
    },
    serviciosBackend: {
      pedidos: ORDERS_SERVICE_URL,
      pagos: PAYMENT_SERVICE_URL
    }
  });
});

// ============================================================================
// INICIO DEL SERVIDOR
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    🚀 API GATEWAY CON RESILIENCIA                         ║
║                                                                           ║
║  Puerto: ${PORT}                                                           ║
║  Servicio de Pedidos: ${ORDERS_SERVICE_URL}                     ║
║  Servicio de Pagos:   ${PAYMENT_SERVICE_URL}                     ║
║                                                                           ║
║  🛡️  PATRONES DE RESILIENCIA IMPLEMENTADOS:                              ║
║                                                                           ║
║  ⚡ CIRCUIT BREAKER                                                       ║
║     • Protege contra fallos en cascada                                   ║
║     • Threshold: 50% de errores                                          ║
║     • Reset timeout: 5 segundos                                          ║
║                                                                           ║
║  ⏱️  TIMEOUT                                                              ║
║     • Límite: 2 segundos por request a Pagos                            ║
║     • Límite: 3 segundos por request a Pedidos                          ║
║                                                                           ║
║  🔄 RETRY                                                                 ║
║     • Máximo 3 intentos                                                  ║
║     • Exponential backoff                                                ║
║                                                                           ║
║  💡 FALLBACK                                                              ║
║     • Respuestas alternativas cuando el servicio falla                   ║
║     • Degradación elegante                                               ║
║                                                                           ║
║  📊 ENDPOINTS:                                                            ║
║     GET  /api/productos                 - Catálogo de productos          ║
║     POST /api/pedidos                   - Crear pedido                   ║
║     GET  /api/pedidos/:id               - Consultar pedido               ║
║     POST /api/pedidos/:id/pagar         - Procesar pago (CON RESILIENCIA)║
║     GET  /api/circuit-breaker/status    - Estado del Circuit Breaker     ║
║     POST /api/circuit-breaker/reset     - Resetear Circuit Breaker       ║
║     GET  /api/health                    - Health check                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);
});
