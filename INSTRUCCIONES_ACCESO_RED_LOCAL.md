# Guía para Acceder a la Aplicación Web desde la Red Local (Corriendo en WSL)

Esta guía explica cómo configurar tu entorno de Windows y WSL para poder acceder a tu servidor de desarrollo (Node.js) desde otro dispositivo en la misma red, como tu teléfono celular.

### El Problema a Resolver

1.  **Red Virtual de WSL:** WSL2 no se ejecuta directamente en tu red local, sino en su propia red virtual con una dirección IP interna (ej: `172.29.80.211`). Tu teléfono no puede "ver" esta IP directamente.
2.  **Firewall de Windows:** Por seguridad, el firewall de tu PC bloquea por defecto todas las conexiones entrantes desde la red a puertos aleatorios, como el `3000` que usa nuestro servidor.

### La Solución

La solución consiste en dos configuraciones principales que solo necesitas hacer **una vez**:

1.  **Reenvío de Puertos (Port Forwarding):** Crear una regla en Windows que redirija todo el tráfico que llega al puerto `3000` de tu PC hacia el puerto `3000` de tu WSL.
2.  **Regla de Firewall:** Crear una regla en el Firewall de Windows para permitir explícitamente las conexiones entrantes al puerto `3000`.

---

## Instrucciones de Configuración (Hacer una sola vez)

Estos comandos se ejecutan en **PowerShell de Windows como Administrador**.

### Paso 1: Configurar el Reenvío de Puertos

Este comando crea el "puente" entre tu Windows y tu WSL.

1.  **Obtén la IP de tu WSL.** Abre una terminal de **Ubuntu/WSL** y ejecuta:
    ```bash
    hostname -I
    ```
    Copia la primera dirección IP que aparece (ej: `172.29.80.211`).

2.  **Crea la regla de reenvío.** Abre **PowerShell como Administrador** y ejecuta este comando, reemplazando `IP_DE_TU_WSL` por la que copiaste en el paso anterior.

    ```powershell
    netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=IP_DE_TU_WSL
    ```
    *Ejemplo:*
    ```powershell
    netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=172.29.80.211
    ```

### Paso 2: Crear la Regla en el Firewall de Windows

Este comando le da permiso a otros dispositivos de la red para conectarse al puerto `3000` de tu PC.

1.  En la misma ventana de **PowerShell como Administrador**, ejecuta:
    ```powershell
    New-NetFirewallRule -DisplayName "Servidor Web Local (Node.js)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000
    ```

---

## Cómo Conectarse (Cada vez que lo necesites)

Una vez completada la configuración anterior, el proceso para conectarte es siempre el mismo.

### Paso 1: Inicia tu Servidor

Abre tu terminal de **Ubuntu/WSL**, navega a tu proyecto y ejecuta tu servidor.
```bash
node backend/server.js
```

### Paso 2: Obtén la Dirección IP de tu PC en la Red Local

1.  Abre el **Símbolo del sistema** o **PowerShell** en **Windows** (no es necesario que sea como administrador).
2.  Ejecuta el comando:
    ```cmd
    ipconfig
    ```
3.  Busca el adaptador de tu red activa (normalmente "Adaptador de LAN inalámbrica Wi-Fi").
4.  Localiza la línea que dice **"Dirección IPv4"**. Esta es la IP de tu PC en la red local (ej: `192.168.1.50`).

### Paso 3: Accede desde tu Teléfono

1.  Asegúrate de que tu teléfono esté conectado a la **misma red Wi-Fi** que tu PC.
2.  Abre el navegador web en tu teléfono.
3.  En la barra de direcciones, escribe `http://` seguido de la **Dirección IPv4 de tu PC** del paso anterior y el puerto `:3000`.

    **Formato:** `http://<IP-DE-TU-PC>:<PUERTO>`

    **Ejemplo real:** `http://192.168.1.50:3000`

¡Listo! Ahora deberías ver tu aplicación web en tu celular.

---

## Comandos para Revertir los Cambios (Limpieza)

Si en el futuro quieres eliminar estas reglas, ejecuta los siguientes comandos en **PowerShell como Administrador**:

1.  **Eliminar regla del Firewall:**
    ```powershell
    Remove-NetFirewallRule -DisplayName "Servidor Web Local (Node.js)"
    ```
2.  **Eliminar reenvío de puertos:**
    ```powershell
    netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
    ```
