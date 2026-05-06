# 🔐 Mutate Tools — Privacy-First Messaging Frontend

Mutate Tools is a Web3-native messaging and social communication frontend built to support dynamic identity mutation, private group collaboration, and end-to-end encrypted conversations.

This repository contains the Next.js frontend client for the Mutate Tools platform, including the embedded technical whitepaper viewer at `/whitepaper`.

## ⭐ Key Highlights

- 💬 Privacy-first chat and group messaging
- 🎭 Disposable identities with moving-target defense
- 🔒 End-to-end encryption powered by modern cryptography
- 🌀 Mixnet-inspired, non-deterministic routing
- 🗝️ Local vault management and device recovery workflows
- 🔑 Google OAuth onboarding with referral integrations

## 📦 What this project includes

- `app/` — Next.js 13+ app directory pages and layouts
- `src/contexts/` — authentication, device/E2EE state, sub-profile identity management
- `src/utils/crypto/` — identity generation, X3DH handshake, group key wrapping, vault encryption
- `public/docs/whitepaper.html` — the platform whitepaper rendered by `/whitepaper`

## 🛠️ Technology Stack

- ⚡ Next.js 16
- ⚛️ React 18
- 📘 TypeScript
- 🎨 Tailwind CSS
- 🔧 Radix UI primitives
- 🎯 Zustand state management
- 🔌 Socket.IO client
- 📡 Axios HTTP client
- 🎬 Framer Motion animations
- 🔐 Google OAuth via `@react-oauth/google`
- 🔑 `tweetnacl` / `tweetnacl-util` for modern cryptography
- 🧮 `crypto-js` for SHA-256 hashing
- 💾 `idb` / IndexedDB for local persistence
- 🖼️ `sharp` for image processing utilities

## 🧬 Core Algorithms and Architecture

Mutate Tools combines several privacy-preserving protocols:

- 🎭 **Identity mutation**: public identity keys and metadata are rotated frequently to prevent long-term correlation.
- 🤝 **X3DH-style handshake**: a three-party Diffie-Hellman key agreement is implemented to establish shared secrets between peers.
- 🔄 **Double Ratchet / ratchet state**: session state is used to encrypt and decrypt messages and group key envelopes with forward secrecy.
- 📦 **Group key encryption**: ephemeral group keys are generated and wrapped individually for each member using `secretbox`.
- 🌐 **Non-deterministic routing**: messages are designed to avoid repeated fixed paths, reducing the effectiveness of traffic analysis.
- 🗑️ **Irreversible deletion**: deleted messages are overwritten at the memory level to make recovery impractical.

## 🛡️ Privacy and Security Features

- 🔒 End-to-end encrypted conversations and private group messaging
- 🗝️ Local cryptographic vault storage with optional passphrase recovery
- 📱 Device-based identity and trusted device management
- 🎭 Disposable conversation identities with no long-term fingerprinting
- 🔑 Client-side key generation and storage using secure browser APIs
- 👻 Minimal metadata exposure through moving-target defense and routed traffic

## 🚀 Installation

1. Clone the repository:

```bash
git clone https://github.com/Mutate-Tools/frontend.git
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables (optional):

Create a `.env.local` file and set:

```env
NEXT_PUBLIC_BACKEND_BASE_URL=https://api.your-backend.com
```

If `NEXT_PUBLIC_BACKEND_BASE_URL` is not set, the frontend defaults to `http://localhost:8080`.

4. Run the development server:

```bash
npm run dev
```

5. Open the app in your browser:

```text
http://localhost:3000
```

## 🏗️ Build and Production

Build the optimized production bundle:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## 📝 Useful Scripts

- ▶️ `npm run dev` — start the development server
- 🔨 `npm run build` — build production assets
- 🚀 `npm start` — run the production server
- ✅ `npm run lint` — run ESLint
- 🖼️ `npm run process-images` — preprocess assets with the included Node script

## 📌 Notes

- 📦 This repository is focused on the frontend client.
- 🔗 The app expects a companion backend service for authentication, key exchange, device linking, and message transport.
- 📄 The whitepaper is available via `/whitepaper` and is served from `public/docs/whitepaper.html`.

## 🤝 Contribute

Contributions are welcome! 🎉 Please open issues or pull requests to improve the privacy architecture, user flows, or cryptographic implementation.
