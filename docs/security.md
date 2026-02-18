# Security

## Authentication
- **Mechanism**: JWT (JSON Web Tokens).
- **Implementation**: Spring Security in `portfolio-manager`.
- **Flow**:
  1. User logs in via GraphQL `login` mutation or REST `/api/v1/auth/login`.
  2. Server validates credentials and returns a JWT.
  3. Client includes JWT in `Authorization: Bearer <token>` header for GraphQL and REST.

## User & Roles
- **User**: Basic authentication entity.
- **Role**: `USER` or `ADMIN` permissions.

## Security Practices
- **Passwords**: Hashed using BCrypt.
- **CORS**: Configured in `WebSecurityConfig`.
- **JWT Secret**: Managed via environment variables.

## Future Roadmaps
- MFA implementation.
- API Rate Limiting.
- Automated security scanning in CI.
