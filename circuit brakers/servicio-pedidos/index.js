/**
 * SERVICIO DE PEDIDOS
 * 
 * Este servicio maneja la lógica de negocio de pedidos:
 * - Crear nuevos pedidos
 * - Consultar estado de pedidos
 * - Se comunica con el servicio de Pagos
 * 
 * NOTA: Este servicio NO tiene patrones de resiliencia.
 * La resiliencia está implementada en el API Gateway.
 */

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002';

// Base de datos en memoria (para demo)
const pedidos = new Map();
let pedidoCounter = 1;

// Catálogo de productos
const productos = [
  { id: 1, nombre: 'Laptop Dell XPS', precio: 1299.99, stock: 10 },
  { id: 2, nombre: 'Mouse Logitech MX', precio: 99.99, stock: 50 },
  { id: 3, nombre: 'Teclado Mecánico', precio: 149.99, stock: 30 },
  { id: 4, nombre: 'Monitor 4K', precio: 499.99, stock: 15 },
  { id: 5, nombre: 'Webcam HD', precio: 79.99, stock: 25 }
];

/**
 * GET /productos
 * 
 * Retorna el catálogo de productos disponibles
 */
app.get('/productos', (req, res) => {
  console.log('[PEDIDOS] Consultando catálogo de productos');
  res.status(200).json({
    productos,
    total: productos.length
  });
});

/**
 * POST /pedidos
 * 
 * Crea un nuevo pedido
 * 
 * Body esperado:
 * {
 *   "items": [{ "productoId": number, "cantidad": number }],
 *   "cliente": { "nombre": string, "email": string },
 *   "metodoPago": string
 * }
 */
app.post('/pedidos', async (req, res) => {
  const { items, cliente, metodoPago } = req.body;

  // Validación básica
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Debe incluir al menos un item' });
  }

  if (!cliente || !cliente.nombre || !cliente.email) {
    return res.status(400).json({ error: 'Datos de cliente incompletos' });
  }

  // Calcular total del pedido
  let total = 0;
  const itemsDetalle = [];

  for (const item of items) {
    const producto = productos.find(p => p.id === item.productoId);
    
    if (!producto) {
      return res.status(404).json({ 
        error: `Producto con ID ${item.productoId} no encontrado` 
      });
    }

    if (producto.stock < item.cantidad) {
      return res.status(400).json({ 
        error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}` 
      });
    }

    const subtotal = producto.precio * item.cantidad;
    total += subtotal;

    itemsDetalle.push({
      productoId: producto.id,
      nombre: producto.nombre,
      cantidad: item.cantidad,
      precioUnitario: producto.precio,
      subtotal
    });
  }

  // Crear el pedido
  const pedidoId = `PED-${pedidoCounter++}`;
  const nuevoPedido = {
    id: pedidoId,
    items: itemsDetalle,
    cliente,
    total,
    metodoPago,
    estado: 'PENDIENTE',
    createdAt: new Date().toISOString()
  };

  pedidos.set(pedidoId, nuevoPedido);

  console.log(`[PEDIDOS] Pedido creado: ${pedidoId} - Total: $${total}`);

  res.status(201).json({
    success: true,
    pedido: nuevoPedido,
    mensaje: 'Pedido creado exitosamente'
  });
});

/**
 * POST /pedidos/:id/procesar-pago
 * 
 * Procesa el pago de un pedido existente
 * Este endpoint llama al servicio de Pagos (SIN resiliencia)
 */
app.post('/pedidos/:id/procesar-pago', async (req, res) => {
  const { id } = req.params;
  const pedido = pedidos.get(id);

  if (!pedido) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  if (pedido.estado !== 'PENDIENTE') {
    return res.status(400).json({ 
      error: `El pedido ya fue procesado. Estado actual: ${pedido.estado}` 
    });
  }

  console.log(`[PEDIDOS] Procesando pago para pedido ${id}`);

  try {
    // Llamada directa al servicio de Pagos (sin resiliencia)
    // Esta llamada puede fallar o tardar demasiado
    const pagoResponse = await axios.post(
      `${PAYMENT_SERVICE_URL}/pagos/procesar`,
      {
        pedidoId: id,
        monto: pedido.total,
        metodoPago: pedido.metodoPago
      },
      {
        timeout: 5000 // Timeout de 5 segundos
      }
    );

    // Actualizar estado del pedido
    pedido.estado = 'PAGADO';
    pedido.transaccionId = pagoResponse.data.transaccionId;
    pedido.pagoProcessedAt = new Date().toISOString();

    console.log(`[PEDIDOS] ✅ Pago exitoso para pedido ${id}`);

    res.status(200).json({
      success: true,
      pedido,
      pago: pagoResponse.data
    });

  } catch (error) {
    console.log(`[PEDIDOS] ❌ Error procesando pago para pedido ${id}: ${error.message}`);

    // Actualizar estado a ERROR
    pedido.estado = 'ERROR_PAGO';
    pedido.errorMessage = error.message;

    res.status(500).json({
      success: false,
      error: 'Error al procesar el pago',
      mensaje: 'El servicio de pagos no está disponible',
      pedido
    });
  }
});

/**
 * GET /pedidos/:id
 * 
 * Consulta el estado de un pedido específico
 */
app.get('/pedidos/:id', (req, res) => {
  const { id } = req.params;
  const pedido = pedidos.get(id);

  if (!pedido) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  console.log(`[PEDIDOS] Consultando pedido ${id}`);
  res.status(200).json({ pedido });
});

/**
 * GET /pedidos
 * 
 * Lista todos los pedidos
 */
app.get('/pedidos', (req, res) => {
  const todosPedidos = Array.from(pedidos.values());
  console.log(`[PEDIDOS] Listando todos los pedidos (${todosPedidos.length})`);
  
  res.status(200).json({
    pedidos: todosPedidos,
    total: todosPedidos.length
  });
});

/**
 * GET /health
 * 
 * Health check del servicio
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    servicio: 'Pedidos',
    estado: 'activo',
    uptime: process.uptime(),
    pedidosActivos: pedidos.size
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              📦 SERVICIO DE PEDIDOS                           ║
║                                                               ║
║  Puerto: ${PORT}                                               ║
║  Servicio de Pagos: ${PAYMENT_SERVICE_URL}       ║
║                                                               ║
║  Endpoints:                                                   ║
║    GET  /productos                - Catálogo                 ║
║    POST /pedidos                  - Crear pedido             ║
║    GET  /pedidos                  - Listar pedidos           ║
║    GET  /pedidos/:id              - Consultar pedido         ║
║    POST /pedidos/:id/procesar-pago - Procesar pago           ║
║    GET  /health                   - Health check             ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
