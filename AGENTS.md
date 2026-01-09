# CursorCraft-AI Agent Guidelines

This document provides essential information for agentic coding agents operating in this repository. Adhere to these guidelines to ensure consistency, quality, and maintainability across the codebase.

## Project Overview
CursorCraft-AI is a professional-grade React application for creating, editing, and animating custom Windows cursors (.cur and .ani). It features a 32x32 pixel editor with multi-layer support, frame-by-frame animation timeline, and AI-powered generation capabilities using Google's Gemini models.

- **Stack:** React 19, TypeScript, Vite, Tailwind CSS.
- **Icons:** Lucide React.
- **Key Modules:** 
    - `@google/genai`: AI-assisted cursor generation and analysis.
    - `jszip`: Packaging generated cursors into Windows installers.
    - `uuid`: Unique identifier generation for layers and frames.

---

## Commands

### Development & Build
- **Start Dev Server:** `npm run dev` (Vite development server)
- **Build Production:** `npm run build` (Vite production build)
- **Preview Build:** `npm run preview` (Vite local preview of build)

### Verification & Quality Assurance
- **Type Checking:** `npx tsc --noEmit`
- **Linting:** No dedicated linter (e.g., ESLint/Prettier) is currently configured. Follow the established code style strictly.
- **Testing:** No automated test suite exists. Manual verification via `npm run dev` is required for all changes.

---

## Coding Style & Conventions

### 1. General Principles
- **Functional Components:** Always use functional components with React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
- **TypeScript:** Strict typing is mandatory. Avoid `any`. Define interfaces for props and shared data structures in `types.ts`.
- **Indentation:** 4 spaces (consistency is key).
- **Semicolons:** Required at the end of statements.
- **Quotes:** 
    - Single quotes (`'`) for logic, imports, and string literals.
    - Double quotes (`"`) for JSX attributes (Tailwind classes).

### 2. Naming Conventions
- **Files/Components:** `PascalCase.tsx` (e.g., `EditorCanvas.tsx`, `Toolbar.tsx`).
- **Hooks:** `useCamelCase.ts` (e.g., `useHistory.ts`).
- **Utils/Variables/Services:** `camelCase.ts` (e.g., `layerUtils.ts`, `geminiService.ts`).
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `GRID_SIZE`, `DEFAULT_DURATION`).
- **Interfaces/Types:** `PascalCase` (e.g., `GridData`, `Layer`). Interface props should have a `Props` suffix.

### 3. Project Structure
- `components/`: Focused, reusable UI components. Keep logic related to UI rendering here.
- `hooks/`: Custom hooks for shared state or complex logic (e.g., history management).
- `services/`: External API integrations (e.g., AI services).
- `utils/`: Pure functions, binary encoders (.cur/.ani), and persistence logic.
- `types.ts`: Centralized repository for all shared TypeScript definitions.
- `App.tsx`: High-level state orchestrator and main layout.

### 4. Component Structure & Imports
Maintain a clean and consistent import order:
1. React and standard hooks.
2. Third-party libraries (e.g., `lucide-react`, `uuid`).
3. Internal services and custom hooks.
4. Local components.
5. Shared types (usually imported from `../types` or `./types`).
6. Utilities and helper functions.

**Example Component Template:**
```tsx
import React, { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { GridData } from '../types';
import { someUtil } from '../utils/someUtil';

interface MyComponentProps {
    data: GridData;
    onAction: (val: string) => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ data, onAction }) => {
    const [localState, setLocalState] = useState('');

    const handleAction = useCallback(() => {
        onAction(localState);
    }, [localState, onAction]);

    return (
        <div className="flex flex-col space-y-2 p-4 bg-gray-900">
            <h3 className="text-sm font-bold text-white">Title</h3>
            <button onClick={handleAction} className="p-2 bg-brand-500 rounded">
                <Sparkles size={16} />
            </button>
        </div>
    );
};

export default MyComponent;
```

### 5. State Management & Performance
- **Local vs. Global:** Use `useState` for internal component state. Lift state to `App.tsx` only when required for cross-component communication.
- **Optimization:** Use `useMemo` for expensive calculations (e.g., layer composition) and `useCallback` for event handlers passed to children.
- **References:** Use `useRef` for DOM access or values that shouldn't trigger re-renders.

### 6. Styling with Tailwind CSS
- Use utility-first classes for all styling.
- Follow the project's color palette (gray-500-950 for backgrounds/text, brand-400-600 for primary accents).
- Use `relative`, `absolute`, and `z-index` classes carefully for canvas overlays.

---

## Error Handling & Defensive Programming
- **API Calls:** Wrap all asynchronous operations (AI calls, file saves) in `try/catch` blocks.
- **Null Checks:** Always check for `null` or `undefined` before accessing properties of optional props or complex objects.
- **UI Feedback:** Provide visual feedback (loaders, error messages) for long-running or failed operations using components like `Loader2` from `lucide-react`.

## File Operations
- **New Features:** Prefer creating new modular components in `components/` rather than expanding existing ones.
- **Utilities:** Add new logic to `utils/` with clear, descriptive names.
- **Types:** Update `types.ts` whenever introducing new data structures that are used in more than one file.

## AI Integration (services/geminiService.ts)
- All AI logic should reside in the `services/` directory.
- Use structured responses where possible to ensure the application can parse and apply AI-generated data (e.g., layer-separated animation data).
- Ensure sensitive keys are handled via environment variables if applicable (though currently managed via Gemini API keys).

---

## Common Utility Patterns

### 1. Grid to Image Conversion
When sending grid data to the AI or exporting, use the `HTMLCanvasElement` to draw the pixels and then export as base64 or Blob.
```tsx
const canvas = document.createElement('canvas');
canvas.width = 32;
canvas.height = 32;
const ctx = canvas.getContext('2d');
// ... draw grid pixels ...
const base64 = canvas.toDataURL('image/png');
```

### 2. History Management
The application uses a custom `useHistory` hook in `App.tsx` to manage the undo/redo stack for the animation frames. When modifying frames, always use the `set` function provided by `useHistory` to ensure the changes are tracked.

### 3. Layer Composition
Layers are composed in `App.tsx` using the `composeLayers` utility. When rendering the preview or exporting, always use the composite grid rather than an individual layer's grid.

---

## Verification Checklist for Agents
- [ ] Code is strictly typed (no `any`).
- [ ] Indentation is 4 spaces.
- [ ] Components are functional and use hooks correctly.
- [ ] `useMemo`/`useCallback` are used for performance-sensitive logic.
- [ ] New components follow the `PascalCase.tsx` naming and are placed in `components/`.
- [ ] Changes are manually verified using `npm run dev`.
- [ ] `npx tsc --noEmit` passes without errors.
