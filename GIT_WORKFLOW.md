# Git Workflow Guide - Avoiding Conflicts

## Current Project Structure
Your part: **Delivery Operations** (frontend + backend)
- Frontend: `src/pages/DeliveryPage.jsx`, `src/pages/DeliveryDetailPage.jsx`
- Backend: `src/routes/delivery.js`, `customers.js`, `locations.js`, `products.js`
- Components: `src/components/ui/*` (badge, dialog, select, table, tabs)

## Recommended Workflow

### 1. **Use Feature Branches** (Most Important)
```bash
# Create a new branch for your delivery feature
git checkout -b feature/delivery-operations

# Make your changes...
git add .
git commit -m "feat: add delivery operations feature"

# Push your branch
git push origin feature/delivery-operations
```

### 2. **Before Starting Work Each Day**
```bash
# Switch to main branch
git checkout master

# Pull latest changes from your teammate
git pull origin master

# Switch back to your feature branch
git checkout feature/delivery-operations

# Merge latest changes into your branch
git merge master
# OR use rebase (cleaner history)
git rebase master
```

### 3. **File Organization to Avoid Conflicts**

**Keep your files separate from teammate's:**
- If teammate works on Products, you work on Delivery
- Each feature should have its own route files
- Share only common components

**Your Files (shouldn't conflict):**
```
frontend/src/pages/
  ├── DeliveryPage.jsx          ← YOUR FILE
  ├── DeliveryDetailPage.jsx    ← YOUR FILE
  └── [teammate's pages]        ← DON'T TOUCH

backend/src/routes/
  ├── delivery.js               ← YOUR FILE
  ├── customers.js              ← YOUR FILE
  ├── locations.js              ← YOUR FILE
  ├── products.js               ← YOUR FILE (may conflict if teammate also needs it)
  └── [teammate's routes]       ← DON'T TOUCH
```

**Shared Files (likely to conflict):**
```
frontend/src/
  ├── App.jsx                   ⚠️ BOTH WILL EDIT (routes)
  └── components/ui/*           ⚠️ BOTH MAY ADD

backend/src/
  └── server.js                 ⚠️ BOTH WILL EDIT (routes registration)
```

### 4. **For Shared Files - Coordinate Changes**

**App.jsx** - Add routes in order:
```jsx
// Your teammate's routes (let them add first)
<Route path="/products" element={...} />
<Route path="/inventory" element={...} />

// Your routes (add after)
<Route path="/delivery" element={...} />
<Route path="/delivery/:id" element={...} />
```

**server.js** - Add route imports in order:
```js
// Your teammate's routes
const productRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');

// Your routes (add after)
const deliveryRoutes = require('./routes/delivery');
const customerRoutes = require('./routes/customers');

// Register routes
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/customers', customerRoutes);
```

### 5. **Communication Protocol**

**Before making changes to shared files:**
1. Message teammate: "I'm about to edit App.jsx to add delivery routes"
2. Wait for their confirmation or pull their latest changes
3. Make your changes
4. Commit and push immediately
5. Notify them: "App.jsx updated with delivery routes"

### 6. **Commit Message Convention**
```bash
# Use prefixes to identify who changed what
git commit -m "feat(delivery): add delivery list page"
git commit -m "fix(delivery): correct status badge colors"
git commit -m "chore(delivery): add delivery seed data"

# Teammate uses different prefix
# git commit -m "feat(products): add product management"
```

### 7. **Resolving Conflicts When They Happen**

If you get a conflict:
```bash
# Pull latest changes
git pull origin master

# Git will show conflicts in files like:
<<<<<<< HEAD
// Your changes
=======
// Teammate's changes
>>>>>>> master

# Edit the file to keep both changes:
// Teammate's code
<Route path="/products" element={<ProductsPage />} />

// Your code
<Route path="/delivery" element={<DeliveryPage />} />

# Mark as resolved
git add App.jsx
git commit -m "merge: resolve App.jsx conflict"
```

### 8. **Safe Merge Strategy**

```bash
# When both features are done, merge in order:

# 1. Teammate merges first
# (they do: git checkout master -> git merge feature/products)

# 2. You pull their changes
git checkout master
git pull origin master

# 3. Merge your feature
git merge feature/delivery-operations

# 4. If conflicts, resolve them
# 5. Push to master
git push origin master
```

### 9. **Direct Merge Workflow** (For Collaborators)

```bash
# You work in balaji-working branch
git checkout balaji-working
git add .
git commit -m "feat(delivery): your changes"
git push origin balaji-working

# Teammate works in their branch or master

# When ready to merge:
# 1. Pull latest master
git checkout master
git pull origin master

# 2. Merge your branch
git merge balaji-working

# 3. Resolve any conflicts if needed
# 4. Push to master
git push origin master

# 5. Tell teammate: "Merged delivery to master, please pull"
```

## Quick Commands Reference

```bash
# Start work
git checkout -b feature/delivery-operations

# Save work frequently
git add .
git commit -m "feat(delivery): description"
git push origin feature/delivery-operations

# Get teammate's updates
git checkout master
git pull origin master
git checkout feature/delivery-operations
git merge master

# Finish feature
# Create Pull Request on GitHub
# OR merge directly:
git checkout master
git merge feature/delivery-operations
git push origin master
```

## Files You Should Own (Low Conflict Risk)
✅ `DeliveryPage.jsx`
✅ `DeliveryDetailPage.jsx`
✅ `routes/delivery.js`
✅ `routes/customers.js`
✅ `routes/locations.js`
✅ `prisma/seed.js` (your seed data section)

## Files to Coordinate (High Conflict Risk)
⚠️ `App.jsx` (both add routes)
⚠️ `server.js` (both register routes)
⚠️ `routes/products.js` (if both need it)
⚠️ `components/ui/*` (if both add components)
⚠️ `package.json` (if both install packages)

## Best Practice Summary
1. ✅ Work in separate branches
2. ✅ Pull teammate's changes daily
3. ✅ Communicate before editing shared files
4. ✅ Commit small, commit often
5. ✅ Use descriptive commit messages
6. ✅ Test before merging to master
7. ✅ Use Pull Requests for code review
