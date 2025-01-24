# Testing Strategy

This project follows JB Rainsberger's principle of "Integration Tests are a Scam" so "Test One Thing At A Time." We separate tests into distinct layers, each with its own responsibility.

# 🎯 Areas of Excellence:
1. Domain tests are pure and fast
1. Service tests verify collaboration without knowing about implementation
1. epository tests focus on the contract with Supabase
1. No test knows about implementation details of layers below it

We created a maintainable, testable architecture. The factorial complexity of integration testing has been replaced with linear complexity in each layer.

## Architecture for Testability

We follow both Ports and Adapters (Hexagonal) and Clean Architecture principles:

1. **Core Domain** (`src/domain/`)
   - Contains pure business logic and types
   - Has no dependencies on external concerns
   - Defines interfaces (ports) that external layers must implement

2. **Service Layer** (`src/services/`)
   - Orchestrates business operations
   - Depends only on domain interfaces
   - Acts as a use case layer in Clean Architecture

3. **Adapters** (`src/repositories/`)
   - Implement ports defined by domain
   - Handle external concerns (e.g., Supabase)
   - Easily swappable (e.g., could replace Supabase with Firebase)

This architecture enables dependency injection, making our code:
- Highly testable in isolation
- Loosely coupled
- Easy to modify without breaking existing code

## Why Integration Tests are a Scam

As JB Rainsberger explains, integration tests are a scam because:
1. They give a false sense of confidence
2. They test too many things at once, making failures hard to diagnose
3. They grow factorially with system complexity (and factorials eat exponentials for breakfast!)
4. They're slow and brittle, leading to "test suite bankruptcy"

Instead, we use:
- Focused unit tests for business logic
- Collaboration tests for boundaries
- Contract tests for external dependencies

## Test Structure

### Domain Tests (`src/domain/__tests__/ticket.test.ts`)
- Tests validation logic
- Pure business rules
- No dependencies
- Fast and deterministic

### Service Tests (`src/services/__tests__/ticketService.test.ts`)
- Tests service collaboration with repository
- Verifies business operations
- Uses mocked repository
- Focuses on orchestration and business workflows

### Repository Tests (`src/repositories/__tests__/ticketRepository.test.ts`)
- Tests Supabase integration
- Verifies data persistence
- Uses mocked Supabase client
- Ensures correct database operations

## Why This Approach?

We avoid integrated UI tests because:
1. They are brittle and prone to breaking
2. They mix multiple concerns (UI, business logic, data persistence)
3. They are slow and non-deterministic
4. They make it hard to identify the source of failures

Instead, we test each layer in isolation, which:
1. Makes tests faster and more reliable
2. Provides better failure isolation
3. Makes the codebase easier to maintain and refactor
4. Follows the Single Responsibility Principle

## Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode during development
yarn test:watch

# Run tests for a specific file
yarn test path/to/test.ts
``` 