import React, { useEffect, useState } from 'react'
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  subscribeToItems,
  Item
} from './ItemsService'
import {
  signIn,
  signOut,
  getCurrentUser,
  User
} from './authService'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [newVal, setNewVal] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // fetch user on load
    getCurrentUser().then(setUser).catch(console.error)
  }, [])

  useEffect(() => {
    // if logged in, load items & subscribe
    if (user) {
      loadItems()
      let subscription: { unsubscribe: () => void }
      
      const setupSubscription = async () => {
        subscription = await subscribeToItems((payload) => {
          setItems(currentItems => {
            switch (payload.type) {
              case 'INSERT':
                return [...currentItems, payload.new]
              case 'UPDATE':
                return currentItems.map(item => 
                  item.id === payload.new.id ? payload.new : item
                )
              case 'DELETE':
                return currentItems.filter(item => 
                  item.id !== payload.old.id
                )
              default:
                return currentItems
            }
          })
        })
      }
      
      setupSubscription()
      
      return () => {
        if (subscription) {
          subscription.unsubscribe()
        }
      }
    }
  }, [user])

  async function loadItems() {
    try {
      const data = await getItems()
      setItems(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSignIn() {
    if (!email) return
    setError(null)
    setIsLoading(true)
    try {
      await signIn(email)
      alert('Check your email for the login link')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    setUser(null)
  }

  async function handleCreate() {
    if (!newVal) return
    try {
      setError(null)
      await createItem(newVal)
      setNewVal('')
      // Remove loadItems call since we'll get the update via subscription
    } catch (err) {
      console.error('Failed to create item:', err)
      setError(err instanceof Error ? err.message : 'Failed to create item')
    }
  }

  async function handleUpdate(id: string, val: string) {
    await updateItem(id, val)
  }

  async function handleDelete(id: string) {
    await deleteItem(id)
  }

  return (
    <div>
      <h1>cerakote minimal helpdesk</h1>
      {user ? (
        <>
          <div>welcome {user.email}!</div>
          <button onClick={handleSignOut}>sign out</button>
          <div>
            <input
              placeholder="new value"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
            />
            <button onClick={handleCreate}>create item</button>
          </div>
          <ul>
            {items.map(item => (
              <li key={item.id}>
                <input
                  value={item.value}
                  onChange={(e) => handleUpdate(item.id, e.target.value)}
                />
                <button onClick={() => handleDelete(item.id)}>delete</button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div>
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <button 
            onClick={handleSignIn} 
            disabled={isLoading || !email}
          >
            {isLoading ? 'Sending...' : 'sign in (otp link)'}
          </button>
        </div>
      )}
    </div>
  )
}
