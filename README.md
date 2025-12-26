# Express + TypeORM + MQTT Project

A Node.js backend application built with Express, TypeORM, and MQTT.js.

## 🚀 Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeORM** - ORM for TypeScript and JavaScript
- **PostgreSQL** - Database
- **MQTT.js** - MQTT client for Node.js
- **TypeScript** - Type-safe JavaScript

## 📁 Project Structure

```
test-kerja/
├── src/
│   ├── config/
│   │   ├── database.ts      # TypeORM configuration
│   │   └── mqtt.ts          # MQTT service
│   ├── entities/
│   │   └── User.ts          # Sample User entity
│   ├── routes/
│   │   ├── user.routes.ts   # User CRUD routes
│   │   └── mqtt.routes.ts   # MQTT routes
│   └── app.ts               # Main application
├── .env.example             # Environment variables template
├── tsconfig.json            # TypeScript configuration
├── nodemon.json             # Nodemon configuration
└── package.json             # Dependencies and scripts
```

## 🔧 Installation

1. **Clone or navigate to the project directory**

2. **Install dependencies** (already done):

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your configuration:

   - Database credentials (PostgreSQL)
   - MQTT broker URL and credentials

4. **Set up PostgreSQL database**:
   - Create a database in PostgreSQL
   - Update the `.env` file with your database credentials

## 🏃 Running the Application

### Development Mode (with auto-reload):

```bash
npm run dev
```

### Build for Production:

```bash
npm run build
```

### Start Production Server:

```bash
npm start
```

## 📡 API Endpoints

### Health Check

- **GET** `/` - Server status and available endpoints

### User Routes

- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create new user
- **PUT** `/api/users/:id` - Update user
- **DELETE** `/api/users/:id` - Delete user

### MQTT Routes

- **POST** `/api/mqtt/publish` - Publish message to MQTT topic

  ```json
  {
    "topic": "test/topic",
    "message": "Hello MQTT"
  }
  ```

- **POST** `/api/mqtt/subscribe` - Subscribe to MQTT topic
  ```json
  {
    "topic": "test/topic"
  }
  ```

## 🔌 MQTT Setup

### Local MQTT Broker (Optional)

If you don't have an MQTT broker, you can use Mosquitto:

```bash
# Install Mosquitto (Windows)
# Download from: https://mosquitto.org/download/

# Run Mosquitto broker
mosquitto -v

# Or use a public broker for testing
# Update MQTT_BROKER_URL in .env to: mqtt://test.mosquitto.org
```

## 📝 Environment Variables

Required environment variables (see `.env.example`):

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=your_database

MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=express-mqtt-client
```

## 🗄️ Database Migrations

TypeORM will auto-sync entities in development mode. For production, use migrations:

```bash
# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

## 🧪 Testing the Application

### Test Health Endpoint:

```bash
curl http://localhost:3000
```

### Test User Creation:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Test MQTT Publish:

```bash
curl -X POST http://localhost:3000/api/mqtt/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "test/hello",
    "message": "Hello from Express!"
  }'
```

## 📚 Additional Resources

- [Express Documentation](https://expressjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 🤝 Contributing

Feel free to contribute to this project by submitting pull requests or reporting issues.

## 📄 License

ISC
