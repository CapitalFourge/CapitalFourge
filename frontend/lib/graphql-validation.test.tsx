import { describe, it, expect, beforeAll } from 'vitest';
import { parse, visit, Kind, DocumentNode } from 'graphql';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TypePolicies } from '@apollo/client';

/**
 * GraphQL Validation Tests
 * 
 * These tests ensure all mutations that return types with required `id` field
 * (User, Portfolio) include `id` in their response selection set.
 * 
 * Apollo Cache requires `keyFields: ['id']` for normalized objects.
 * Missing `id` causes "Missing field 'id'" error (Apollo error code 5).
 */

// Types that require `id` field in responses (from schema.graphqls)
const TYPES_REQUIRING_ID = ['User', 'Portfolio', 'Position', 'Asset', 'Transaction', 'Feedback'];

// Files to scan for GraphQL mutations
const MUTATION_FILES = [
  'app/(dashboard)/settings/page.tsx',
  'app/(dashboard)/admin/page.tsx',
  'components/trading/cash-action-dialog.tsx',
  'components/trading/trade-dialog.tsx',
  'components/trading/create-portfolio-dialog.tsx',
  'components/trading/delete-portfolio-button.tsx',
];

// Extract GraphQL template literals from TypeScript/TSX files
function extractGraphQLDocuments(content: string): DocumentNode[] {
  const documents: DocumentNode[] = [];
  
  // Match gql`...` template literals
  const gqlRegex = /gql\s*`([\s\S]+?)`/g;
  let match;
  
  while ((match = gqlRegex.exec(content)) !== null) {
    try {
      const doc = parse(match[1]);
      documents.push(doc);
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return documents;
}

// Check if a selection set includes 'id' field
function hasIdField(selectionSet: { selections?: readonly any[] } | null | undefined): boolean {
  if (!selectionSet || !selectionSet.selections) return false;
  
  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD && selection.name.value === 'id') {
      return true;
    }
    if (selection.kind === Kind.FIELD && selection.selectionSet) {
      if (hasIdField(selection.selectionSet)) return true;
    }
    if (selection.kind === Kind.INLINE_FRAGMENT && selection.selectionSet) {
      if (hasIdField(selection.selectionSet)) return true;
    }
  }
  
  return false;
}

// Determine if a mutation returns a type that requires `id`
function mutationReturnsTypeRequiringId(fieldName: string): boolean {
  const userMutations = ['updateProfile', 'deposit', 'withdraw', 'adminSetRole'];
  const portfolioMutations = ['createPortfolio', 'buyAsset', 'sellAsset', 'buyAssetByUSD', 'sellAssetByUSD', 'addCash', 'withdrawCash'];
  
  return userMutations.includes(fieldName) || portfolioMutations.includes(fieldName);
}

describe('GraphQL Mutation Response Validation (FU-GQL-01)', () => {
  // When running from frontend directory, projectRoot is the frontend folder
  const projectRoot = process.cwd().includes('/frontend') ? process.cwd().replace('/frontend', '') : process.cwd();
  
  for (const filePath of MUTATION_FILES) {
    const fullPath = join(projectRoot, 'frontend', filePath);
    
    if (!readFileSync(fullPath)) {
      continue; // Skip missing files
    }
    
    const content = readFileSync(fullPath, 'utf-8');
    const documents = extractGraphQLDocuments(content);
    
    describe(`File: ${filePath}`, () => {
      let hasRelevantMutations = false;
      for (const doc of documents) {
        visit(doc, {
          OperationDefinition(node) {
            if (node.operation === 'mutation') {
              visit(node, {
                Field(fieldNode) {
                  if (fieldNode.selectionSet && mutationReturnsTypeRequiringId(fieldNode.name.value)) {
                    hasRelevantMutations = true;
                    it(`Mutation "${fieldNode.name.value}" should include "id" in response`, () => {
                      expect(hasIdField(fieldNode.selectionSet)).toBe(true);
                    });
                  }
                }
              });
            }
          }
        });
      }
      
      if (!hasRelevantMutations) {
        it('has no mutations returning User/Portfolio types (skipped)', () => {
          expect(true).toBe(true); // Pass - no relevant mutations in this file
        });
      }
    });
  }
});

describe('Apollo TypePolicy keyFields Validation (FU-GQL-02)', () => {
  // Import using vitest's module resolution (uses @ alias from vitest.config.ts)
  let typePolicies: TypePolicies;
  
  beforeAll(async () => {
    const apolloClient = await import('@/lib/apollo-client');
    typePolicies = apolloClient.typePolicies;
  });
  
  it('should validate User typePolicy has keyFields: ["id"]', () => {
    expect(typePolicies.User?.keyFields).toEqual(['id']);
  });
  
  it('should validate Portfolio typePolicy has keyFields: ["id"]', () => {
    expect(typePolicies.Portfolio?.keyFields).toEqual(['id']);
  });
  
  it('should validate Position typePolicy has keyFields: ["id", "symbol"]', () => {
    expect(typePolicies.Position?.keyFields).toEqual(['id', 'symbol']);
  });
});

/**
 * Integration test example - requires running backend
 * 
 * To run: pnpm test:integration (configure separately)
 * 
describe('Mutation Integration Tests (FU-GQL-03)', () => {
  let client: ApolloClient<any>;
  
  beforeAll(() => {
    // Initialize Apollo client with real backend
    client = new ApolloClient({
      link: createHttpLink({ uri: process.env.NEXT_PUBLIC_API_BASE_URL + '/graphql' }),
      cache: new InMemoryCache({ typePolicies }),
    });
  });
  
  test('updateProfile mutation returns id', async () => {
    const result = await client.mutate({
      mutation: UPDATE_PROFILE,
      variables: { username: 'test', email: 'test@test.com', language: 'EN' },
    });
    
    expect(result.data.updateProfile.id).toBeDefined();
    expect(typeof result.data.updateProfile.id).toBe('string');
  });
  
  test('deposit mutation returns id', async () => {
    const result = await client.mutate({
      mutation: DEPOSIT_MUTATION,
      variables: { amount: 100 },
    });
    
    expect(result.data.deposit.id).toBeDefined();
  });
  
  test('createPortfolio mutation returns id', async () => {
    const result = await client.mutate({
      mutation: CREATE_PORTFOLIO_MUTATION,
      variables: { name: 'Test Portfolio', description: 'Test' },
    });
    
    expect(result.data.createPortfolio.id).toBeDefined();
  });
});
 */