# CollabSpace — Real-Time Collaboration Platform

A full-stack real-time collaboration platform built with Django + Next.js. Multiple users can chat instantly, edit shared notes simultaneously, and see each other's presence — all without refreshing the page.

---

## Screenshots

> Run the app and add screenshots here

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Next.js Frontend (Port 3000)                                    │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │   Auth   │  │Dashboard │  │Workspace │  │ Note Editor  │    │
│  │  Pages   │  │  Page    │  │  Page    │  │  (WS live)   │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
│       │              │              │                │            │
│  AuthContext   API (axios)     WebSockets          WS hooks      │
└───────┼──────────────┼──────────────┼────────────────┼───────────┘
        │    REST API  │              │   WebSocket    │
        ▼              ▼              ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│  Django Backend (Port 8000)                                      │
│                                                                  │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌─────────────┐  │
│  │  Users   │  │ Workspaces │  │   Chat    │  │    Notes    │  │
│  │   App    │  │    App     │  │ Consumer  │  │  Consumer   │  │
│  │ JWT Auth │  │ REST + WS  │  │ WebSocket │  │  WebSocket  │  │
│  └──────────┘  └────────────┘  └─────┬─────┘  └──────┬──────┘  │
│                                       │                │         │
│  ┌───────────────────────────────────┐│                │         │
│  │  Django Channels (ASGI)          ││                │         │
│  │  InMemoryChannelLayer             ││                │         │
│  └───────────────────────────────────┘│                │         │
│                                        │                │         │
│  ┌─────────────────────────────────────────────────────┘         │
│  │  Notifications Consumer + Presence Consumer                   │
│  └───────────────────────────────────────────────────────────────│
│                                                                  │
│                      SQLite Database                             │
└──────────────────────────────────────────────────────────────────┘
```

### WebSocket Flow

```
Client connects → JWT token validated in middleware → Joins channel group
Client sends message → Consumer receives → Saves to DB → Broadcasts to group
All group members receive broadcast → UI updates in real time
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | Django 6.x |
| REST API | Django REST Framework |
| WebSockets | Django Channels 4.x (ASGI) |
| Auth | JWT via `djangorestframework-simplejwt` |
| Channel layer | In-Memory (dev) / Redis (prod) |
| Frontend | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| HTTP client | Axios |
| Icons | Lucide React |
| Toasts | react-hot-toast |
| Database | SQLite (dev) / PostgreSQL (prod) |

---

## Features

### Core
- **User Auth** — Sign up, log in, log out with JWT tokens; protected routes
- **Workspaces** — Create or join workspaces via invite code; delete your own
- **Real-Time Chat** — Instant messaging via WebSocket; typing indicators; message history
- **File Sharing** — Upload and share files within any workspace chat
- **Collaborative Notes** — Multiple users edit the same note simultaneously; changes broadcast live
- **Notifications** — Real-time alert delivery via personal WebSocket channel
- **Online Presence** — See who's online in the Members tab; status updates via WebSocket

### Advanced
- **Version History** — Every note save creates a snapshot; browse and restore any previous version
- **Typing Indicators** — Shows who is currently typing in chat
- **Auto-Reconnect** — WebSocket hooks automatically reconnect on drop

---

## Project Structure

```
real-time-collaboation-platform/
├── backend/
│   ├── config/           # Django project settings, URLs, ASGI
│   ├── users/            # Custom User model, JWT auth endpoints
│   ├── workspaces/       # Workspace + Member models, REST views
│   ├── chat/             # Message model, ChatConsumer (WS), file upload
│   ├── notes/            # Note + NoteVersion models, NoteConsumer (WS)
│   ├── notifications/    # Notification model, PresenceConsumer (WS)
│   ├── requirements.txt
│   └── manage.py
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── auth/login/       # Login page
    │   │   ├── auth/signup/      # Signup page
    │   │   ├── dashboard/        # Workspace list
    │   │   └── workspace/[id]/
    │   │       ├── page.tsx      # Workspace (chat/notes/members tabs)
    │   │       └── notes/[noteId]/page.tsx  # Live note editor
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── NotificationPanel.tsx
    │   │   └── workspace/
    │   │       ├── ChatPanel.tsx
    │   │       ├── NotesPanel.tsx
    │   │       └── MembersPanel.tsx
    │   ├── contexts/AuthContext.tsx
    │   ├── hooks/useWebSocket.ts
    │   └── lib/
    │       ├── api.ts            # Axios + WS URL helpers
    │       └── types.ts          # TypeScript interfaces
    └── package.json
```

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 20+
- npm 10+

### Backend Setup

```bash
cd backend

# Create and activate virtualenv
python3 -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# (Optional) Create an admin user
python manage.py createsuperuser

# Start the ASGI server (serves both HTTP and WebSocket)
python manage.py runserver
```

The backend runs on **http://localhost:8000**

### Frontend Setup

```bash
cd frontend

# Install dependencies (requires Node 20+)
npm install

# Start development server
npm run dev
```

The frontend runs on **http://localhost:3000**

### Environment Variables

**frontend/.env.local** (already created):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Sign up |
| POST | `/api/auth/login/` | Log in (returns JWT) |
| POST | `/api/auth/logout/` | Invalidate refresh token |
| GET/PATCH | `/api/auth/me/` | Get / update profile |
| GET/POST | `/api/workspaces/` | List / create workspaces |
| GET | `/api/workspaces/<id>/` | Workspace detail |
| POST | `/api/workspaces/join/` | Join by invite code |
| POST | `/api/workspaces/<id>/leave/` | Leave workspace |
| GET | `/api/workspaces/<id>/members/` | List members |
| GET | `/api/chat/<ws_id>/messages/` | Chat history |
| POST | `/api/chat/<ws_id>/upload/` | Share a file |
| GET/POST | `/api/notes/<ws_id>/` | List / create notes |
| GET/PUT/DELETE | `/api/notes/detail/<id>/` | Note CRUD |
| GET | `/api/notes/detail/<id>/versions/` | Version history |
| GET | `/api/notifications/` | List notifications |
| POST | `/api/notifications/mark-read/` | Mark as read |

## WebSocket Endpoints

| Path | Purpose |
|------|---------|
| `ws/chat/<workspace_id>/` | Real-time workspace chat |
| `ws/notes/<note_id>/` | Collaborative note editing |
| `ws/notifications/` | Personal notifications + presence |
| `ws/presence/<workspace_id>/` | Online member presence |

All WebSocket connections authenticate via `?token=<access_token>` query param.

---

## Real-Time Implementation

### How it works

1. **JWT Middleware** — A custom `JWTAuthMiddleware` wraps all WebSocket connections, extracts the JWT from the query string, verifies it, and attaches the user to the scope before any consumer code runs.

2. **Channel Groups** — Each workspace chat gets a group named `chat_<workspace_id>`. Every connected client joins this group on connect. A broadcast to the group reaches all clients instantly.

3. **Chat flow:**
   ```
   User types → sends {type: "chat_message", content: "..."} over WS
   → Consumer saves Message to DB
   → Consumer calls group_send to broadcast to chat_<id>
   → All connected clients receive the broadcast
   → Frontend appends message to UI without refresh
   ```

4. **Notes collaboration:**  
   Every keystroke (debounced 600ms) sends `{type: "note_update", title, content}` over WS.  
   The consumer saves a `NoteVersion` snapshot, updates the `Note`, then broadcasts to all other editors.

5. **Presence:**  
   On WebSocket connect/disconnect, the `PresenceConsumer` updates `user.is_online` in the DB and broadcasts a `presence_update` event to all workspace groups the user belongs to. The frontend Members tab reflects changes in real time.

6. **Typing indicators:**  
   The chat consumer relays `typing` events to the group, excluding the sender. The frontend displays "X is typing…" with a 3-second auto-clear.

7. **Auto-reconnect:**  
   The `useWebSocket` hook retries the connection every 3 seconds if the socket closes unexpectedly.
