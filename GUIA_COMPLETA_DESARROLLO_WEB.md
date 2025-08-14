# Guía Completa: De Cero a una Aplicación Web Segura (para un Programador de C)

## 1. Introducción

**Objetivo:** Este documento es un tutorial detallado que reconstruye, paso a paso, nuestro viaje desde un simple archivo HTML hasta una aplicación web funcional con un backend seguro. El objetivo es que puedas entender no solo el "cómo", sino fundamentalmente el "porqué" de cada decisión, tecnología y línea de código, permitiéndote replicar y expandir este conocimiento sin asistencia.

**El Paradigma del Programador de C:** Viniendo de C, estás acostumbrado a tener control total sobre la memoria, los procesos y el sistema. Compilas un ejecutable que corre en una máquina. El desarrollo web introduce una separación fundamental: el **Cliente** (el navegador del usuario, un entorno que no controlas) y el **Servidor** (tu código corriendo en una máquina que sí controlas). Esta guía hará énfasis en las diferencias y similitudes con los conceptos que ya dominas.

---

## 2. Resumen de la Arquitectura Final

Antes de sumergirnos en los pasos, aquí tienes un cuadro simple que resume la arquitectura que construimos.

| Componente | Tecnología / Lenguaje | Propósito (Analogía con C) |
| :--- | :--- | :--- |
| **Frontend (UI)** | HTML, Tailwind CSS | La "interfaz gráfica" de tu aplicación. Define la estructura y el estilo. (Similar a usar una librería como GTK o Qt para definir ventanas y botones). |
| **Frontend (Lógica)** | JavaScript (en el navegador) | El código que responde a las acciones del usuario (clics, etc.) en su máquina. (El `main()` y las funciones de tu programa que se ejecutan localmente). |
| **Backend (Servidor)** | Node.js, Express.js | El "corazón" de tu aplicación que corre en tu servidor. (Un programa demonio o servicio en C que escucha en un socket de red). |
| **Backend (Base de Datos)**| SQLite | El sistema de almacenamiento persistente. (Un archivo binario estructurado que tu servidor C gestiona con `fopen`, `fwrite`, etc., pero con SQL). |
| **Entorno de Desarrollo** | VS Code, Ubuntu (WSL) | Tu "IDE" y "Sistema Operativo de Compilación/Ejecución". |

---

## 3. Parte I: El Mundo del Frontend y sus Limitaciones

Comenzamos con todo en un solo lugar: el navegador del usuario.

### Paso 3.1: La Aplicación Inicial (Cliente-Puro)

*   **¿Qué teníamos?** Un archivo `calculadora.html` que contenía HTML para la estructura, CSS (Tailwind) para el estilo y JavaScript para la lógica.
*   **¿Cómo funciona?** El usuario abre este archivo. El navegador lo lee, construye una representación en memoria (el **DOM** o Document Object Model) y ejecuta el código JavaScript.
*   **Analogía con C:** Esto es idéntico a entregarle a un usuario un archivo `.exe` compilado. Se ejecuta enteramente en su máquina, usando sus recursos. No tiene conexión contigo.

### Paso 3.2: El Primer Intento de Login y la "Sandbox"

*   **El Requisito:** Añadir un login que guardara los usuarios en un archivo y enviara un email.
*   **El Muro de la Realidad (La Sandbox del Navegador):** Aquí nos topamos con la diferencia más grande entre C y JavaScript de navegador.
    *   **En C:** Tu programa, con los permisos adecuados, puede abrir sockets, leer/escribir cualquier archivo en el disco, etc. Tienes acceso de bajo nivel al sistema.
    *   **En el Navegador:** JavaScript se ejecuta en una "caja de arena" (sandbox) por seguridad. Si cualquier página web pudiera acceder a tus archivos, internet sería un caos de virus y robo de datos. Por tanto, JavaScript de navegador **NO PUEDE** escribir archivos en el disco, enviar emails directamente o realizar la mayoría de las operaciones de sistema.
*   **La Solución de Contorno (Simulación):**
    1.  **Almacenamiento:** Usamos `localStorage`, una pequeña base de datos clave-valor que el navegador ofrece. **Analogía con C:** Es como un archivo `.ini` o de configuración simple, pero gestionado por el navegador y **visible para cualquiera con acceso a ese navegador**. No es seguro para contraseñas.
    2.  **Emails:** Simulamos el envío mostrando una alerta (`alert()`) con el código.

**Conclusión de la Parte I:** Una aplicación de solo frontend es limitada. Para seguridad, persistencia de datos y lógica centralizada, necesitamos un servidor.

---

## 4. Parte II: Construyendo el Backend (El Servidor)

Aquí es donde construimos nuestro programa que correrá 24/7 en una máquina que controlamos.

### Paso 4.1: Configuración del Entorno (Node.js y npm)

1.  **Instalar Node.js:**
    *   **¿Qué es Node.js?** Es un entorno de ejecución para JavaScript en el servidor. **Analogía con C:** Es el equivalente al compilador (como GCC) y la librería estándar de C (`libc`) juntos. Te permite ejecutar código JS y le da acceso al sistema de archivos, red, etc. (usa el motor V8 de Google, que está escrito en C++).
    *   Usamos `nvm` (Node Version Manager) para instalarlo, una herramienta que permite tener varias versiones de Node.js y cambiar entre ellas.

2.  **Inicializar el Proyecto:**
    *   Creamos la carpeta `backend/`.
    *   Ejecutamos `npm init -y`.
    *   **¿Qué es `npm`?** Node Package Manager. **Analogía con C:** Es tu `make` y tu gestor de paquetes (`apt`, `pacman`) todo en uno. Gestiona las librerías (llamadas "paquetes") que tu proyecto necesita.
    *   **¿Qué es `package.json`?** El archivo de configuración de tu proyecto. **Analogía con C:** Es tu `Makefile` o `CMakeLists.txt`. Define el nombre del proyecto, la versión y, lo más importante, la lista de dependencias. Cuando alguien descarga tu proyecto, solo necesita ejecutar `npm install` y npm leerá este archivo e instalará todo lo necesario.

### Paso 4.2: Creación de la Base de Datos (SQLite)

1.  **Instalar Paquetes:** Ejecutamos `npm install sqlite3 sqlite`. Esto descarga las librerías y las añade a `package.json`.
2.  **Crear el Script de Migración (`migrate.js`):**
    *   **Propósito:** Un script que se ejecuta una vez para preparar la base de datos.
    *   **Código:** Usamos SQL para `CREATE TABLE IF NOT EXISTS users (...)`. Esto define la "estructura" (`struct` en C) de nuestros datos de usuario.
    *   **Analogía con C:** Este script es como una función `initialize_database()` que llamas al principio de tu programa servidor, que abre un archivo binario y escribe una cabecera para definir la estructura de los datos que contendrá.

### Paso 4.3: El Servidor Web con Express.js

1.  **Instalar Express:** `npm install express`.
    *   **¿Qué es Express.js?** Es un "framework", es decir, un conjunto de librerías que nos simplifica enormemente la creación de un servidor web. En lugar de manejar sockets y parsear peticiones HTTP manualmente, Express nos da funciones simples para ello.
2.  **Crear `server.js`:**
    *   **`const app = express()`:** Crea la aplicación del servidor.
    *   **`app.listen(PORT, ...)`:** Inicia el servidor y lo pone a escuchar peticiones en un puerto.
    *   **El Bucle de Eventos (Event Loop):** Este es un concepto crucial.
        *   **En C (simple):** Si llamas a `recv()` en un socket, tu programa se **bloquea** hasta que llegan datos.
        *   **En Node.js:** Es **no-bloqueante**. `app.listen()` inicia un bucle que espera "eventos" (como una petición HTTP). Cuando llega un evento, ejecuta la función asociada (el "callback") y vuelve a esperar, sin bloquear nunca el hilo principal. Esto le permite manejar miles de conexiones simultáneas de forma muy eficiente con un solo hilo.

---

## 5. Parte III: Implementando la Lógica de Autenticación

Aquí es donde el servidor cobra vida.

### Paso 5.1: El Flujo de Registro y Verificación

1.  **Endpoint `/api/register` (`POST`):**
    *   Recibe los datos del usuario (nombre, email, etc.) en el cuerpo de la petición.
    *   **Hashea la contraseña con `bcrypt`:** Esta librería es el estándar. No solo crea un hash, sino que le añade una "sal" (un trozo de datos aleatorio) a cada contraseña antes de hashearla. Esto significa que si dos usuarios tienen la misma contraseña "1234", sus hashes guardados en la base de datos serán diferentes.
    *   **Genera un código de verificación** de 4 dígitos.
    *   **Guarda el usuario en la BD** con `is_verified = 0` (falso).

2.  **Envío de Email con `Nodemailer`:**
    *   Instalamos `npm install nodemailer`.
    *   Configuramos **Ethereal**, un servicio de email falso para desarrollo. Nos da credenciales temporales para enviar emails a una "bandeja de entrada de prueba" visible en una URL.
    *   El servidor envía el código de 4 dígitos al email del usuario.

3.  **Endpoint `/api/verify` (`POST`):**
    *   Recibe el email y el código enviado por el usuario.
    *   Busca al usuario en la BD.
    *   Compara el código. Si es correcto, cambia `is_verified` a `1` (verdadero).

### Paso 5.2: El Flujo de Login y los Tokens JWT

1.  **Endpoint `/api/login` (`POST`):**
    *   Recibe email y contraseña.
    *   Busca al usuario en la BD.
    *   **Importante:** Comprueba que `is_verified` sea `1`. Si no, deniega el acceso.
    *   Usa `bcrypt.compare()` para comparar de forma segura la contraseña enviada con el hash guardado.
    *   **Si todo es correcto, crea un Token JWT.**

2.  **JSON Web Tokens (JWT): El Estándar Moderno de Sesiones**
    *   **El Problema Antiguo:** ¿Cómo sabe un servidor quién eres en peticiones futuras? Antes se usaban "sesiones" guardadas en la memoria del servidor.
    *   **La Solución JWT:** El servidor es "stateless" (sin estado). No necesita recordar nada.
        1.  Tras el login, el servidor crea un **token**: un string largo y cifrado que contiene datos del usuario (como su ID) y una fecha de caducidad. Este token está "firmado" con un secreto (`JWT_SECRET`) que solo el servidor conoce.
        2.  El servidor envía este token al cliente (el navegador).
        3.  El cliente lo guarda (en `localStorage`) y lo adjunta en cada petición futura a rutas protegidas.
        4.  El servidor, al recibir una petición, simplemente verifica la firma del token. Si la firma es válida, confía en los datos del token sin tener que ir a la base de datos.

---

## 6. Parte IV: La Batalla Final - Depurando CORS

Esta fue la parte más difícil y una lección invaluable sobre el desarrollo web.

*   **El Problema:** El navegador, por seguridad, bloqueaba las peticiones del frontend (en `localhost:5500`) al backend (en `localhost:3000`), lanzando un `NetworkError`. Esto es **CORS (Cross-Origin Resource Sharing)**.
*   **Intentos Fallidos:**
    1.  Usar la librería `cors` con su configuración por defecto.
    2.  Configurar la librería `cors` de forma explícita.
    3.  Quitar la librería y poner las cabeceras CORS manualmente.
    4.  Mejorar el middleware manual para manejar peticiones `OPTIONS` (preflight).
    5.  Cambiar `localhost` por la IP de WSL (`172.29.80.211`).
*   **La Causa Raíz:** El problema no estaba en el código, sino en la capa de red entre Windows (donde corre el navegador) y WSL (donde corre el servidor). Algo en el entorno estaba bloqueando las respuestas.
*   **La Solución Definitiva (Unificar el Servidor):**
    1.  Modificamos `server.js` para que, además de servir la API, también sirviera los archivos estáticos del frontend (HTML, JS, etc.) usando `app.use(express.static(...))`.
    2.  Eliminamos por completo el "Live Server" de VS Code.
    3.  Ahora, tanto el frontend como la API se sirven desde el mismo origen (`http://172.29.80.211:3000`). El problema de CORS desaparece porque ya no hay un "cruce de orígenes".

---

## 7. Conclusión: Tu Aplicación Funcional

Hemos completado un ciclo de desarrollo completo y realista. Has aprendido no solo a escribir código para el frontend y el backend, sino también a configurar un entorno, gestionar una base de datos y, lo más importante, a depurar problemas complejos de red y entorno que son el pan de cada día de un desarrollador web.

Este proyecto es una base sólida y robusta sobre la cual puedes seguir construyendo y aprendiendo. ¡Felicidades!