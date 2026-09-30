# Supermercado Realidad Virtual — POV Anteojos Inteligentes con IA

Experiencia interactiva en Three.js / WebXR que simula la vista en primera persona (POV) a través de anteojos inteligentes futuristas con Inteligencia Artificial en un entorno hiperrealista de supermercado.

## Características Nuevas & Mejoras Realistas

- **Espacio de Supermercado Hiperrealista**:
  - **Suelo**: Porcelanato pulido con reflejos especulares, juntas de fragüe y textura de terrazo.
  - **Techo Industrial**: Vigas de acero, conductos galvanizados de climatización y luminarias LED lineales continuas suspendidas.
  - **Pasillos y Repisas**: Mesas de madera noble con bandejas inclinadas de exhibición, barandillas acrílicas y etiquetas de precio electrónicas digitales e-ink.
  - **Frutas y Verduras Detalladas**:
    - 🍎 *Manzanas Fuji*: Lustrosas, con gradiente de maduración y tallo leñoso natural.
    - 🍏 *Manzanas Granny Smith*: Verdes crujientes con textura cerosa.
    - 🍊 *Naranjas de Valencia*: Piel porosa con hojita verde.
    - 🍌 *Plátanos de Canarias*: Racimos curvados con motas de azúcar natural.
    - 🍅 *Tomates en Racimo*: Rojos brillantes unidos con cáliz en estrella.
    - 🥕 *Zanahorias de Huerta*: Cónicas con follaje verde de huerta.
    - 🥬 *Lechugas Hidropónicas*: Hojas rizadas multicapa con sistema de microneblina.
    - 🥑 *Paltas / Aguacates Hass*: Piel rugosa oscura y punto mantecoso de maduración.
    - 🫑 *Pimientos Tricolor*: Morrones lobulados brillantes (rojo, amarillo, verde).
    - 🍇 *Uvas de Mesa*: Racimos densos con antioxidantes activos.
  - **Personas & Clientes Realistas**:
    - Compradores con ropa casual variada (chaquetas, suéteres, pantalones, calzado y cabello).
    - Clientes examinando frutas con las manos, mirando góndolas y empujando carritos.
    - Cajera con uniforme en el área de cajas.
    - Animaciones sutiles de respiración y giro natural.
  - **Carritos de Compra**: Carritos de supermercado cromados de alambre con ruedas giratorias, manillar rojo ergonómico y bolsas de compras en su interior.
  - **Área de Cajas & Banda Transportadora**: Cajas con banda transportadora de productos, pantalla táctil POS y scanner láser.
  - **Neveras Murales**: Gran refrigerador mural con puertas de vidrio transparente y tiras LED interiores frías (6500K).
  - **Integración de `banda-optimizada.glb`**: Cargado con Three.js `GLTFLoader` en un pedestal tecnológico futurista con anillo holográfico y baliza AR en el kiosko de entrada.

- **HUD de Anteojos Inteligentes (VisionOS / AR)**:
  - Marco óptico con borde de visor inteligente y cuadrícula AR en esquinas.
  - Barra superior de estado en vivo: batería (98%), conectividad 5G, reloj en tiempo real y pasillo actual.
  - **Target Box 3D Holográfica**: Bounding box 3D de alambre de neón que se bloquea y alinea sobre el alimento enfocado.
  - **Efectos de Sonido Sintetizados (Web Audio API)**:
    - Chirp de bloqueo de objetivo (*Lock-on*).
    - Barrido de escaneo holográfico (*Scan sweep*).
    - Acorde armónico de confirmación de análisis exitoso.
  - **Síntesis de Voz en Vivo en Español**:
    - Análisis bioquímico, índice de frescura %, días de vida útil, composición (agua, azúcares, fibra, vitaminas) y certificación BIO.
    - Ecualizador de ondas de audio animado y transcripción en pantalla.
    - Botón de control rápido para silenciar/activar voz y reajustar posición.

## Cómo Ejecutar

### 1. Iniciar el Servidor Local

Abre PowerShell en esta carpeta y ejecuta:
```powershell
.\serve.ps1
```
*(El servidor detecta automáticamente si el puerto 3000 está ocupado y utiliza el puerto 3001 sin errores).*

### 2. Abrir en el Navegador

Visita en Google Chrome o Edge:
```
http://localhost:3001/
```
(O la dirección que indique la consola de `serve.ps1`).

## Controles de Interacción

- **🖱️ Mouse**: Arrastra para rotar la vista 360° en primera persona (POV).
- **⌨️ Teclas W, A, S, D o Flechas**: Camina por los pasillos del supermercado.
- **🖱️ Rueda del Mouse**: Avanza o retrocede naturalmente.
- **🎯 Mirada fija (1.4s)**: Manten la retícula central sobre cualquier fruta o verdura para iniciar el bioescaneo.
- **🖱️ Clic izquierdo**: Escaneo inmediato del alimento enfocado y activación de audio.
- **⌨️ Tecla M**: Silenciar / reactivar voz del asistente IA.
