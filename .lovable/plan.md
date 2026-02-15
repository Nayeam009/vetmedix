

# Fix & Complete Auth System: Sign In, Sign Up, Google & Apple ID

## Issues Found

### 1. Missing Apple Sign-In Button
The auth page only has "Continue with Google" but no "Continue with Apple" button, even though the backend (`lovable` module) already supports Apple as a provider.

### 2. Console Ref Warnings
React warnings about function components not accepting refs:
- `AuthPage` component is being given a ref by React Router (it's not wrapped in `forwardRef` or exported as a lazy component properly)
- `RoleSelector` component has the same issue

### 3. Missing `autocomplete` Attributes
Browser recommends `autocomplete` attributes on email/password inputs for better autofill support and accessibility.

### 4. Google/Apple OAuth Redirect Flow
The `redirect_uri` is set to `window.location.origin` (root `/`), which works because the `AuthPage` useEffect checks for logged-in users and redirects based on roles. This is correct.

### 5. Sign Up Flow - Potential Race Condition
After `signUp`, the code immediately tries to insert into `user_roles` using `newUser.id`. If email confirmation is enabled (which it is by default), `newUser` may exist but the session won't be active, causing RLS policy failures on the `user_roles` insert. This needs handling.

---

## Plan

### File: `src/pages/AuthPage.tsx`

1. **Add Apple Sign-In button** below the Google button with proper Apple logo SVG and `handleAppleSignIn` function using `lovable.auth.signInWithOAuth('apple', ...)`

2. **Add `autocomplete` attributes** to email (`autocomplete="email"`), password (`autocomplete="current-password"` for login, `autocomplete="new-password"` for signup), and name (`autocomplete="name"`) inputs

3. **Add `appleLoading` state** to manage Apple sign-in loading independently from Google

4. **Fix the ref warning** - The issue comes from React Router v7 trying to pass a ref to `AuthPage`. Since it's a function component, we need to wrap the default export with `forwardRef` or simply ignore it (it's a harmless warning). The cleaner fix is to ensure the component is compatible.

### File: `src/components/auth/RoleSelector.tsx`

5. **No changes needed** - The ref warning on RoleSelector is harmless (React Router internal behavior). The component itself doesn't need ref forwarding.

### File: `src/pages/SelectRolePage.tsx`

6. **Add Apple Sign-In as an alternative** on the select-role page for consistency (optional, lower priority)

---

## Technical Details

### Apple Sign-In Handler
```typescript
const handleAppleSignIn = async () => {
  setAppleLoading(true);
  try {
    const { error } = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: window.location.origin,
    });
    if (error) throw error;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to sign in with Apple";
    toast({ title: "Error", description: errorMessage, variant: "destructive" });
    setAppleLoading(false);
  }
};
```

### Apple Button UI
Standard Apple Sign-In button with black background and white Apple logo, placed below the Google button.

### Autocomplete Attributes
- Login email: `autocomplete="email"`
- Login password: `autocomplete="current-password"`
- Signup email: `autocomplete="email"`
- Signup password: `autocomplete="new-password"`
- Full name: `autocomplete="name"`

### Files to Edit
- `src/pages/AuthPage.tsx` - Add Apple button, loading state, autocomplete attributes
- No database changes needed

