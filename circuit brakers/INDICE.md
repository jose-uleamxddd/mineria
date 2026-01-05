# 📚 ÍNDICE DE DOCUMENTACIÓN

Bienvenido al proyecto de **Patrones de Resiliencia en Microservicios**. Esta es tu guía para navegar toda la documentación disponible.

---

## 🚀 ¿Por Dónde Empezar?

### Para Ejecutar Rápidamente
👉 **[INICIO-RAPIDO.md](./INICIO-RAPIDO.md)** - Ejecuta el proyecto en 5 minutos

### Para Entender el Proyecto
👉 **[README.md](./README.md)** - Documentación completa y conceptos principales

### Para Ver Resumen Ejecutivo
👉 **[RESUMEN-EJECUTIVO.md](./RESUMEN-EJECUTIVO.md)** - Vista general del proyecto

---

## 📖 Documentación Completa

### 1. 📘 [README.md](./README.md)
**Documentación Principal - LÉELO PRIMERO**

Contenido:
- ✅ Descripción completa de la arquitectura
- ✅ Explicación detallada de cada patrón de resiliencia
- ✅ Diagramas de arquitectura en ASCII
- ✅ Flujos de ejecución paso a paso
- ✅ Instrucciones de instalación y ejecución
- ✅ Guía de pruebas del sistema
- ✅ Conceptos clave y conclusiones

**Cuándo leerlo**: Primero, para entender todo el proyecto

---

### 2. 🏗️ [ARQUITECTURA.md](./ARQUITECTURA.md)
**Diagramas y Flujos Detallados**

Contenido:
- ✅ Diagrama C4 nivel contenedores
- ✅ Flujo de datos completo
- ✅ Escenarios de ejecución detallados
- ✅ Componentes y responsabilidades
- ✅ Métricas y observabilidad
- ✅ Comparación visual CON vs SIN resiliencia

**Cuándo leerlo**: Para profundizar en la arquitectura

---

### 3. 🎨 [DIAGRAMAS.md](./DIAGRAMAS.md)
**Representaciones Visuales del Sistema**

Contenido:
- ✅ Arquitectura general
- ✅ Máquina de estados del Circuit Breaker
- ✅ Flujos de requests exitosos y fallidos
- ✅ Comparaciones visuales
- ✅ Línea de tiempo de recuperación
- ✅ Distribución de fallos y latencias
- ✅ Dashboard de métricas

**Cuándo leerlo**: Para ver representaciones visuales del sistema

---

### 4. 🧪 [PRUEBAS.md](./PRUEBAS.md)
**Ejemplos de Comandos y Escenarios de Prueba**

Contenido:
- ✅ Comandos curl completos
- ✅ Health checks
- ✅ Crear productos y pedidos
- ✅ Procesar pagos
- ✅ Monitorear Circuit Breaker
- ✅ Escenarios de prueba detallados
- ✅ Scripts de automatización

**Cuándo leerlo**: Cuando quieras probar el sistema manualmente

---

### 5. ⚡ [INICIO-RAPIDO.md](./INICIO-RAPIDO.md)
**Guía de Inicio en 5 Minutos**

Contenido:
- ✅ 3 formas de ejecutar el proyecto
- ✅ Verificación de servicios
- ✅ Pruebas rápidas
- ✅ Endpoints principales
- ✅ Solución de problemas
- ✅ Siguientes pasos

**Cuándo leerlo**: Primero, si quieres ejecutar rápido

---

### 6. 📊 [RESUMEN-EJECUTIVO.md](./RESUMEN-EJECUTIVO.md)
**Vista General del Proyecto**

Contenido:
- ✅ Objetivo cumplido
- ✅ Arquitectura resumida
- ✅ Patrones implementados
- ✅ Comparación CON vs SIN resiliencia
- ✅ Estructura del proyecto
- ✅ Formas de ejecución
- ✅ Métricas y observabilidad
- ✅ Requisitos cumplidos

**Cuándo leerlo**: Para obtener una vista general completa

---

## 📁 Código Fuente

### API Gateway
📂 **[api-gateway/](./api-gateway/)**
- ✅ [index.js](./api-gateway/index.js) - Implementación completa con Circuit Breaker, Timeout, Retry, Fallback
- ✅ [package.json](./api-gateway/package.json) - Dependencias (express, axios, opossum)
- ✅ [Dockerfile](./api-gateway/Dockerfile) - Containerización

### Servicio de Pedidos
📂 **[servicio-pedidos/](./servicio-pedidos/)**
- ✅ [index.js](./servicio-pedidos/index.js) - Lógica de negocio de pedidos
- ✅ [package.json](./servicio-pedidos/package.json) - Dependencias
- ✅ [Dockerfile](./servicio-pedidos/Dockerfile) - Containerización

### Servicio de Pagos (Inestable)
📂 **[servicio-pagos/](./servicio-pagos/)**
- ✅ [index.js](./servicio-pagos/index.js) - Simulación de fallos y latencia
- ✅ [package.json](./servicio-pagos/package.json) - Dependencias
- ✅ [Dockerfile](./servicio-pagos/Dockerfile) - Containerización

### Scripts de Prueba
📂 **[test-scripts/](./test-scripts/)**
- ✅ [test-resilience.js](./test-scripts/test-resilience.js) - Pruebas automatizadas
- ✅ [package.json](./test-scripts/package.json) - Dependencias

---

## 🛠️ Archivos de Configuración

### Docker
- 📄 **[docker-compose.yml](./docker-compose.yml)** - Orquestación de servicios

### NPM
- 📄 **[package.json](./package.json)** - Scripts globales
  - `npm run install-all` - Instala todas las dependencias
  - `npm start` - Inicia todos los servicios
  - `npm run dev` - Modo desarrollo

### Git
- 📄 **[.gitignore](./.gitignore)** - Archivos excluidos del repositorio

---

## 📋 Rutas de Aprendizaje Sugeridas

### 🎓 Ruta 1: Aprendizaje Completo (Recomendado)

```
1. INICIO-RAPIDO.md    → Ejecuta el proyecto
   ↓
2. README.md           → Entiende los conceptos
   ↓
3. ARQUITECTURA.md     → Profundiza en diseño
   ↓
4. DIAGRAMAS.md        → Visualiza el sistema
   ↓
5. PRUEBAS.md          → Experimenta
   ↓
6. Código fuente       → Revisa la implementación
```

---

### ⚡ Ruta 2: Inicio Rápido

```
1. INICIO-RAPIDO.md    → Ejecuta
   ↓
2. RESUMEN-EJECUTIVO   → Vista general
   ↓
3. PRUEBAS.md          → Prueba manualmente
```

---

### 🏗️ Ruta 3: Enfoque Arquitectura

```
1. RESUMEN-EJECUTIVO   → Contexto
   ↓
2. ARQUITECTURA.md     → Diseño detallado
   ↓
3. DIAGRAMAS.md        → Visualización
   ↓
4. README.md           → Conceptos
```

---

### 💻 Ruta 4: Enfoque Código

```
1. INICIO-RAPIDO.md         → Ejecuta
   ↓
2. api-gateway/index.js     → Circuit Breaker
   ↓
3. servicio-pagos/index.js  → Simulación fallos
   ↓
4. PRUEBAS.md               → Experimenta
```

---

## 🎯 Guías por Objetivo

### ¿Quieres EJECUTAR el proyecto?
👉 [INICIO-RAPIDO.md](./INICIO-RAPIDO.md)

### ¿Quieres ENTENDER los patrones?
👉 [README.md](./README.md) - Sección "Patrones de Resiliencia"

### ¿Quieres VER la arquitectura?
👉 [ARQUITECTURA.md](./ARQUITECTURA.md) y [DIAGRAMAS.md](./DIAGRAMAS.md)

### ¿Quieres PROBAR el sistema?
👉 [PRUEBAS.md](./PRUEBAS.md)

### ¿Quieres MODIFICAR el código?
👉 Revisa los archivos `index.js` en cada carpeta de servicio

### ¿Quieres un RESUMEN ejecutivo?
👉 [RESUMEN-EJECUTIVO.md](./RESUMEN-EJECUTIVO.md)

---

## 📚 Conceptos por Documento

### Circuit Breaker ⚡
- [README.md](./README.md) - Explicación detallada
- [ARQUITECTURA.md](./ARQUITECTURA.md) - Flujos
- [DIAGRAMAS.md](./DIAGRAMAS.md) - Máquina de estados
- [api-gateway/index.js](./api-gateway/index.js) - Implementación

### Timeout ⏱️
- [README.md](./README.md) - Concepto
- [api-gateway/index.js](./api-gateway/index.js) - Configuración

### Retry 🔄
- [README.md](./README.md) - Exponential backoff
- [api-gateway/index.js](./api-gateway/index.js) - Función `retryWithBackoff`

### Fallback 💡
- [README.md](./README.md) - Degradación elegante
- [ARQUITECTURA.md](./ARQUITECTURA.md) - Flujos con fallback
- [api-gateway/index.js](./api-gateway/index.js) - Implementación

---

## 🔍 Búsqueda Rápida

### Quiero ver...

| Tema | Documento | Línea/Sección |
|------|-----------|---------------|
| Configuración Circuit Breaker | api-gateway/index.js | Líneas 30-40 |
| Simulación de fallos | servicio-pagos/index.js | Función `shouldFail()` |
| Retry con backoff | api-gateway/index.js | Función `retryWithBackoff()` |
| Endpoint de pago CON resiliencia | api-gateway/index.js | POST `/api/pedidos/:id/pagar` |
| Endpoint de pago SIN resiliencia | servicio-pedidos/index.js | POST `/pedidos/:id/procesar-pago` |
| Estadísticas CB | api-gateway/index.js | GET `/api/circuit-breaker/status` |
| Diagrama arquitectura | ARQUITECTURA.md | Sección 1 |
| Flujo con fallos | DIAGRAMAS.md | Diagrama 4 |
| Comandos curl | PRUEBAS.md | Todo el archivo |

---

## 📞 ¿Tienes Dudas?

### Preguntas Frecuentes

**P: ¿Cómo inicio el proyecto?**  
R: Lee [INICIO-RAPIDO.md](./INICIO-RAPIDO.md)

**P: ¿Qué es un Circuit Breaker?**  
R: Lee [README.md](./README.md) - Sección "Circuit Breaker"

**P: ¿Cómo pruebo los patrones?**  
R: Lee [PRUEBAS.md](./PRUEBAS.md) - Escenarios de prueba

**P: ¿Dónde está el código del Circuit Breaker?**  
R: [api-gateway/index.js](./api-gateway/index.js)

**P: ¿Cómo funciona el servicio inestable?**  
R: [servicio-pagos/index.js](./servicio-pagos/index.js)

**P: ¿Puedo usar Docker?**  
R: Sí, ejecuta `docker-compose up`

---

## ✅ Checklist de Aprendizaje

Marca lo que has completado:

- [ ] Leí [INICIO-RAPIDO.md](./INICIO-RAPIDO.md)
- [ ] Ejecuté los 3 servicios
- [ ] Verifiqué health checks
- [ ] Leí [README.md](./README.md) completo
- [ ] Entiendo qué es Circuit Breaker
- [ ] Entiendo Timeout, Retry y Fallback
- [ ] Revisé [ARQUITECTURA.md](./ARQUITECTURA.md)
- [ ] Vi los diagramas en [DIAGRAMAS.md](./DIAGRAMAS.md)
- [ ] Ejecuté el script de prueba automatizado
- [ ] Probé comandos curl de [PRUEBAS.md](./PRUEBAS.md)
- [ ] Vi el Circuit Breaker abrirse y cerrarse
- [ ] Revisé el código de [api-gateway/index.js](./api-gateway/index.js)
- [ ] Revisé el código de [servicio-pagos/index.js](./servicio-pagos/index.js)
- [ ] Entiendo la diferencia CON vs SIN resiliencia
- [ ] Puedo explicar los 4 patrones implementados

---

## 🎉 Proyecto Completo

Este índice te guía a través de:
- ✅ 6 documentos de referencia
- ✅ 3 microservicios implementados
- ✅ 1 script de pruebas automatizadas
- ✅ Configuración Docker
- ✅ Más de 2000 líneas de código comentado

**Todo listo para aprender patrones de resiliencia en microservicios! 🚀**

---

**Última actualización**: 17 de Diciembre, 2025  
**Versión del proyecto**: 1.0.0
