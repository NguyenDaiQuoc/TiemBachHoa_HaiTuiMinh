# Firestore Rules Update - Permission Fix

## Issue
The admin pages (News, Blogs, Media) are showing "Missing or insufficient permissions" errors when trying to read data from Firestore.

## Solution
The `firestore.rules` file has been updated to include explicit rules for the new collections:

```plaintext
match /news/{id}    { allow read: if true; allow write: if isAdmin(); }
match /media/{id}   { allow read: if true; allow write: if isAdmin(); }
```

These rules allow:
- **Read**: Anyone can read (public-read, needed for client-side display)
- **Write**: Only admins can create/update/delete (admin-only modification)

## How to Deploy

### Method 1: Using Firebase CLI (Recommended)
```bash
# If you have Firebase CLI installed globally
firebase deploy --only firestore:rules

# Or if installed locally in node_modules
npx firebase deploy --only firestore:rules
```

### Method 2: Using Firebase Console (Web UI)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. Replace the rules with the content from `firestore.rules` file
5. Click **Publish**

### Method 3: Deploy with `firebase init`
```bash
firebase init
# Select "Firestore"
firebase deploy --only firestore:rules
```

## Firestore Rules Changes

**Before:**
```plaintext
match /categories/{id} { allow read: if true; allow write: if isAdmin(); }
match /banners/{id} { allow read: if true; allow write: if isAdmin(); }
match /blogs/{id}   { allow read: if true; allow write: if isAdmin(); }
match /vouchers/{id}{ allow read: if true; allow write: if isAdmin(); }
```

**After:**
```plaintext
match /categories/{id} { allow read: if true; allow write: if isAdmin(); }
match /banners/{id} { allow read: if true; allow write: if isAdmin(); }
match /blogs/{id}   { allow read: if true; allow write: if isAdmin(); }
match /vouchers/{id}{ allow read: if true; allow write: if isAdmin(); }
match /news/{id}    { allow read: if true; allow write: if isAdmin(); }
match /media/{id}   { allow read: if true; allow write: if isAdmin(); }
```

## Collections Access Control

| Collection | Public Read | Admin Write | Notes |
|-----------|------------|------------|-------|
| products | ✅ Yes | ✅ Yes | For storefront display |
| categories | ✅ Yes | ✅ Yes | For navigation |
| banners | ✅ Yes | ✅ Yes | For promotions |
| blogs | ✅ Yes | ✅ Yes | For blog posts |
| vouchers | ✅ Yes | ✅ Yes | For discount codes |
| news | ✅ Yes | ✅ Yes | For announcements |
| media | ✅ Yes | ✅ Yes | For images/videos |
| orders | ✅ Yes (auth) | ✅ Yes | Authenticated users only |
| users | Limited | Limited | User can read own, admin can read all |
| admins | Limited | ✅ Yes | Admin can read own, admin can write |
| warehouse | ✅ Yes (auth) | ✅ Yes | Authenticated users, admin write |
| inventory_in | ✅ Yes (auth) | ✅ Yes | Authenticated users, admin write |

## Testing

After deploying the rules:

1. Go to `/admin/news` - Should load news items without errors
2. Go to `/admin/blogs` - Should load blog posts without errors
3. Go to `/admin/media` - Should load media files without errors
4. Check browser console - No "permission-denied" errors should appear

## Troubleshooting

### Still getting permission-denied errors?

1. **Clear Browser Cache**: Ctrl+Shift+Delete → Clear all
2. **Logout & Re-login**: Ensure you're authenticated as admin
3. **Check User Role**: Go to Firestore → `users` collection → Your document → Check if `role: 'admin'` exists
4. **Verify Rules Published**: Check Firebase Console that rules were published successfully
5. **Wait 1-2 minutes**: Firebase rules can take time to propagate

### Rules deployment failed?

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## References

- [Firebase Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/start)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
