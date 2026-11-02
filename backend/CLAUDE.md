# Backend — Express + TypeScript + Prisma

## Stack
Express, TypeScript (strict), Prisma, Zod, JWT (jsonwebtoken), bcrypt, manual DI via `config/container.ts`

## Layers & Rules
**Controller** → parse with Zod, call service, respond with `SuccessResponseDto`. No logic, no Prisma.  
**Service** → business logic only. Throws `ApiError`. No `req`/`res`, no Prisma.  
**Repository** → Prisma queries only. No logic.  
**Routes** → wire controller + `asyncHandler` + guards. No logic.  
**container.ts** → only place to `new` classes. Only place to use the Prisma singleton from `config/prisma.ts`.

## Key Patterns
- Responses: `SuccessResponseDto.send(res, { message, data, req })` / `.created(...)` — never `res.json()`
- Errors: `throw new ApiError(statusCode, 'message')` — never expose raw errors
- Routes: always wrap handlers with `asyncHandler` — no try/catch in controllers
- Validation: `Dto.parse(req.body)` in controller, export `type XDtoType = z.infer<typeof XDto>`
- Controller methods: arrow functions (preserves `this` binding)
- Auth guard: `authenticate` from `common/guards/jwt.guard.ts`
- Tenant filter: apply `tenantMiddleware` + always include `tenantId` in queries on tenant-scoped models

## JWT
- Access: 15m — `process.env.JWT_SECRET`
- Refresh: 7d — `process.env.JWT_REFRESH_SECRET`
- Payload: `{ userId, email, role, isSuperAdmin, merchantId?, agentId? }`
- Decoded payload on: `req.user`

## New Module Checklist
1. `modules/<name>/` — controller, service, repository, routes, `dto/index.ts`, `types.ts`, `index.ts`
2. Wire in `config/container.ts`: `repo → service → controller`
3. Register router in `routes/index.ts`
4. Wrap all handlers with `asyncHandler`, apply `authenticate` + `tenantMiddleware` where needed

## Do Not
- Call Prisma outside repositories
- Use `res.json()` directly
- Use `console.log`
- Add unrequested fallbacks or abstractions
- Rewrite working code unless asked
- Install packages without checking `common/` first
- Use `any`

## Env
`DATABASE_URL` `JWT_SECRET` `JWT_REFRESH_SECRET` `PORT`

## Commands
```bash
npm run dev | npm run build | npm run start | npm run lint | npm run test
npx prisma migrate dev | npx prisma generate | npx prisma studio
```