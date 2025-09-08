---
title: Push Events
---

# Push Events

Liquid provides a comprehensive push events system that publishes real-time events to either **Redis Pub/Sub** or **RabbitMQ** message queues. This allows you to build reactive features and integrate with external services based on user actions and system events.

## Overview

When enabled, Liquid publishes events to your configured message queue whenever significant actions occur in the system. These events can be consumed by your applications to trigger notifications, analytics, webhooks, or other reactive behaviors.

## Configuration

### Enabling Push Events

To enable push events, you need to configure the following options in your `app-config.service.json`:

```json
{
  "privilege.can-use-push-events": true,
  "system.queue-adapter": "redis",
  "system.push-events": [
    "user.follow",
    "user.unfollow",
    "user.follow-request",
    "user.create",
    "user.login",
    "user.logout",
    "user.logout-all",
    "email.send"
  ]
}
```

### Queue Adapters

Liquid supports two message queue adapters:

#### Redis Pub/Sub

```json
{
  "system.queue-adapter": "redis",
  "privilege.can-use-cache": true,
  "redis.host": "127.0.0.1",
  "redis.port": 6379,
  "redis.channel-name": "liquid"
}
```

#### RabbitMQ

```json
{
  "system.queue-adapter": "rabbitmq",
  "privilege.can-use-rabbitmq": true,
  "rabbitmq.connectionString": "amqp://localhost:5672",
  "rabbitmq.channel-name": "liquid"
}
```

## Backend Configuration

### Redis Configuration Options

All Redis configuration options for Liquid:

```json
{
  "privilege.can-use-cache": true,
  "redis.host": "127.0.0.1",
  "redis.port": 6379,
  "redis.username": "",
  "redis.password": "",
  "redis.db": 0,
  "redis.key-prefix": "",
  "redis.channel-name": "liquid"
}
```

**Configuration Details:**

| Option                    | Type    | Default       | Description                                     |
| ------------------------- | ------- | ------------- | ----------------------------------------------- |
| `privilege.can-use-cache` | boolean | `true`        | Enables Redis caching and pub/sub functionality |
| `redis.host`              | string  | `"127.0.0.1"` | Redis server hostname or IP address             |
| `redis.port`              | number  | `6379`        | Redis server port number                        |
| `redis.username`          | string  | `""`          | Redis username (Redis 6.0+)                     |
| `redis.password`          | string  | `""`          | Redis password for authentication               |
| `redis.db`                | number  | `0`           | Redis database number (0-15)                    |
| `redis.key-prefix`        | string  | `""`          | Prefix for all Redis keys                       |
| `redis.channel-name`      | string  | `"liquid"`    | Channel name for pub/sub events                 |

#### Redis Security Configuration

For production deployments, configure Redis with authentication:

**Redis Configuration (`redis.conf`):**

```conf
# Enable authentication
requirepass your-strong-password

# Bind to specific interface (not 0.0.0.0 in production)
bind 127.0.0.1

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

**Liquid Configuration:**

```json
{
  "redis.host": "your-redis-host",
  "redis.port": 6379,
  "redis.password": "your-strong-password"
}
```

### RabbitMQ Configuration Options

All RabbitMQ configuration options for Liquid:

```json
{
  "privilege.can-use-rabbitmq": true,
  "rabbitmq.connectionString": "amqp://username:password@localhost:5672",
  "rabbitmq.channel-name": "liquid"
}
```

**Configuration Details:**

| Option                       | Type    | Default                   | Description                     |
| ---------------------------- | ------- | ------------------------- | ------------------------------- |
| `privilege.can-use-rabbitmq` | boolean | `false`                   | Enables RabbitMQ functionality  |
| `rabbitmq.connectionString`  | string  | `"amqp://localhost:5672"` | Full RabbitMQ connection string |
| `rabbitmq.channel-name`      | string  | `"liquid"`                | Queue name for events           |

#### RabbitMQ Connection String Format

The connection string supports various formats:

```bash
# Basic connection
amqp://localhost:5672

# With authentication
amqp://username:password@localhost:5672

# With vhost
amqp://username:password@localhost:5672/vhost

# SSL/TLS connection
amqps://username:password@localhost:5671

# With connection parameters
amqp://username:password@localhost:5672?heartbeat=60&connection_timeout=10000
```

#### RabbitMQ Security Configuration

For production deployments, configure secure RabbitMQ connections:

**Production Configuration:**

```json
{
  "rabbitmq.connectionString": "amqp://liquid_user:strong_password@rabbitmq-server:5672/liquid_vhost"
}
```

### Event Filtering

You can control which events are published by configuring the `system.push-events` array. Only events listed in this array will be published to the queue.

### Event Prefixing

You can add a prefix to all event names by setting:

```json
{
  "system.push-events.prefix": "myapp."
}
```

This will prefix all events (e.g., `user.login` becomes `myapp.user.login`).

## Available Events

### User Events

#### user.create

Published when a new user account is created.

**Data Structure:**

```json
{
  "id": "uuid-v4",
  "name": "user.create",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "verified": false,
      "role": "user",
      "credits": 100,
      "scope": ["user:profile:read"],
      "createdAt": "2023-01-01T10:00:00.000Z"
    }
  }
}
```

#### user.login

Published when a user successfully logs in (both password and OAuth logins).

**Data Structure:**

```json
{
  "id": "uuid-v4",
  "name": "user.login",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

#### user.logout

Published when a user logs out from a single session.

**Data Structure:**

```json
{
  "id": "uuid-v4",
  "name": "user.logout",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

#### user.logout-all

Published when a user logs out from all sessions.

**Data Structure:**

```json
{
  "id": "uuid-v4",
  "name": "user.logout-all",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Social Events

#### user.follow

Published when a user successfully follows another user (for public profiles).

**Data Structure:**

```json
{
  "id": "uuid-v4",
  "name": "user.follow",
  "data": {
    "source": "follower_user_id",
    "target": "followed_user_id"
  }
}
```

#### user.follow-request

Published when a user requests to follow a private profile.

**Data Structure:**

```json
{
  "id": "uuid-v4",
  "name": "user.follow-request",
  "data": {
    "source": "requester_user_id",
    "target": "target_user_id"
  }
}
```

#### user.unfollow

Published when a user unfollows another user.

**Data Structure:**

```json
{
  "id": "uuid-v4",
  "name": "user.unfollow",
  "data": {
    "source": "unfollower_user_id",
    "target": "unfollowed_user_id"
  }
}
```

### Email Events

#### email.send

Published when an email is sent through the Pusher email adapter. This is useful for implementing custom email sending logic.

**Data Structure:**

```json
{
  "id": "uuid-v4",
  "name": "email.send",
  "data": {
    "email": {
      "to": "recipient@example.com",
      "from": {
        "email": "noreply@yourapp.com",
        "name": "Your App"
      },
      "subject": "Welcome to Your App",
      "text": "Plain text content",
      "html": "<h1>HTML content</h1>",
      "templateId": "template_id",
      "dynamicTemplateData": {
        "name": "John",
        "verification_url": "https://yourapp.com/verify?token=abc123"
      },
      "timestamp": "2023-01-01T10:00:00.000Z"
    }
  }
}
```

:::info

The `email.send` event is only published when using the `pusher` email adapter. Configure this by setting `system.email-adapter` to `"pusher"` in your backend configuration.

:::

## Event Structure

All events follow a consistent structure:

```json
{
  "id": "unique-uuid-v4-identifier",
  "name": "event.name",
  "data": {
    // Event-specific data
  }
}
```

- **id**: A unique UUID v4 identifier for each event
- **name**: The event name (with optional prefix)
- **data**: Event-specific payload containing relevant information

## Consuming Events

### Redis Pub/Sub Example (Node.js)

```javascript
const Redis = require("ioredis");
const redis = new Redis({
  host: "localhost",
  port: 6379,
});

redis.subscribe("liquid");

redis.on("message", (channel, message) => {
  const event = JSON.parse(message);

  switch (event.name) {
    case "user.login":
      console.log(`User ${event.data.user.username} logged in`);
      break;
    case "user.follow":
      console.log(`User ${event.data.source} followed ${event.data.target}`);
      break;
    case "email.send":
      // Custom email sending logic
      sendCustomEmail(event.data.email);
      break;
  }
});
```

### RabbitMQ Example (Node.js)

```javascript
const amqp = require("amqplib");

async function consumeEvents() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  const queue = "liquid";

  await channel.assertQueue(queue);

  channel.consume(queue, (message) => {
    if (message) {
      const event = JSON.parse(message.content.toString());

      switch (event.name) {
        case "user.create":
          console.log(`New user created: ${event.data.user.username}`);
          break;
        case "user.logout-all":
          console.log(`User ${event.data.user.username} logged out from all sessions`);
          break;
      }

      channel.ack(message);
    }
  });
}

consumeEvents();
```

## Dependencies

| Dependency | Required | Used For                          |
| ---------- | -------- | --------------------------------- |
| Redis      | Optional | Redis Pub/Sub adapter and caching |
| RabbitMQ   | Optional | RabbitMQ message queue adapter    |

### Redis Dependencies

**For Redis Pub/Sub:**

- Ensure `privilege.can-use-cache` is enabled
- Redis connection must be properly configured
- Uses the same Redis instance as Liquid's caching system

### RabbitMQ Dependencies

**For RabbitMQ:**

- Ensure `privilege.can-use-rabbitmq` is enabled
- RabbitMQ connection string must be properly configured
- Independent message queue system

:::tip

Events are published asynchronously and won't block the main API response. However, if the message queue is unavailable, events will be silently dropped. Ensure your message queue infrastructure is reliable for production use.

:::

:::warning

Event payloads may contain sensitive user information. Ensure your message queue and event consumers are properly secured, especially in production environments.

:::

