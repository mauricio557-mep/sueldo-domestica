# Guía Completa para Configurar el Entorno de Desarrollo en una Nueva PC

Esta guía detalla los pasos para replicar un entorno de desarrollo completo basado en WSL (Subsistema de Windows para Linux) con Ubuntu, incluyendo las herramientas necesarias para desarrollo en Rust y desarrollo Web (Node.js).

---

## 1. Instalación de WSL y Ubuntu

WSL te permite ejecutar un entorno de Linux directamente en Windows, sin la sobrecarga de una máquina virtual tradicional.

1.  **Abrir PowerShell o Símbolo del sistema como Administrador.**
    *   Busca "PowerShell" en el menú de inicio, haz clic derecho y selecciona "Ejecutar como administrador".

2.  **Instalar WSL y Ubuntu.**
    *   El siguiente comando descargará e instalará todos los componentes necesarios para WSL y la distribución Ubuntu por defecto.

    ```bash
    wsl --install
    ```

    *Si deseas instalar una distribución específica (aunque Ubuntu es la recomendada y la que usamos), puedes usar:*
    ```bash
    wsl --install -d Ubuntu
    ```

3.  **Reiniciar la Computadora.**
    *   Una vez que el proceso termine, reinicia tu PC para completar la instalación.

4.  **Configurar Ubuntu.**
    *   Después de reiniciar, Ubuntu se iniciará automáticamente. Si no lo hace, ábrelo desde el menú de inicio.
    *   La primera vez que se ejecute, te pedirá que crees un **nombre de usuario** y una **contraseña**. Estos son para tu entorno de Linux y no tienen que coincidir con tu usuario de Windows.

5.  **Actualizar el Sistema.**
    *   Es una buena práctica actualizar todos los paquetes de tu nuevo sistema Ubuntu. Abre una terminal de Ubuntu y ejecuta:

    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

---

## 2. Herramientas de Desarrollo Esenciales

Estas son herramientas básicas que necesitarás para casi cualquier tipo de desarrollo.

1.  **Instalar Build Essential y Git.**
    *   `build-essential` contiene herramientas de compilación (como `gcc` y `make`) que son necesarias para muchos programas y extensiones. `git` es el sistema de control de versiones.

    ```bash
    sudo apt install build-essential git -y
    ```

2.  **Instalar un Editor de Código: Visual Studio Code.**
    *   **Instala VS Code en Windows** (no dentro de WSL). Descárgalo desde la [página oficial](https://code.visualstudio.com/).
    *   Una vez instalado en Windows, abre VS Code e instala la extensión **WSL**. Búscala en el panel de extensiones (Ctrl+Shift+X) e instálala.
    *   Esta extensión te permitirá trabajar en tus archivos de Linux de forma nativa desde el VS Code de Windows, lo cual es el flujo de trabajo recomendado.

---

## 3. Configuración del Entorno de Desarrollo Rust

1.  **Instalar Rustup.**
    *   `rustup` es el instalador oficial y gestor de versiones de Rust. Instálalo ejecutando el siguiente comando en tu terminal de Ubuntu.

    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    ```
    *   Cuando te pregunte, simplemente presiona `1` para proceder con la instalación por defecto.

2.  **Configurar el Path de Cargo.**
    *   El script de instalación te indicará que necesitas añadir el directorio de binarios de Cargo a tu PATH. Ejecuta el siguiente comando para hacerlo efectivo en tu sesión actual.

    ```bash
    source "$HOME/.cargo/env"
    ```
    *   Esto se añade automáticamente a tu `.profile`, por lo que estará disponible en futuras sesiones.

3.  **Verificar la Instalación.**
    *   Comprueba que `rustc` (el compilador) y `cargo` (el gestor de paquetes y proyectos) están instalados.

    ```bash
    rustc --version
    cargo --version
    ```

4.  **Extensión de VS Code Recomendada.**
    *   En VS Code, instala la extensión **rust-analyzer**. Proporciona autocompletado, análisis de código en tiempo real, y muchas otras funcionalidades que hacen que el desarrollo en Rust sea mucho más fácil.

---

## 4. Configuración del Entorno de Desarrollo Web (Node.js)

Para el desarrollo web con JavaScript/TypeScript, usaremos `nvm` (Node Version Manager) para gestionar las versiones de Node.js. Es más flexible que instalar Node directamente desde los repositorios de Ubuntu.

1.  **Instalar NVM.**
    *   Ejecuta el siguiente comando para descargar e instalar `nvm`.

    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    ```
    *   Cierra y vuelve a abrir tu terminal de Ubuntu para que los cambios surtan efecto.

2.  **Verificar la Instalación de NVM.**
    *   Ejecuta `command -v nvm`. Si devuelve `nvm`, está listo.

3.  **Instalar Node.js (Versión LTS).**
    *   Usaremos `nvm` para instalar la última versión de Soporte a Largo Plazo (LTS), que es la recomendada para la mayoría de los proyectos.

    ```bash
    nvm install --lts
    ```

4.  **Establecer la Versión por Defecto.**
    *   Para no tener que seleccionar la versión cada vez, establécela como la predeterminada.

    ```bash
    nvm alias default lts
    ```

5.  **Verificar la Instalación de Node y NPM.**
    *   Comprueba que `node` y `npm` (Node Package Manager) están disponibles.

    ```bash
    node -v
    npm -v
    ```

---

## 5. Flujo de Trabajo y Clonación de tu Proyecto

1.  **Abrir el Entorno de Desarrollo.**
    *   Abre tu terminal de Ubuntu.

2.  **Navegar al Sistema de Archivos de Windows.**
    *   Tus unidades de Windows están montadas en el directorio `/mnt/`. Por ejemplo, tu disco `C:` es `/mnt/c/`.
    *   Navega a donde quieras clonar tu proyecto. Ejemplo:
    ```bash
    cd /mnt/c/Users/TuUsuario/Documents/
    ```

3.  **Clonar el Repositorio (si está en Git).**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd <NOMBRE_DEL_PROYECTO>
    ```

4.  **Abrir el Proyecto en VS Code.**
    *   Desde la terminal de Ubuntu, dentro del directorio de tu proyecto, simplemente ejecuta:
    ```bash
    code .
    ```
    *   Esto abrirá VS Code en Windows, pero conectado directamente a tu entorno WSL, listo para editar y ejecutar comandos.

5.  **Instalar Dependencias del Proyecto.**
    *   Para el proyecto `sueldo-domestica`, navega al directorio del backend e instala las dependencias de Node.js.
    ```bash
    cd backend/
    npm install
    ```

¡Listo! Con estos pasos tendrás un entorno de desarrollo idéntico al que estabas utilizando.
