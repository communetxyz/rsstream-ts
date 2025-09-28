# Generic Distributed Reactive Networked Protocol Architecture - React Design Guide

This guide outlines the architecture pattern used to build peer-to-peer applications where multiple participants can reactively share, process, and compose data structures in real-time using React.

This repository uses Holster.js (Gun.js wrapper) with React 18, custom validation patterns, and SEA encryption. It uses npm and JavaScript.

Follow these steps to implement a distributed reactive networked protocol in React:

## Step 1: Define Data Structures with Zod Schemas

All data structures are defined using Zod schemas for runtime validation and TypeScript type inference. This ensures data integrity when receiving data from the network or user input. Zod schemas also provide the TypeScript types used throughout the application, keeping validation and types in sync.

**Action**: Create Zod schemas for all your data types before implementing any network or state logic.

```javascript
import { z } from 'zod'

// Core data schemas
const UserSchema = z.object({
  username: z.string().regex(/^\w+$/, "Username must contain only numbers, letters and underscore"),
  email: z.string().email(),
  name: z.string().min(1, "Display name required"),
  pub: z.string(),
  epub: z.string(),
  host: z.string().url(),
  feeds: z.number().int().min(0),
  subscribed: z.number().int().min(0)
})

const FeedSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  description: z.string().optional(),
  html_url: z.string().url().optional(),
  language: z.string().optional(),
  image: z.string().url().optional(),
  subscriber_count: z.number().int().min(0).optional(),
  items: z.record(z.string(), z.record(z.string(), z.any())).optional()
})

const GroupSchema = z.object({
  key: z.string(),
  feeds: z.array(z.string().url()),
  count: z.number().int().min(0),
  latest: z.number().int().min(0),
  text: z.string(),
  author: z.string(),
  timestamp: z.number().int().min(0)
})

const ItemSchema = z.object({
  key: z.string(),
  title: z.string().optional(),
  content: z.string(),
  author: z.string(),
  category: z.array(z.string()).nullable(),
  enclosure: z.object({
    photo: z.record(z.string(), z.string()).optional(),
    audio: z.record(z.string(), z.boolean()).optional(),
    video: z.record(z.string(), z.boolean()).optional()
  }).nullable(),
  permalink: z.string().url(),
  guid: z.string(),
  timestamp: z.number().int(),
  feedUrl: z.string().url(),
  feedTitle: z.string(),
  feedImage: z.string().url().optional(),
  url: z.string().url()
})

// Network protocol schemas
const CapacitiesSchema = z.record(z.string(), z.any())
const TreeSchema = z.record(z.string(), z.any())
const SogfSchema = z.record(z.string(), z.any())

// Infer TypeScript types from schemas
type User = z.infer<typeof UserSchema>
type Feed = z.infer<typeof FeedSchema>
type Group = z.infer<typeof GroupSchema>
type Item = z.infer<typeof ItemSchema>
type Capacities = z.infer<typeof CapacitiesSchema>
```

### Migration Steps from Current Validation:

**Step 1a: Replace Manual Validation Functions**

```javascript
// BEFORE: Manual validation in Register.js
const register = () => {
  if (!username) {
    setMessage("Please choose a username")
    return
  }
  if (!/^\w+$/.test(username)) {
    setMessage("Username must contain only numbers, letters and underscore")
    return
  }
  if (!email) {
    setMessage("Please provide your email")
    return
  }
  // ... rest of validation
}

// AFTER: Zod validation
const register = () => {
  const result = UserSchema.pick({ username: true, email: true }).safeParse({
    username,
    email
  })
  
  if (!result.success) {
    setMessage(result.error.issues[0].message)
    return
  }
  
  // Continue with validated data
  const validatedData = result.data
  // ... rest of logic
}
```

**Step 1b: Add Zod to Package Dependencies**

```bash
cd browser
npm install zod
```

**Step 1c: Create Validation Utilities**

```javascript
// utils/validation.js
import { z } from 'zod'

export const validateAndSetError = (schema, data, setErrorCallback) => {
  const result = schema.safeParse(data)
  if (!result.success) {
    setErrorCallback(result.error.issues[0].message)
    return null
  }
  return result.data
}

export const validateNetworkData = (schema, data, fallback = null) => {
  const result = schema.safeParse(data)
  if (!result.success) {
    console.error('Network data validation failed:', result.error)
    return fallback
  }
  return result.data
}
```

## Step 2: Create State Hooks for Data Sources

We rely on React hooks (useState, useReducer, custom hooks) for reactive state management.

Create state hooks for all data that is loaded from the network or modified by the user. Your components will update these state values.

**Categorize into two types:**

### User Data (Component State):

Data that the current user owns and modifies:

- `const [userTree, setUserTree] = useState()` _(Holster: user.get('tree'))_
- `const [userSogf, setUserSogf] = useState()` _(derived from tree)_
- `const [userCapacities, setUserCapacities] = useState()` _(Holster: user.get('capacities'))_
- `const [userDesiredComposeFrom, setUserDesiredComposeFrom] = useState()` _(Holster: user.get('desiredComposeFrom'))_
- `const [userDesiredComposeInto, setUserDesiredComposeInto] = useState()` _(Holster: user.get('desiredComposeInto'))_
- `const [userObjectAttributes, setUserObjectAttributes] = useState()` _(Holster: ~ourId/objectName/objectAttributes)_

### Network Data (Component State):

Data received from other network participants:

- `const [networkCapacities, setNetworkCapacities] = useState(new Map())` _(Holster: ~contributorId/capacities for each **mutual contributor**)_
- `const [networkCapacityShares, setNetworkCapacityShares] = useState(new Map())` _(Holster: ~contributorId/capacityShares/ourId for each **mutual contributor**)_
- `const [networkDesiredComposeFrom, setNetworkDesiredComposeFrom] = useState(new Map())` _(Holster: ~contributorId/desiredComposeFrom for each **mutual contributor**)_
- `const [networkDesiredComposeInto, setNetworkDesiredComposeInto] = useState(new Map())` _(Holster: ~contributorId/desiredComposeInto for each **mutual contributor**)_
- `const [userIds, setUserIds] = useState([])` _(Holster: usersList.map() for **all users**)_
- `const [userNamesCache, setUserNamesCache] = useState(new Map())` _(Holster: usersList.map() + ~userId/alias for **all users**)_
- `const [usersList, setUsersList] = useState([])` _(Holster: usersList.map() for **all users**)_
- `const [networkObjectAttributes, setNetworkObjectAttributes] = useState(new Map())` _(Holster: ~contributorId/objectName/objectAttributes for each **mutual contributor**)_

## Step 3: Set Up Holster-Path Subscriptions with useEffect

Set up subscriptions to the holster-path using useEffect hooks to reactively stream the value at that path. For each subscription:

1. **SEA.decrypt()** the incoming data if encrypted
2. **Validate** against appropriate Zod schema before updating state
3. **Only update** the state if the incoming data is different from what is already stored
4. **Determine scopes**: Scopes can themselves be state values making it easy to subscribe to only those parts of the holster.js graph that concern us for the specific data we wish to update

### Network Subscription Patterns:

**Contributors Subscribe Pattern** _(triggers on contributors state changes)_:

```javascript
useEffect(() => {
  if (!contributors.length) return
  
  contributors.forEach(contributorId => {
    // SOGF subscriptions: (Holster: ~contributorId/sogf for each **all contributors**) → updates recognitionCache
    user.get([contributorId, 'sogf']).on(async (data) => {
      if (!data) return
      
      try {
        const decrypted = await holster.SEA.decrypt(data, secret)
        const validatedSogf = validateNetworkData(SogfSchema, decrypted)
        
        if (validatedSogf) {
          setRecognitionCache(prev => new Map(prev.set(contributorId, validatedSogf)))
        }
      } catch (error) {
        console.error(`Failed to process SOGF data for ${contributorId}:`, error)
      }
    }, true)
  })
}, [contributors])
```

**Mutual Contributors Subscribe Pattern** _(triggers on mutualContributors state changes)_:

```javascript
useEffect(() => {
  if (!mutualContributors.length) return
  
  mutualContributors.forEach(contributorId => {
    // Capacity subscriptions: (Holster: ~contributorId/capacities for each **mutual contributor**) → updates networkCapacities
    user.get([contributorId, 'capacities']).on(async (data) => {
      if (!data) return
      
      try {
        const decrypted = await holster.SEA.decrypt(data, secret)
        const validatedCapacities = validateNetworkData(CapacitiesSchema, decrypted)
        
        if (validatedCapacities) {
          setNetworkCapacities(prev => new Map(prev.set(contributorId, validatedCapacities)))
        }
      } catch (error) {
        console.error(`Failed to process capacities for ${contributorId}:`, error)
      }
    }, true)
    
    // Share subscriptions: (Holster: ~contributorId/capacityShares/ourId for each **mutual contributor**) → updates networkCapacityShares
    user.get([contributorId, 'capacityShares', ourId]).on(async (data) => {
      if (!data) return
      
      try {
        const decrypted = await holster.SEA.decrypt(data, secret)
        const validatedShares = validateNetworkData(CapacitiesSchema, decrypted) // Reuse schema or create SharesSchema
        
        if (validatedShares) {
          setNetworkCapacityShares(prev => new Map(prev.set(contributorId, validatedShares)))
        }
      } catch (error) {
        console.error(`Failed to process capacity shares for ${contributorId}:`, error)
      }
    }, true)
  })
}, [mutualContributors])
```

## Step 4: Create Computed Values with useMemo and Custom Hooks

This is where the main protocol architecturing occurs. Create computed values using useMemo that compute relationships and transformations from your base state:

### Core Computed Values:

```javascript
// Equivalent to Svelte derived stores
const nodesMap = useMemo(() => {
  if (!tree) return new Map()
  // Compute nodes from tree
  return computeNodesFromTree(tree)
}, [tree])

const contributors = useMemo(() => {
  if (!tree) return []
  // Extract contributors from tree
  return extractContributors(tree)
}, [tree])

const allKnownContributors = useMemo(() => {
  return [...contributors, ...Object.keys(networkCapacities)]
}, [contributors, networkCapacities])

const userNetworkCapacitiesWithShares = useMemo(() => {
  // Combine user capacities with network shares
  return combineCapacitiesWithShares(userCapacities, networkCapacityShares)
}, [userCapacities, networkCapacityShares])

const mutualRecognition = useMemo(() => {
  // Compute mutual recognition from recognition cache
  return computeMutualRecognition(recognitionCache, ourId)
}, [recognitionCache, ourId])

const mutualContributors = useMemo(() => {
  return contributors.filter(id => mutualRecognition.has(id))
}, [contributors, mutualRecognition])
```

### Custom Hooks for Complex Computed State:

```javascript
// Custom hook equivalent to multiple derived stores
const useProtocolState = (userTree, networkData) => {
  const providerShares = useMemo(() => {
    return computeProviderShares(userTree, networkData)
  }, [userTree, networkData])
  
  const subtreeContributorMap = useMemo(() => {
    return computeSubtreeContributorMap(userTree, contributors)
  }, [userTree, contributors])
  
  const capacityShares = useMemo(() => {
    return computeCapacityShares(providerShares, subtreeContributorMap)
  }, [providerShares, subtreeContributorMap])
  
  return { providerShares, subtreeContributorMap, capacityShares }
}
```

### Composition Analysis (Computed):

```javascript
const compositionAnalysis = useMemo(() => {
  return {
    feasibleComposeFrom: computeFeasibleComposeFrom(userCapacities, networkCapacities),
    feasibleComposeInto: computeFeasibleComposeInto(userDesiredComposeInto, networkDesiredComposeInto),
    mutualDesireOurCapacities: computeMutualDesireOurCapacities(userCapacities, networkDesiredComposeFrom),
    mutualDesireTheirCapacities: computeMutualDesireTheirCapacities(networkCapacities, userDesiredComposeFrom),
    mutualFeasibleOurCapacities: computeMutualFeasibleOurCapacities(userCapacities, networkCapacities),
    mutualFeasibleTheirCapacities: computeMutualFeasibleTheirCapacities(networkCapacities, userCapacities)
  }
}, [userCapacities, networkCapacities, userDesiredComposeFrom, userDesiredComposeInto, networkDesiredComposeFrom, networkDesiredComposeInto])
```

## Step 5: Determine Network Persistence Points

Determine which of these state values/computed values must be accessed by others in the network, and ensure you put them at the corresponding holster-path.

**Action**: For each piece of data that needs network visibility:

1. **SEA.encrypt** what you wish to put at the holster-path
2. **Create indexable computed values** that make data more easily discoverable by the network
3. **Example**: Index by contributor so others can look up themselves in your data and subscribe to only what they care about

```javascript
// Persist computed state to network
useEffect(() => {
  if (!userCapacitiesWithShares || isLoadingCapacities) return
  
  const persistCapacities = async () => {
    const encrypted = await holster.SEA.encrypt(userCapacitiesWithShares, user.is)
    user.get('capacities').put(encrypted, (err) => {
      if (err) console.error('Failed to persist capacities:', err)
    })
  }
  
  persistCapacities()
}, [userCapacitiesWithShares, isLoadingCapacities])

// Create indexable data for network discovery
useEffect(() => {
  if (!capacityShares) return
  
  Object.entries(capacityShares).forEach(async ([contributorId, shares]) => {
    const encrypted = await holster.SEA.encrypt(shares, user.is)
    user.get('capacityShares').next(contributorId).put(encrypted, (err) => {
      if (err) console.error('Failed to persist capacity shares:', err)
    })
  })
}, [capacityShares])
```

## Step 6: Implement Loading States for Race Condition Prevention

Critical for preventing infinite loops and race conditions in reactive network architecture:

### Loading States (useState):

```javascript
// Prevent persistence loops during network data loading
const [isLoadingCapacities, setIsLoadingCapacities] = useState(false)
const [isLoadingTree, setIsLoadingTree] = useState(false)
const [isLoadingSogf, setIsLoadingSogf] = useState(false)
const [isRecalculatingTree, setIsRecalculatingTree] = useState(false)
const [recognitionCache, setRecognitionCache] = useState(new Map()) // updated by SOGF subscriptions
```

### Key Functions:

1. **Prevent Persistence Loops**: Skip `persist()` calls when data is being loaded from network
2. **Avoid Premature Calculations**: Skip expensive recalculations on incomplete data
3. **Maintain Data Integrity**: Prevent local changes from overwriting incoming network data

```javascript
// Example: Prevent persistence during loading
useEffect(() => {
  if (isLoadingCapacities) return // Skip persistence during loading
  
  // Safe to persist user changes
  persistUserCapacities(userCapacities)
}, [userCapacities, isLoadingCapacities])

// Example: Debounce expensive calculations
useEffect(() => {
  if (isRecalculatingTree) return
  
  setIsRecalculatingTree(true)
  const timeoutId = setTimeout(() => {
    // Perform expensive tree recalculation
    const newTree = recalculateTree(currentTree, networkData)
    setUserTree(newTree)
    setIsRecalculatingTree(false)
  }, 300) // Debounce for 300ms
  
  return () => clearTimeout(timeoutId)
}, [currentTree, networkData, isRecalculatingTree])
```

## React-Specific Patterns

### Custom Hooks for Reusable Logic:

```javascript
// Custom hook for network subscriptions with Zod validation
const useNetworkSubscription = (path, schema, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    if (!user.is) return
    
    setLoading(true)
    setError(null)
    
    user.get(path).on(async (incoming) => {
      if (!incoming) {
        setLoading(false)
        return
      }
      
      try {
        const decrypted = await holster.SEA.decrypt(incoming, user.is)
        const validatedData = validateNetworkData(schema, decrypted)
        
        if (validatedData) {
          setData(validatedData)
          setError(null)
        } else {
          setError('Data validation failed')
        }
      } catch (error) {
        console.error('Network subscription error:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }, true)
  }, dependencies)
  
  return { data, loading, error }
}

// Usage example:
const { data: userCapacities, loading, error } = useNetworkSubscription(
  ['user', 'capacities'], 
  CapacitiesSchema, 
  [user.is]
)
```

### useReducer for Complex State Management:

```javascript
// Similar to the groups reducer in Display.js
const protocolReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_CONTRIBUTOR':
      return {
        ...state,
        contributors: [...state.contributors, action.payload],
        contributorMap: new Map(state.contributorMap.set(action.payload.id, action.payload))
      }
    case 'UPDATE_CAPACITIES':
      return {
        ...state,
        capacities: action.payload
      }
    case 'RESET':
      return initialProtocolState
    default:
      return state
  }
}

const [protocolState, dispatch] = useReducer(protocolReducer, initialProtocolState)
```

---

**Design Principle**: Always validate incoming data against Zod schemas before updating state to ensure data integrity across the distributed network.

## Migration Roadmap: From Manual Validation to Zod

### Phase 1: Setup and Core Schemas (Week 1)

1. **Install Zod**
   ```bash
   cd browser
   npm install zod
   ```

2. **Create Schema Definitions**
   - Create `src/schemas/index.js` with all core schemas
   - Define User, Feed, Group, Item, and protocol schemas
   - Export TypeScript types using `z.infer`

3. **Create Validation Utilities**
   - Create `src/utils/validation.js` with helper functions
   - Implement `validateAndSetError` and `validateNetworkData`

### Phase 2: Component-Level Validation (Week 2-3)

1. **Migrate Form Components**
   - Replace manual validation in `Register.js`
   - Replace manual validation in `Login.js`
   - Replace manual validation in `AddFeed.js`
   - Replace manual validation in `UpdatePassword.js`

2. **Update Error Handling**
   - Standardize error messages using Zod's built-in messages
   - Create consistent error display patterns

### Phase 3: Network Data Validation (Week 4-5)

1. **Update Network Subscriptions**
   - Migrate `App.js` feed subscriptions to use Zod
   - Migrate `Display.js` group subscriptions to use Zod
   - Add validation to all Holster `.on()` callbacks

2. **Server-Side Validation**
   - Add Zod validation to `server/app.js` endpoints
   - Validate incoming data before processing
   - Return structured error responses

### Phase 4: Advanced Features (Week 6)

1. **Create Custom Hooks**
   - Implement `useNetworkSubscription` with Zod validation
   - Create `useValidatedForm` hook for form handling
   - Add `useProtocolState` for complex state management

2. **Add TypeScript Support** (Optional)
   - Convert `.js` files to `.ts`
   - Use inferred types from Zod schemas
   - Add strict type checking

### Specific File Migration Checklist:

**High Priority (Core Validation):**
- [ ] `src/components/Register.js` - User registration validation
- [ ] `src/components/Login.js` - Login form validation  
- [ ] `src/components/AddFeed.js` - Feed URL validation
- [ ] `src/App.js` - Network data validation for feeds/accou