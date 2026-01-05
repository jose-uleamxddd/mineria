/**
 * SERVICIO DE PAGOS (INESTABLE)
 * 
 * Este servicio simula un sistema de pagos externo que:
 * - Falla aleatoriamente (30% de probabilidad de error 500)
 * - Tiene latencia variable (200ms - 3000ms)
 * - Algunos requests timeout
 * 
 * PROPÓSITO EDUCATIVO:
 * Demostrar cómo un servicio inestable puede afectar toda la arquitectura
 * si no se implementan patrones de resiliencia.
 */

const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Estadísticas para monitoreo
let stats = {
  totalRequests: 0,
  successfulPayments: 0,
  failedPayments: 0,
  averageLatency: 0
};

/**
 * Simula latencia variable en la red
 * Rango: 200ms a 3000ms
 */
function simulateLatency() {
  const minLatency = 200;
  const maxLatency = 3000;
  return Math.floor(Math.random() * (maxLatency - minLatency) + minLatency);
}

/**
 * Simula fallos aleatorios del servicio
 * Probabilidad de fallo: 30%
 */
function shouldFail() {
  return Math.random() < 0.3; // 30% de probabilidad de fallo
}

/**
 * POST /pagos/procesar
 * 
 * Procesa un pago con simulación de inestabilidad
 * 
 * Body esperado:
 * {
 *   "pedidoId": "string",
 *   "monto": number,
 *   "metodoPago": "string"
 * }
 */
app.post('/pagos/procesar', async (req, res) => {
  const startTime = Date.now();
  stats.totalRequests++;

  const { pedidoId, monto, metodoPago } = req.body;

  console.log(`[PAGOS] Procesando pago para pedido ${pedidoId} - Monto: $${monto}`);

  // Simular latencia de red/procesamiento
  const latency = simulateLatency();
  await new Promise(resolve => setTimeout(resolve, latency));

  // Simular fallo aleatorio
  if (shouldFail()) {
    stats.failedPayments++;
    const errorLatency = Date.now() - startTime;
    stats.averageLatency = ((stats.averageLatency * (stats.totalRequests - 1)) + errorLatency) / stats.totalRequests;
    
    console.log(`[PAGOS] ❌ Error procesando pago ${pedidoId} - Latencia: ${errorLatency}ms`);
    
    return res.status(500).json({
      error: 'Error interno del servicio de pagos',
      mensaje: 'El procesador de pagos no está disponible temporalmente',
      pedidoId,
      timestamp: new Date().toISOString()
    });
  }

  // Pago exitoso
  stats.successfulPayments++;
  const successLatency = Date.now() - startTime;
  stats.averageLatency = ((stats.averageLatency * (stats.totalRequests - 1)) + successLatency) / stats.totalRequests;

  console.log(`[PAGOS] ✅ Pago exitoso para pedido ${pedidoId} - Latencia: ${successLatency}ms`);

  res.status(200).json({
    success: true,
    transaccionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    pedidoId,
    monto,
    metodoPago,
    estado: 'APROBADO',
    timestamp: new Date().toISOString(),
    latencia: successLatency
  });
});

/**
 * GET /pagos/health
 * 
 * Endpoint de health check
 */
app.get('/pagos/health', (req, res) => {
  res.status(200).json({
    servicio: 'Pagos',
    estado: 'activo',
    uptime: process.uptime(),
    estadisticas: stats
  });
});

/**
 * GET /pagos/stats
 * 
 * Estadísticas del servicio
 */
app.get('/pagos/stats', (req, res) => {
  const tasaExito = stats.totalRequests > 0 
    ? ((stats.successfulPayments / stats.totalRequests) * 100).toFixed(2) 
    : 0;

  res.status(200).json({
    ...stats,
    tasaExito: `${tasaExito}%`,
    tasaFallo: `${(100 - tasaExito).toFixed(2)}%`
  });
});

/**
 * POST /pagos/reset-stats
 * 
 * Resetea las estadísticas (útil para demos)
 */
app.post('/pagos/reset-stats', (req, res) => {
  stats = {
    totalRequests: 0,
    successfulPayments: 0,
    failedPayments: 0,
    averageLatency: 0
  };
  console.log('[PAGOS] Estadísticas reseteadas');
  res.status(200).json({ mensaje: 'Estadísticas reseteadas', stats });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          🏦 SERVICIO DE PAGOS (INESTABLE)                     ║
║                                                               ║
║  Puerto: ${PORT}                                               ║
║  Probabilidad de fallo: 30%                                   ║
║  Latencia: 200ms - 3000ms                                     ║
║                                                               ║
║  Endpoints:                                                   ║
║    POST /pagos/procesar    - Procesar pago                   ║
║    GET  /pagos/health      - Health check                    ║
║    GET  /pagos/stats       - Estadísticas                    ║
║    POST /pagos/reset-stats - Resetear estadísticas           ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
