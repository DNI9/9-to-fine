# 9-to-Fine

Welcome to **9-to-Fine**, where productivity meets style! This isn't just another task management app—it's your personal assistant for conquering the day with flair. Organize your tasks, track your time, and vibe to some lofi beats while you're at it. Whether you're a night owl or an early bird, 9-to-Fine has got your back.

## Features

### Task Management

- Create and organize daily tasks
- Drag-and-drop interface for moving tasks between days
- Mark tasks as complete
- Automatic organization by date
- Today's section always visible for quick access

### Time Tracking

- Start, pause, and stop time tracking for each task
- Accurate time tracking persists across browser sessions
- Real-time timer display in HH:MM:SS format
- Total time automatically calculated and saved

### Data Persistence

- Tasks automatically saved to localStorage
- Maintains task state and timing data between sessions
- Robust error handling for storage operations

### User Experience

- Toggle lofi background music for a focused work environment
- Integrated YouTube player for seamless playback
- Switch between light and dark themes
- Persistent theme settings saved in localStorage

## Technical Stack

- **Frontend Framework**: React 19 with TypeScript
- **State Management**: React Hooks (useState, useCallback, useEffect)
- **Drag and Drop**: @hello-pangea/dnd
- **Icons**: react-icons
- **Build Tool**: Vite
- **Development Tools**: ESLint, TypeScript

## Project Structure

```
src/
├── components/
│   ├── DaySection.tsx   # Day-wise task container
│   ├── LofiToggle.tsx   # Lofi mode toggle component
│   ├── TaskInput.tsx    # New task creation form
│   ├── TaskItem.tsx     # Individual task component
│   └── ThemeToggle.tsx  # Theme toggle component
├── types/
│   └── index.ts         # TypeScript interfaces
├── utils/
│   ├── storageUtils.ts  # localStorage management
│   ├── timeUtils.ts     # Time formatting utilities
│   └── youtubePlayer.ts # YouTube player utilities
├── App.tsx              # Main application component
└── App.css             # Application styling
```

## Task Model

```typescript
interface Task {
  id: string; // Unique identifier
  name: string; // Task name
  totalTime: number; // Total time in milliseconds
  startTime: number | null; // Timestamp when timer started
  isRunning: boolean; // Current timer status
  isCompleted: boolean; // Task completion status
  currentDay: string; // Associated date (YYYY-MM-DD)
}
```

## Development

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
