# Vimovies Dashboard

Dashboard for managing the Vimovies movie database application.

## Development

```bash
# Install dependencies (from root)
pnpm install

# Start development server
pnpm --filter dashboard dev
```

The dashboard will be available at `http://localhost:5173`

## Environment Variables

Create a `.env` file in the dashboard directory:

```env
VITE_API_URL=http://localhost:3002
```

## Build

```bash
pnpm --filter dashboard build
```

The built files will be in the `dist` directory.

## Vercel Deployment

This project is configured for Vercel deployment with the following settings:

- **Framework**: Vite
- **Build Command**: `pnpm --filter dashboard build`
- **Output Directory**: `dist`
- **Environment Variables**: Set `VITE_API_URL` to your production API URL

### Deploying to Vercel

1. Connect your repository to Vercel
2. Set the root directory to `apps/dashboard`
3. Add environment variable `VITE_API_URL` with your production API URL
4. Deploy

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
