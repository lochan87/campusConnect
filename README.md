# CampusConnect - Real-Time College Bulletin

A real-time platform where students can see everything happening on campus — from official events and lost items to funny memes, food stall alerts, and quick polls. It's a mix of Reddit + Instagram Stories + College Notice Board, but only for your campus community.

## 🚀 Features

### Core Features
- **Live Feed**: Chronological or trending feed for all campus updates
- **Real-time Updates**: Instant notifications via WebSockets
- **Location & Filter System**: Filter posts by building, department, or general area
- **Anonymity Toggle**: Post with name or anonymously
- **Polls & Quick Votes**: Create and participate in campus polls
- **Memes Board**: Dedicated space for campus-related memes
- **Push Notifications**: Instant alerts for important updates

### Post Categories
- 🎉 **Events** (seminars, fests, sports)
- 🛍 **Lost & Found**
- 🍔 **Food Stalls / Canteen Specials**
- 😂 **Memes**
- 📢 **Announcements**

### AI Features
- **Event Summaries**: AI-generated summaries using Gemini API
- **Content Moderation**: Automatic content filtering
- **Campus Digest**: Weekly AI-generated campus activity summaries

## 🏗 Tech Stack

### Frontend
- **React 18** with modern hooks
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.io Client** for real-time updates
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **Node.js** with Express.js
- **Socket.io** for WebSocket connections
- **Firebase Firestore** for database
- **Firebase Admin SDK** for server-side operations
- **Gemini AI API** for content generation
- **Joi** for validation
- **Multer** for file uploads

### Real-time Features
- **WebSockets** for instant updates
- **Real-time notifications**
- **Live voting on polls**
- **Typing indicators**

## 📁 Project Structure

```
campusConnect/
├── backend/
│   ├── config/
│   │   └── firebase.js          # Firebase configuration
│   ├── middleware/
│   │   └── validation.js        # Request validation
│   ├── routes/
│   │   ├── posts.js            # Post-related routes
│   │   ├── polls.js            # Poll-related routes
│   │   └── users.js            # User-related routes
│   ├── services/
│   │   ├── geminiService.js    # AI service integration
│   │   └── websocket.js        # WebSocket service
│   ├── package.json
│   ├── server.js               # Main server file
│   └── .env.example            # Environment variables template
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/         # Layout components
│   │   ├── context/            # React Context providers
│   │   ├── pages/              # Page components
│   │   ├── services/           # API and Socket services
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── shared/                     # Shared utilities (future)
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project
- Gemini AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campusConnect
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

   Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Configure your environment variables:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
   
   # Gemini AI Configuration
   GEMINI_API_KEY=your-gemini-api-key
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

   Create `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

4. **Firebase Setup**
   - Create a Firebase project
   - Enable Firestore database
   - Create a service account and download the JSON key
   - Extract the credentials for your `.env` file

5. **Gemini AI Setup**
   - Get a Gemini API key from Google AI Studio
   - Add it to your backend `.env` file

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health

## 🎮 Demo Mode

The application includes a demo mode for testing without Firebase setup:

1. Click "Try Demo" on the login page
2. Explore all features with sample data
3. Real-time features work in demo mode

## 📱 Features in Detail

### Live Feed
- Infinite scroll with real-time updates
- Category and location filtering
- Upvote/downvote system
- Image support for posts

### Polls System
- Multiple choice polls
- Real-time vote counting
- Vote visualization with progress bars
- Poll expiration handling

### Real-time Features
- Instant post updates
- Live voting results
- Connection status indicator
- Typing indicators (planned)

### AI Integration
- Event summaries from recent posts
- Content moderation
- Campus activity digests
- Meme analysis (planned)

## 🔧 API Endpoints

### Posts
- `GET /api/posts` - Get posts with filters
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts/:id/vote` - Vote on post
- `DELETE /api/posts/:id` - Delete post

### Polls
- `GET /api/polls` - Get polls
- `POST /api/polls` - Create poll
- `POST /api/polls/:id/vote` - Vote on poll
- `PUT /api/polls/:id/close` - Close poll

### Users
- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login user
- `GET /api/users/:id` - Get user profile
- `GET /api/users/leaderboard/:campusId` - Get leaderboard

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode Support**: Automatic based on system preference
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Animations**: Smooth transitions using Framer Motion
- **Real-time Indicators**: Connection status and live updates

## 🔒 Security Features

- **Input Validation**: Server-side validation with Joi
- **Rate Limiting**: Prevent spam and abuse
- **Content Moderation**: AI-powered content filtering
- **Sanitization**: XSS protection for user content

## 🚀 Deployment

### Backend Deployment
- Deploy to platforms like Heroku, Railway, or DigitalOcean
- Set up environment variables in production
- Configure Firebase for production use

### Frontend Deployment
- Build the React app: `npm run build`
- Deploy to Vercel, Netlify, or similar platforms
- Configure environment variables for production API

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Check the documentation
- Review the demo mode for examples

## 🎯 Future Enhancements

- [ ] Direct messaging system
- [ ] Event RSVP functionality
- [ ] Push notifications for mobile
- [ ] File sharing system
- [ ] Advanced search with filters
- [ ] Campus map integration
- [ ] Mobile app development
- [ ] Video post support
- [ ] Live streaming for events

## 📊 Performance

- Real-time updates with minimal latency
- Optimized image handling
- Efficient pagination
- Caching strategies for better performance

---

**CampusConnect** - Bringing your campus community together in real-time! 🎓✨
