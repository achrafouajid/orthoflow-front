/**
 * Authenticated user types.
 *
 * Derived from the OpenAPI contract — see `core/api/contract.ts`. `UserRole`
 * is no longer hand-written: it comes from `UserResponse.role`, so adding a
 * role in Java's `UserRole` enum surfaces here rather than being missed.
 */
export type { User as AuthUser, LoginRequest, LoginResponse, RegisterRequest } from '../api/contract';

import type { User } from '../api/contract';

/** The roles the server issues, taken from the contract rather than restated. */
export type UserRole = NonNullable<User['role']>;
