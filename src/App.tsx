import React, { useEffect, useState } from 'react'
import {
  getItems,
  createItem,
  updateItem,
  subscribeToItems,
  Item
} from 'ItemsService'
import {
  signIn,
  signOut,
  getCurrentUser,
  User
} from 'authService'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [newVal, setNewVal] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    // fetch user on load
    getCurrentUser().then(setUser)
  }, [])

  useEffect(() => {
    // if logged in, load items & subscribe
    if (user) {
      loadItems()
      const channel = subscribeToItems(() => {
        loadItems()
      })
      return () => {
        // unsubscribe
        channel.unsubscribe()
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
    try {
      await signIn(email)
      alert('check your inbox')
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSignOut() {
    await signOut()
    setUser(null)
  }

  async function handleCreate() {
    if (!newVal) return
    await createItem(newVal)
    setNewVal('')
  }

  async function handleUpdate(id, val) {
    await updateItem(id, val)
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
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div>
          <input
            type="email"
            placeholder="your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button onClick={handleSignIn}>sign in (otp link)</button>
        </div>
      )}
    </div>
  )
}
