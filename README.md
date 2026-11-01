# 🃏 LocalPoker - API & Servidor de Poker (Texas Hold'em)

Este es el backend completo para una aplicación de Poker multijugador en tiempo real. Utiliza **Node.js**, **TypeScript**, **Express** y **Socket.io** para la comunicación bidireccional, junto con **SQLite** (a través de **Prisma**) para almacenar usuarios y la persistencia de sus fichas.

---

## 🚀 Requisitos y Configuración Rápida

### 1. Instalación de dependencias
Asegúrate de instalar los paquetes necesarios:
```bash
npm install
```

### 2. Configurar Base de Datos
El proyecto utiliza Prisma con SQLite de forma local. Para inicializar la base de datos y aplicar las migraciones, ejecuta:
```bash
npx prisma db push
```

### 3. Ejecutar el Servidor
*   **Modo de Desarrollo** (recarga automática con nodemon):
    ```bash
    npm run dev
    ```
*   **Modo de Producción** (compilar y arrancar):
    ```bash
    npm run build
    npm start
    ```

El servidor escuchará por defecto en `http://localhost:5000`.

---

## 📡 API REST (Endpoints)

Todos los endpoints REST devuelven respuestas en formato JSON.

### Autenticación
#### 1. Registro de Usuario (`POST /api/auth/register`)
Crea una cuenta con 10,000 fichas iniciales de forma gratuita.
*   **Body:**
    ```json
    {
      "username": "usuario1",
      "password": "mi_password_seguro"
    }
    ```
*   **Respuesta (201):**
    ```json
    {
      "message": "Usuario registrado con éxito.",
      "token": "JWT_TOKEN_AQUÍ",
      "user": {
        "id": "USER_ID_UUID",
        "username": "usuario1",
        "chips": 10000
      }
    }
    ```

#### 2. Inicio de Sesión (`POST /api/auth/login`)
*   **Body:**
    ```json
    {
      "username": "usuario1",
      "password": "mi_password_seguro"
    }
    ```
*   **Respuesta (200):** Retorna el token JWT para autenticar las peticiones REST y la conexión de WebSockets.

#### 3. Obtener Datos del Perfil (`GET /api/auth/me`)
*   **Headers:** `Authorization: Bearer JWT_TOKEN_AQUÍ`
*   **Respuesta (200):** Devuelve el ID, username y la cantidad actual de fichas del jugador.

---

### Gestión de Salas (Lobbies)
*Todos estos endpoints requieren autenticación mediante la cabecera `Authorization: Bearer JWT_TOKEN`.*

#### 1. Crear una Sala (`POST /api/lobbies`)
Genera una nueva mesa con ciegas configurables.
*   **Body (Opcional):**
    ```json
    {
      "smallBlind": 25,
      "bigBlind": 50
    }
    ```
*   **Respuesta (210):** Devuelve el ID de la sala (`PK-XXXX`) autogenerado para compartirlo con otros jugadores.

#### 2. Listar Salas Activas (`GET /api/lobbies`)
*   **Respuesta (200):** Lista todas las salas en memoria, mostrando cuántos jugadores hay dentro de cada una.

---

## 🔌 Integración con Socket.io (Tiempo Real)

Para las acciones de juego de cartas y actualizaciones instantáneas, tu cliente móvil debe conectarse a Socket.io.

### Conexión y Autenticación del Socket
Debes pasar el token JWT obtenido durante el Login en la autenticación del socket.
*   **Ejemplo en JavaScript (Cliente):**
    ```javascript
    const socket = io("http://localhost:5000", {
      auth: {
        token: "JWT_TOKEN_AQUÍ"
      }
    });
    ```

### Eventos del Cliente al Servidor (Emit)

1.  **Unirse a una Sala (`join_lobby`)**
    ```javascript
    socket.emit("join_lobby", "PK-A8F2");
    ```
2.  **Toggle de Preparado/Ready (`player_ready`)**
    Indica que estás listo para jugar. Cuando todos los jugadores activos en la sala están listos (mínimo 2), la partida arranca automáticamente.
    ```javascript
    socket.emit("player_ready");
    ```
3.  **Acción del Juego (`game_action`)**
    Envía tu jugada en tu turno.
    *   **Fold:** `{ "action": "fold" }`
    *   **Check:** `{ "action": "check" }`
    *   **Call (Igualar):** `{ "action": "call" }`
    *   **Raise (Subir a un monto total):** `{ "action": "raise", "amount": 100 }`
    ```javascript
    socket.emit("game_action", { action: "raise", amount: 100 });
    ```
4.  **Mensaje de Chat (`chat_message`)**
    ```javascript
    socket.emit("chat_message", "¡Buena mano!");
    ```
5.  **Salir de la Sala (`leave_lobby`)**
    ```javascript
    socket.emit("leave_lobby");
    ```

---

### Eventos del Servidor al Cliente (Listen)

1.  **Actualización de la Mesa (`table_update`)**
    Se emite a todos los jugadores de la sala cada vez que cambia el estado (apuestas, turno, cartas comunitarias, etc.).
    *   *Nota de seguridad:* Las cartas privadas (`cards`) de los otros jugadores están enmascaradas como `["?", "?"]`. Solo podrás ver tus propias cartas.
    *   **Payload recibido:**
        ```json
        {
          "id": "PK-A8F2",
          "stage": "PRE_FLOP", // WAITING, PRE_FLOP, FLOP, TURN, RIVER, SHOWDOWN
          "communityCards": [], // Ej: ["8c", "6d", "2d"]
          "pot": 60,
          "currentHighestBet": 20,
          "minRaise": 40,
          "dealerIndex": 1,
          "sbIndex": 2,
          "bbIndex": 0,
          "currentTurn": 1,
          "showdownResults": null,
          "players": [
            {
              "id": "USER_ID_1",
              "username": "Alice",
              "chips": 980,
              "currentBet": 20,
              "isFolded": false,
              "isAllIn": false,
              "isReady": true,
              "isActive": true,
              "lastAction": "CALL",
              "cards": ["2c", "9h"] // Tus propias cartas son visibles
            },
            {
              "id": "USER_ID_2",
              "username": "Bob",
              "chips": 980,
              "currentBet": 20,
              "isFolded": false,
              "isAllIn": false,
              "isReady": true,
              "isActive": true,
              "lastAction": "CALL",
              "cards": ["?", "?"] // Cartas de otros jugadores enmascaradas
            }
          ]
        }
        ```

2.  **Mensaje de Chat (`chat_message`)**
    *   **Payload recibido:**
        ```json
        {
          "sender": "Alice",
          "text": "¡Buena mano!",
          "timestamp": 1720076045000
        }
        ```

3.  **Resultados de Showdown (`showdown_results` o dentro de `table_update` en la etapa `SHOWDOWN`)**
    Cuando finaliza la ronda, el servidor evalúa las mejores manos de 5 cartas de cada jugador, reparte el bote de fichas (soporta botes divididos y botes secundarios/side pots) y envía las cartas abiertas de todos los jugadores que no foldearon.
    *   **Payload recibido:**
        ```json
        {
          "winners": [
            {
              "playerId": "USER_ID_1",
              "username": "Alice",
              "handName": "Par de Ases",
              "cards": ["Ac", "Ad", "8c", "6d", "2d"],
              "amountWon": 100
            }
          ],
          "allPlayerHands": [
            {
              "playerId": "USER_ID_1",
              "username": "Alice",
              "handName": "Par de Ases",
              "cards": ["Ac", "Ad"],
              "isFolded": false
            },
            {
              "playerId": "USER_ID_2",
              "username": "Bob",
              "handName": "Carta Alta Rey",
              "cards": ["Kc", "Qd"],
              "isFolded": false
            }
          ]
        }
        ```

4.  **Mensaje de Error (`error_message`)**
    Se envía al cliente de manera privada cuando realiza una acción no permitida.
    ```javascript
    socket.on("error_message", (message) => {
      alert("Error: " + message);
    });
    ```

---

## 🐳 Despliegue con Docker y Docker Compose

El proyecto está completamente preparado para ejecutarse dentro de un contenedor Docker aislado y seguro, persistiendo la base de datos en un volumen nombrado.

### Pasos para iniciar con Docker Compose:

1.  **Construir y levantar el contenedor**:
    ```bash
    docker compose up -d --build
    ```
2.  **Ver logs del servidor en tiempo real**:
    ```bash
    docker compose logs -f
    ```
3.  **Detener el servidor**:
    ```bash
    docker compose down
    ```

Al arrancar, el contenedor ejecuta automáticamente `npx prisma migrate deploy` para asegurar que el archivo de base de datos SQLite (`poker.db`) dentro del volumen de Docker esté al día con el último esquema.

