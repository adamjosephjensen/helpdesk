import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Item } from './itemsService'
import { itemsService } from './supabase'
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
  const updateTimeoutRef = useRef<number>()

  useEffect(() => {
    // fetch user on load
    getCurrentUser().then(setUser).catch(console.error)
  }, [])

  useEffect(() => {
    // if logged in, load items & subscribe
    if (user) {
      console.log('User authenticated, setting up items and subscription...')
      let subscription: { unsubscribe: () => void } | null = null
      let isActive = true // Track if effect is still active
      
      const setup = async () => {
        try {
          // Load items first
          await loadItems()
          
          // Only set up subscription if component is still mounted
          if (isActive) {
            console.log('Setting up subscription...')
            subscription = itemsService.subscribeToItems((payload) => {
              if (!isActive) return // Don't update state if unmounted
              
              console.log('Received update:', payload)
              setItems(currentItems => {
                switch (payload.type) {
                  case 'INSERT':
                    if (!payload.new) return currentItems
                    // Check if we already have this item
                    if (currentItems.some(item => item.id === payload.new!.id)) {
                      return currentItems
                    }
                    return [...currentItems, payload.new]
                  
                  case 'UPDATE':
                    if (!payload.new) return currentItems
                    return currentItems.map(item => 
                      item.id === payload.new!.id ? payload.new : item
                    )
                  
                  case 'DELETE':
                    if (!payload.old) return currentItems
                    return currentItems.filter(item => 
                      item.id !== payload.old!.id
                    )
                  
                  default:
                    return currentItems
                }
              })
            })
          }
        } catch (error) {
          console.error('Error during setup:', error)
          // If setup fails, try again after a delay
          if (isActive) {
            setTimeout(setup, 2000)
          }
        }
      }

      setup()
      
      return () => {
        console.log('Cleaning up...')
        isActive = false
        if (subscription) {
          subscription.unsubscribe()
          subscription = null
        }
      }
    }
  }, [user])

  async function loadItems() {
    try {
      console.log('Loading items...')
      const data = await itemsService.getItems()
      console.log('Items loaded:', data)
      setItems(data || [])
    } catch (err) {
      console.error('Error loading items:', err)
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
      console.log('Creating new item:', newVal)
      await itemsService.createItem(newVal)
      setNewVal('')
    } catch (err) {
      console.error('Failed to create item:', err)
      setError(err instanceof Error ? err.message : 'Failed to create item')
    }
  }

  // Create a debounced update function
  const debouncedUpdate = useCallback((id: string, value: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    updateTimeoutRef.current = window.setTimeout(() => {
      itemsService.updateItem(id, value)
    }, 500)
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  async function handleDelete(id: string) {
    await itemsService.deleteItem(id)
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
                  onChange={(e) => {
                    // Update local state immediately
                    setItems(currentItems =>
                      currentItems.map(i =>
                        i.id === item.id ? { ...i, value: e.target.value } : i
                      )
                    )
                    // Debounce the server update
                    debouncedUpdate(item.id, e.target.value)
                  }}
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
