/**
 * SCRIPT DE PRUEBA DE RESILIENCIA
 * 
 * Este script demuestra los patrones de resiliencia ejecutando
 * múltiples requests al API Gateway y observando el comportamiento
 * del Circuit Breaker.
 */

const axios = require('axios');

const API_GATEWAY_URL = 'http://localhost:3000';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(COLORS[color] + message + COLORS.reset);
}

function separator() {
  console.log('\n' + '═'.repeat(80) + '\n');
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica que los servicios estén corriendo
 */
async function checkHealth() {
  log('🏥 Verificando estado de los servicios...', 'cyan');
  
  try {
    const response = await axios.get(`${API_GATEWAY_URL}/api/health`);
    log('✅ Servicios activos', 'green');
    return true;
  } catch (error) {
    log('❌ Los servicios no están disponibles. Asegúrate de iniciarlos primero.', 'red');
    log('   Ejecuta: npm run start', 'yellow');
    return false;
  }
}

/**
 * Consulta el estado del Circuit Breaker
 */
async function getCircuitBreakerStatus() {
  try {
    const response = await axios.get(`${API_GATEWAY_URL}/api/circuit-breaker/status`);
    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Crea un pedido de prueba
 */
async function crearPedido() {
  log('\n📦 Paso 1: Creando un pedido de prueba...', 'cyan');
  
  try {
    const response = await axios.post(`${API_GATEWAY_URL}/api/pedidos`, {
      items: [
        { productoId: 1, cantidad: 1 },
        { productoId: 2, cantidad: 2 }
      ],
      cliente: {
        nombre: 'Test User',
        email: 'test@example.com'
      },
      metodoPago: 'tarjeta_credito'
    });
    
    const pedidoId = response.data.pedido.id;
    const total = response.data.pedido.total;
    
    log(`✅ Pedido creado: ${pedidoId} - Total: $${total}`, 'green');
    return pedidoId;
  } catch (error) {
    log(`❌ Error creando pedido: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Intenta procesar un pago
 */
async function procesarPago(pedidoId, intentoNum) {
  try {
    const startTime = Date.now();
    const response = await axios.post(`${API_GATEWAY_URL}/api/pedidos/${pedidoId}/pagar`);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.data.pagoInfo && response.data.pagoInfo.fallback) {
      log(`  ${intentoNum}. 💡 FALLBACK activado - Tiempo: ${duration}ms`, 'yellow');
      log(`     Mensaje: "${response.data.pagoInfo.mensaje}"`, 'yellow');
      return 'fallback';
    } else {
      log(`  ${intentoNum}. ✅ Pago exitoso - Tiempo: ${duration}ms`, 'green');
      return 'success';
    }
  } catch (error) {
    if (error.response) {
      log(`  ${intentoNum}. ❌ Pago fallido (${error.response.status}) - ${error.message}`, 'red');
      return 'error';
    } else {
      log(`  ${intentoNum}. ❌ Error de conexión: ${error.message}`, 'red');
      return 'error';
    }
  }
}

/**
 * Test principal: Ejecutar múltiples pagos para activar el Circuit Breaker
 */
async function testResiliencia() {
  separator();
  log('🚀 INICIANDO PRUEBA DE PATRONES DE RESILIENCIA', 'magenta');
  separator();
  
  // Verificar salud de servicios
  const isHealthy = await checkHealth();
  if (!isHealthy) {
    return;
  }
  
  separator();
  
  // Crear un pedido
  const pedidoId = await crearPedido();
  if (!pedidoId) {
    return;
  }
  
  separator();
  log('💳 Paso 2: Procesando múltiples pagos para demostrar resiliencia...', 'cyan');
  log('   (El servicio de Pagos tiene 30% de probabilidad de fallo)\n', 'yellow');
  
  const resultados = {
    success: 0,
    fallback: 0,
    error: 0
  };
  
  // Ejecutar 15 intentos de pago
  for (let i = 1; i <= 15; i++) {
    const resultado = await procesarPago(pedidoId, i);
    resultados[resultado]++;
    
    // Consultar estado del Circuit Breaker cada 3 intentos
    if (i % 3 === 0) {
      const cbStatus = await getCircuitBreakerStatus();
      if (cbStatus) {
        log(`\n  📊 Estado Circuit Breaker: ${cbStatus.estado}`, 'blue');
        log(`     Estadísticas: ${cbStatus.estadisticas.successes} éxitos, ${cbStatus.estadisticas.failures} fallos, ${cbStatus.estadisticas.fallbacks} fallbacks\n`, 'blue');
      }
      
      // Pequeña pausa para observar
      await delay(500);
    }
    
    await delay(200); // Pausa entre requests
  }
  
  separator();
  log('📈 RESULTADOS DE LA PRUEBA', 'magenta');
  separator();
  
  log(`✅ Pagos exitosos:      ${resultados.success}`, 'green');
  log(`💡 Fallbacks activados: ${resultados.fallback}`, 'yellow');
  log(`❌ Errores:             ${resultados.error}`, 'red');
  
  separator();
  
  // Estado final del Circuit Breaker
  const finalStatus = await getCircuitBreakerStatus();
  if (finalStatus) {
    log('🔍 ESTADO FINAL DEL CIRCUIT BREAKER', 'magenta');
    separator();
    log(`Estado: ${finalStatus.estado}`, 'cyan');
    log(`\nEstadísticas:`, 'cyan');
    log(`  • Total de llamadas:    ${finalStatus.estadisticas.fires}`);
    log(`  • Exitosas:             ${finalStatus.estadisticas.successes}`);
    log(`  • Fallidas:             ${finalStatus.estadisticas.failures}`);
    log(`  • Rechazadas (abierto): ${finalStatus.estadisticas.rejects}`);
    log(`  • Timeouts:             ${finalStatus.estadisticas.timeouts}`);
    log(`  • Fallbacks:            ${finalStatus.estadisticas.fallbacks}`);
    log(`  • Latencia promedio:    ${Math.round(finalStatus.estadisticas.latencyMean)}ms`);
  }
  
  separator();
  log('✨ CONCLUSIÓN', 'magenta');
  separator();
  
  log('Observaciones clave:', 'cyan');
  log('1. ⚡ Circuit Breaker: Protegió el sistema abriendo el circuito después de múltiples fallos');
  log('2. 💡 Fallback: Proporcionó respuestas alternativas inmediatas (<10ms)');
  log('3. ⏱️  Timeout: Evitó esperas largas (máximo 2 segundos)');
  log('4. ✅ Disponibilidad: El sistema siguió funcionando aunque el servicio de Pagos fallara');
  
  separator();
}

/**
 * Test de Retry
 */
async function testRetry() {
  separator();
  log('🔄 TEST DE RETRY CON EXPONENTIAL BACKOFF', 'magenta');
  separator();
  
  log('Consultando productos (con retry automático)...', 'cyan');
  
  try {
    const response = await axios.get(`${API_GATEWAY_URL}/api/productos`);
    log('✅ Productos obtenidos exitosamente', 'green');
    log(`   Total de productos: ${response.data.productos.length}`);
  } catch (error) {
    log('❌ Error consultando productos', 'red');
  }
  
  separator();
}

/**
 * Ejecutar todas las pruebas
 */
async function runAllTests() {
  console.clear();
  
  await testResiliencia();
  await delay(1000);
  await testRetry();
  
  log('\n🎉 Pruebas completadas', 'green');
  log('\nPara más información, visita:', 'cyan');
  log(`  • Estado del Circuit Breaker: ${API_GATEWAY_URL}/api/circuit-breaker/status`, 'blue');
  log(`  • Estadísticas de Pagos: http://localhost:3002/pagos/stats`, 'blue');
  log(`  • Health check: ${API_GATEWAY_URL}/api/health\n`, 'blue');
}

// Ejecutar tests
runAllTests().catch(error => {
  log(`\n❌ Error ejecutando tests: ${error.message}`, 'red');
  process.exit(1);
});
