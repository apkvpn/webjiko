# Security Specification (webjiko)

## 1. Data Invariants
1. Every `Post` document MUST belong to an existing `Category` document (`exists(/databases/$(database)/documents/categories/$(incoming().categoryId))`).
2. Only a verified admin (`isAdmin()` with `request.auth.token.email_verified == true` and bootstrapped admin email `roomfa.ir67@gmail.com` or `admins/{uid}`) may create, update, or delete `categories` or `posts`.
3. Non-admin public visitors (including SSR/SEO REST queries) may only `get` or `list` `posts` where `resource.data.published == true`, and may `get` or `list` `categories`.
4. `authorUid` and `createdAt` are immutable once created (`incoming().authorUid == existing().authorUid`, `incoming().createdAt == existing().createdAt`).
5. `createdAt` and `updatedAt` must equal `request.time` on creation and update respectively.
6. Document IDs `{categoryId}` and `{postId}` must strictly match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters.

## 2. The Dirty Dozen Adversarial Payloads
1. **Unauthenticated Create Post**: Unauthenticated visitor tries `POST /posts/p1` -> `PERMISSION_DENIED`.
2. **Non-Admin Authenticated Create Post**: Signed-in user with another verified email tries `create` in `/posts/p2` -> `PERMISSION_DENIED`.
3. **Unverified Admin Email Spoof**: Signed-in user with `email == 'roomfa.ir67@gmail.com'` and `email_verified == false` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Admin tries creating a post with extra `"isFeaturedSuperAdmin": true` -> `PERMISSION_DENIED` (`hasOnly` rejection).
5. **Orphaned Category Reference**: Admin tries creating a post referencing non-existent `categoryId: "missing-cat"` -> `PERMISSION_DENIED` (`exists()` check).
6. **ID Poisoning Attack**: Attacker tries `get` or `create` at `/posts/../../../../etc/passwd` or 500-char ID -> `PERMISSION_DENIED` (`isValidId` check).
7. **Draft Leak via List Query**: Public visitor attempts `list` on `/posts` without filtering `published == true` -> `PERMISSION_DENIED` (because `allow list` evaluates `resource.data.published == true`).
8. **Draft Leak via Direct Get**: Public visitor attempts `get` on an unpublished draft `/posts/draft-1` -> `PERMISSION_DENIED`.
9. **Immutable Timestamp Tampering**: Admin attempts update changing `createdAt` -> `PERMISSION_DENIED`.
10. **Client-Forged Future Timestamp**: Admin attempts create with `createdAt` set to client date instead of `request.time` -> `PERMISSION_DENIED`.
11. **Array Flood / Type Poisoning**: Admin attempts create with 50 keywords or integer keyword -> `PERMISSION_DENIED` (`size() <= 10` and `keywords[0] is string`).
12. **Self-Assigned Admin Escalation**: Non-admin user tries to write `/admins/{uid}` -> `PERMISSION_DENIED`.
