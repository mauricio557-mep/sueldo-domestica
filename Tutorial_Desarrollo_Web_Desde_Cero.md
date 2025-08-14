# Tutorial: De un Archivo HTML a una Aplicación Web Segura con Backend

## Introducción

**Objetivo:** Este documento resume el viaje que emprendimos para transformar una simple página web en una aplicación funcional y segura con una arquitectura cliente-servidor. Está especialmente diseñado para un programador con experiencia en lenguajes como C, explicando no solo el "qué" sino también el "porqué" de cada tecnología y concepto.

**El Punto de Partida:** Una única página `calculadora.html` que se ejecuta completamente en el navegador (del lado del cliente).

**El Destino:** Una aplicación de dos partes:
1.  **Frontend:** La interfaz de usuario con la que interactúas (`index.html`, `calculadora.html`), que sigue corriendo en el navegador.
2.  **Backend:** Un servidor robusto y seguro (escrito en Node.js) que gestiona la lógica de negocio, los usuarios y la base de datos.

---

## Parte 1: El Mundo del Frontend (Lado del Cliente)

Al principio, todo nuestro código estaba en un solo archivo HTML. Este código es descargado por el navegador y ejecutado en el ordenador del usuario.

> **Paralelo con C:** Piensa en esto como un programa ejecutable que le entregas a un usuario. Una vez que lo tiene, se ejecuta enteramente en su máquina, sin conexión contigo (el desarrollador).

### 1.1. El Primer Desafío: Arreglar la Validación

*   **Problema:** La aplicación rechazaba un enlace válido de Google Sheets.
*   **Análisis:** Al leer el código JavaScript dentro de `calculadora.html`, vimos que la validación era demasiado estricta: `sheetURL.includes('spreadsheets.google.com')`. El enlace publicado usaba `docs.google.com`.
*   **Solución:** Corregimos la condición a `sheetURL.includes('docs.google.com/spreadsheets')`.
*   **Concepto Clave - El DOM:** JavaScript en el navegador no modifica el archivo HTML directamente. Modifica una representación en memoria del documento llamada **DOM (Document Object Model)**. Por eso, para que los cambios surtan efecto, solo necesitas refrescar la página para que el navegador lea el archivo HTML corregido y construya un nuevo DOM.

### 1.2. El Segundo Desafío: Añadir un Login

*   **Requisito:** Un sistema de login con email y contraseña, con verificación por email y almacenamiento seguro.
*   **El Gran Muro del Navegador (La "Sandbox"):** Aquí nos topamos con una diferencia fundamental entre un programa en C y el código JavaScript en un navegador.
    *   Un programa en **C** puede, en general, acceder al sistema de archivos, enviar correos (con las librerías adecuadas) y hacer casi cualquier cosa que el sistema operativo le permita.
    *   **JavaScript** en un navegador se ejecuta en una **"sandbox" (caja de arena)**. Es un entorno de ejecución muy restringido por seguridad. **No puede** acceder al sistema de archivos del usuario (`C:\`, `/home/`) ni enviar correos directamente. Si pudiera, cualquier página web maliciosa podría robar tus archivos o enviar spam desde tu cuenta.

### 1.3. Solución Inicial: Un Login Simulado con `localStorage`

Como no podíamos usar archivos ni enviar emails, simulamos el comportamiento:

*   **Almacenamiento:** Usamos `localStorage`. Es una pequeña base de datos de tipo "clave-valor" que el navegador proporciona a cada sitio web. Es persistente (no se borra al cerrar la pestaña) pero **no es seguro** para datos sensibles, ya que cualquier persona con acceso al navegador puede ver su contenido a través de las herramientas de desarrollador (F12).
*   **Verificación:** Simulamos el envío del código de 4 dígitos mostrándolo en una alerta (`alert()`).
*   **"Encriptación":** Usamos una librería para "hashear" la contraseña. Un **hash** es un resumen de una sola vía. Puedes generar el hash desde la contraseña, pero no puedes obtener la contraseña desde el hash. Esto es mejor que texto plano, pero como vimos, un atacante con acceso al `localStorage` no necesita la contraseña original si puede ver la lógica del login.

**Conclusión de la Parte 1:** Una aplicación de solo frontend es ideal para herramientas visuales o calculadoras, pero para cualquier cosa que requiera persistencia de datos segura y lógica de negocio centralizada, necesitamos un backend.

---

## Parte 2: Construyendo el Backend (Lado del Servidor)

Aquí es donde introducimos la arquitectura **Cliente-Servidor**.

> **Paralelo con C:** Imagina que tu programa en C (`cliente`) necesita realizar una operación muy compleja. En lugar de hacerlo él mismo, se conecta a través de la red a otro programa tuyo (`servidor`) que está corriendo en una máquina potente. El cliente le envía los datos, el servidor hace el trabajo y le devuelve el resultado. Esta es la misma relación entre nuestro frontend (cliente) y nuestro backend (servidor).

### 2.1. La Elección del Entorno: Node.js en WSL

*   **¿Qué es Node.js?** Es un entorno de ejecución para JavaScript fuera del navegador. En su núcleo, es un programa escrito en C++ que utiliza el motor V8 de Google (el mismo que usa Chrome) para ejecutar código JS. Le añade funcionalidades que no existen en el navegador, como el acceso al sistema de archivos, bases de datos y la capacidad de crear servidores.
*   **¿Por qué en WSL (Ubuntu)?** Porque la mayoría de los servidores del mundo corren en Linux. Desarrollar en un entorno similar (WSL) al de producción (un servidor Linux en la nube) elimina muchísimos problemas de compatibilidad.

### 2.2. Preparando el Proyecto del Backend

1.  **`npm` (Node Package Manager):** Es la herramienta fundamental del ecosistema Node.js.
    > **Paralelo con C:** `npm` es para un proyecto de Node lo que `apt` es para Ubuntu o `make` es para un proyecto de C. Se encarga de descargar las librerías (llamadas "paquetes"), gestionar las dependencias y ejecutar scripts definidos.
2.  **`npm init -y`:** Este comando crea el archivo `package.json`.
    > **Paralelo con C:** El `package.json` es como un `Makefile` o un `CMakeLists.txt`. Define el nombre del proyecto, la versión, y lo más importante, las **dependencias** (las librerías que necesita, como `express`). Cuando clonas un proyecto, solo necesitas ejecutar `npm install` y npm leerá este archivo para descargar todo lo necesario.
3.  **`npm install express`:** Este comando descarga la librería `express` y la añade a `package.json`.

### 2.3. Creando la Base de Datos con SQLite

*   **¿Por qué SQLite?** Es una base de datos contenida en un solo archivo. No requiere un servicio corriendo. Es increíblemente simple para empezar.
    > **Paralelo con C:** Usar SQLite es como si tu programa en C usara `fopen()`, `fwrite()` y `fread()` para escribir y leer `structs` en un archivo binario, pero de una forma mucho más potente y estructurada usando el lenguaje SQL.
*   **¿Por qué no PostgreSQL?** PostgreSQL es un sistema cliente-servidor en sí mismo. Es mucho más potente y adecuado para producción, pero requiere instalar y gestionar un servicio separado, lo que añadía una complejidad innecesaria para nuestro objetivo de aprendizaje inicial.
*   **`database.js`:** Creamos un script para inicializar la base de datos y crear la tabla `users` con las columnas `id`, `email` y `password`, asegurando que el `email` sea `UNIQUE`.

---

## Parte 3: La Lógica del Servidor con Express

Aquí es donde construimos el "cerebro" de la aplicación.

### 3.1. El Servidor Básico (`server.js`)

El primer código que escribimos ponía en marcha un servidor que respondía "¡Hola, Mundo!".

*   **`const express = require('express')`:** Importa la librería. Similar a un `#include <stdio.h>` en C.
*   **`app.listen(PORT, ...)`:** Este es el corazón del servidor. Pone al programa en un **bucle de eventos (event loop)**.
    > **Paralelo con C:** Un programa simple en C es **bloqueante**. Si haces una llamada a `read()`, el programa se detiene hasta que recibe datos. Node.js es **no-bloqueante y orientado a eventos**. `app.listen()` inicia un bucle que espera eventos (como una petición HTTP entrante). Cuando llega un evento, ejecuta la función asociada (el "callback") sin bloquear el resto del programa. Esto le permite manejar miles de conexiones concurrentes de manera muy eficiente.

### 3.2. Los Endpoints de Autenticación (`/api/register`, `/api/login`)

Reemplazamos el servidor básico con la lógica real.

*   **API (Application Programming Interface):** Es el contrato que define cómo el cliente y el servidor hablarán. Nuestra API tiene dos "endpoints" o rutas.
*   **`POST` vs `GET`:** `GET` es para pedir datos (como cuando visitas una web). `POST` es para enviar datos para crear o modificar algo (como al enviar un formulario de login).
*   **`async` / `await`:** Esta es la sintaxis moderna para manejar operaciones asíncronas (que no terminan inmediatamente, como una consulta a la base de datos).
    > **Paralelo con C:** En C, si llamas a una función que lee de un archivo, esperas a que termine. Con `await`, le dices al event loop de Node: "Voy a esperar por el resultado de esta operación (`await db.get(...)`), pero mientras tanto, siéntete libre de atender otras peticiones". Esto hace que el servidor sea muy responsivo.
*   **`bcrypt` y Hashing de Contraseñas:** Usamos `bcrypt` porque es el estándar de la industria. No solo hashea, sino que añade una "sal" (salt) aleatoria a cada contraseña antes de hashearla. Esto significa que incluso si dos usuarios tienen la misma contraseña, sus hashes guardados en la base de datos serán diferentes.
*   **JWT (JSON Web Tokens):** Este es el concepto clave para la autenticación moderna.
    1.  El usuario se loguea con email/contraseña.
    2.  El servidor verifica los datos. Si son correctos, genera un **token JWT**. Este token es un string largo que contiene información (payload), como el ID del usuario, y está "firmado" digitalmente con un secreto (`JWT_SECRET`) que solo el servidor conoce.
    3.  El servidor envía este token al cliente.
    4.  El cliente lo guarda (en `localStorage`) y lo envía de vuelta al servidor en cada petición futura que requiera autenticación.
    5.  El servidor, en lugar de buscar en la base de datos cada vez, simplemente verifica la firma del token. Si la firma es válida (usando el `JWT_SECRET`), confía en que el token no ha sido modificado y que el usuario es quien dice ser.
    *   **Ventaja:** El servidor es **"stateless" (sin estado)**. No necesita mantener una lista de usuarios logueados. Toda la información de la sesión está en el token que posee el cliente.

---

## Parte 4: Conectando Todo

El último paso fue hacer que el frontend y el backend hablaran entre sí.

### 4.1. Modificando `login.js`

*   Eliminamos toda la lógica de `localStorage` para usuarios.
*   Usamos la función **`fetch()`** del navegador. Es la herramienta estándar para hacer peticiones HTTP (como `GET` y `POST`) a un servidor.
*   Implementamos el flujo final:
    1.  Intentar `fetch` a `/api/login`.
    2.  Si la respuesta es `404` (No encontrado), significa que el usuario no existe.
    3.  Entonces, hacer `fetch` a `/api/register` para crearlo.
    4.  Si el registro es exitoso, reintentar el `fetch` a `/api/login`.
    5.  Si el login final es exitoso, el servidor devuelve un token. Lo guardamos en `localStorage` y redirigimos a `calculadora.html`.

### 4.2. Asegurando `calculadora.html`

Modificamos el script en `calculadora.html` para que, en lugar de buscar un usuario en `sessionStorage`, simplemente compruebe la existencia del `authToken` en `localStorage`. Si no existe, redirige al login.

---

## Conclusión Final

Hemos recorrido un camino inmenso. Pasamos de un simple documento a una aplicación completa con una arquitectura moderna y segura.

**Conceptos Clave que has aprendido:**

*   La diferencia entre **código de cliente (frontend)** y **código de servidor (backend)**.
*   La **sandbox** del navegador y sus implicaciones de seguridad.
*   El ecosistema de **Node.js** (`npm`, `package.json`).
*   Cómo crear un servidor web con **Express**.
*   El modelo **no-bloqueante y orientado a eventos** de Node.js.
*   El uso de una base de datos (**SQLite**) desde el backend.
*   La creación de una **API REST** con endpoints (`POST`).
*   El flujo de **autenticación basada en Tokens (JWT)**, que es el estándar de la industria.
*   Cómo conectar un frontend a un backend usando **`fetch()`**.

Este proyecto es una base sólida. Desde aquí, puedes explorar conceptos como migrar a PostgreSQL, desplegar la aplicación en un servidor real en la nube, o añadir más funcionalidades a tu API. ¡Felicidades por completar este viaje!