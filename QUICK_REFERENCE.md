# 🚀 Quick Reference - Add New Endpoint

Use this as a quick prompt template when asking AI to generate new features.

---

## AI Prompt Template

```
I need to add a new feature to my Node.js + TypeScript + TypeORM project.

ARCHITECTURE PATTERN:
- Follow clean architecture with layers: Route → Middleware → Controller → Service → Entity
- Use the existing pattern in the project (see ARCHITECTURE_GUIDELINES.md)

FEATURE REQUEST:
[Describe your feature here. Example: "Add device management with CRUD operations"]

REQUIREMENTS:
1. Create Entity in src/entities/ (if database table needed)
2. Create Zod schema in src/schemas/ with validation rules
3. Create Service in src/services/ with business logic
4. Create Controller in src/controllers/ with HTTP handling
5. Create Routes in src/routes/ (pure configuration)
6. Use singleton pattern (export const service = new Service())
7. Add JSDoc comments to all classes and methods
8. Follow TypeScript strict mode
9. Use proper HTTP status codes (200, 201, 400, 404, 409, 500, 503)
10. Return consistent response format: { success, message?, data, count? }

EXAMPLE STRUCTURE:
- Entity: src/entities/[Name].ts
- Schema: src/schemas/[name].schema.ts
- Service: src/services/[name].service.ts
- Controller: src/controllers/[name].controller.ts
- Route: src/routes/[name].routes.ts

VALIDATION:
- Use Zod for all input validation
- Add validation middleware: validate(schema)
- Export DTO types from schemas

ERROR HANDLING:
- Service: Throw descriptive errors
- Controller: Catch errors and return proper HTTP status
- Log errors with console.error()

Please generate the code following the exact pattern used in:
- src/controllers/sensor.controller.ts
- src/services/sensor.service.ts
- src/schemas/sensor.schema.ts
- src/routes/sensor.routes.ts
```

---

## Quick Checklist

When asking AI to generate code:

**Must Include:**

- [ ] Entity with TypeORM decorators
- [ ] Zod schema with validation
- [ ] Service with business logic (no HTTP)
- [ ] Controller with HTTP handling (no business logic)
- [ ] Routes with `.bind(controller)`
- [ ] JSDoc comments everywhere
- [ ] Singleton exports
- [ ] Proper error handling
- [ ] Consistent response format

**Must Follow:**

- [ ] Layer separation (no mixing)
- [ ] TypeScript strict mode
- [ ] No business logic in controllers
- [ ] No HTTP knowledge in services
- [ ] Use existing middleware (validate)
- [ ] Status codes: 200, 201, 400, 404, 409, 500, 503

---

## Example Quick Prompt

```
Add user authentication feature following the project architecture:

CRUD operations needed:
- POST /auth/register (create user)
- POST /auth/login (authenticate)
- GET /auth/profile (get current user)
- PUT /auth/profile (update profile)

Entity fields:
- id (uuid)
- email (unique, required)
- password (hashed, required)
- name (required)
- createdAt, updatedAt

Validation rules:
- email: valid email format
- password: min 8 characters
- name: min 2 characters

Use bcrypt for password hashing in service layer.
Include proper error handling for duplicate email (409).
```

---

## File Naming Convention

| Layer      | File Name              | Example              |
| ---------- | ---------------------- | -------------------- |
| Entity     | `[Name].ts`            | `User.ts`            |
| Schema     | `[name].schema.ts`     | `user.schema.ts`     |
| Service    | `[name].service.ts`    | `user.service.ts`    |
| Controller | `[name].controller.ts` | `user.controller.ts` |
| Route      | `[name].routes.ts`     | `user.routes.ts`     |

Capitalization:

- Entity: PascalCase class name
- Others: camelCase file name

---

## Standard Response Templates

Copy-paste these:

### Success Response (201 Created)

```typescript
res.status(201).json({
  success: true,
  message: 'Resource created successfully',
  data: result,
});
```

### Success Response (200 OK)

```typescript
res.status(200).json({
  success: true,
  data: result,
});
```

### Error Response (404 Not Found)

```typescript
res.status(404).json({
  success: false,
  error: 'Resource not found',
});
```

### Error Response (409 Conflict)

```typescript
res.status(409).json({
  success: false,
  error: 'Conflict',
  message: 'Resource already exists',
});
```

### Error Response (500 Internal Error)

```typescript
res.status(500).json({
  success: false,
  error: 'Internal server error',
  message: 'Failed to process request',
});
```

---

## Migration Commands

```bash
# After creating entity
npm run migration:generate src/migrations/AddEntityName

# Run migration
npm run migration:run

# Revert if needed
npm run migration:revert
```

---

**See ARCHITECTURE_GUIDELINES.md for full details**
