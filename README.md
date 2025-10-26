# Tacto Guide - AI-Powered RAG Chat Application

An intelligent document-aware chat application built with n8n and Lovable Cloud, featuring advanced Retrieval Augmented Generation (RAG) capabilities powered by Weaviate vector database.
We choosed to use only low/no code and vibe coding tools to have a look where the technology is right now and what can you build with it. Now we are really suprised what you can build with these tools. 

## 🚀 Project Overview

We built Tacto Guide as a comprehensive AI chat platform that combines conversational AI with document intelligence. The application allows companies to upload documents,connect emails and store conversations which are then processed and indexed into a vector database (Weaviate), enabling the AI to provide contextual responses based on the uploaded content. This creates a powerful knowledge management and query system. All the company knowledge will never be forgotten. 

**Live Demo**: https://munichhack.lovable.app/

## ✨ Key Features

### Core Functionality

- **AI Chat Interface**: Intelligent conversational AI assistant (Tacto Guide)
- **Document RAG System**: Upload and process documents for context-aware AI responses
- **Multi-Format Support**: Process text files (TXT, JSON, JSONL, CSV), PDFs, images, and office documents
- **Audio Transcription**: Voice-to-text using OpenAI Whisper API
- **Project Management**: Organize conversations into projects with full CRUD operations
- **Chat History**: Persistent conversation storage
- **Real-time Processing**: Live document processing and indexing status updates

### Technical Features

- **Vector Search**: Weaviate integration for semantic document search
- **Binary File Processing**: Automatic text extraction from PDFs and images via OCR
- **Metadata Generation**: AI-powered document categorization and tagging
- **Text Chunking**: Intelligent document segmentation with configurable overlap
- **N8N Integration**: Webhook-based workflow automation
- **User Authentication**: Secure email/password authentication with session management
- **File Storage**: Supabase Storage for document persistence

## 🛠 Technology Stack

### Frontend

- **React 18.3.1** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library (Radix UI)
- **TanStack Query** - Server state management
- **React Router DOM** - Client-side routing
- **Lucide React** - Icon system

### Backend & Infrastructure

- **Lovable Cloud** - Full-stack cloud platform (Supabase-powered)
- **Supabase Auth** - User authentication and authorization
- **Supabase Storage** - File storage and management
- **Supabase Edge Functions** - Serverless backend logic (Deno runtime)
- **PostgreSQL** - Primary database with Row Level Security (RLS)
- **N8N Integration**: Webhook-based workflow automation

### AI & ML Services

- **Weaviate** - Vector database for RAG
- **OpenAI API** - GPT models and Whisper transcription
- **N8N** - Workflow automation platform

### Additional Tools

- **@dnd-kit** - Drag and drop functionality
- **date-fns** - Date manipulation
- **zod** - Schema validation
- **react-hook-form** - Form management

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **bun** package manager
- **Weaviate Instance** - Vector database access
- **OpenAI API Key** - For AI completions and transcription
- **N8N Webhook URL** (optional) - For workflow integration

## 🔧 Installation & Setup

### Cloud usage:

For visiting the project in the cloud just use this link:
https://munichhack.lovable.app/
and sign up :)

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Environment Configuration

The project uses Lovable Cloud which automatically configures Supabase environment variables. The following variables are auto-generated:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` - Project identifier

**Note**: Do not manually edit the `.env` file - it's managed automatically by Lovable Cloud.

### 4. Configure Secrets (Edge Functions)

The following secrets must be configured in Lovable Cloud for Edge Functions:

#### Required Secrets

- `OPENAI_API_KEY` - OpenAI API key for GPT and Whisper
- `WEAVIATE_URL` - Your Weaviate instance URL
- `WEAVIATE_API_KEY` - Weaviate API authentication key

#### Optional Secrets

- Additional integrations can be added via Lovable Cloud settings

**To add secrets**: Navigate to your Lovable project → Settings → Secrets

### 5. Database Setup

The database schema is managed through Supabase migrations located in `supabase/migrations/`. Key tables include:

- `projects` - User project management
- `chats` - Conversation sessions
- `messages` - Chat message history
- `uploaded_files` - Document metadata and processing status

**Note**: Migrations are automatically applied when deployed via Lovable Cloud.

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 🏗 Architecture Overview

### Frontend Architecture

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── AudioBubbles.tsx    # Voice recording UI
│   ├── ChatInput.tsx       # Message input component
│   ├── ChatMessage.tsx     # Message display
│   ├── ChatSidebar.tsx     # Navigation sidebar
│   ├── DocumentUpload.tsx  # File upload interface
│   └── ...
├── pages/              # Route components
│   ├── Index.tsx       # Main chat interface
│   ├── Auth.tsx        # Authentication page
│   └── NotFound.tsx    # 404 page
├── services/           # External service integrations
│   └── n8n.js          # N8N webhook client
├── integrations/       # Backend integrations
│   └── supabase/       # Supabase client & types
└── hooks/              # Custom React hooks
```

### Backend Architecture 


### n8n
our n8n logic is located in the file n8n-Workflow.json

Here is a small explanation of the workflow: 

Our end-to-end workflow works as follows: a prompt can be triggered via Telegram, Gmail (received or CC’d), or a frontend webhook. Users can ask questions or provide information through any of these channels. Files uploaded in the frontend are stored in the VBA database, supporting all relevant formats. The agent analyzes the input, stores any important information, and decides whether a response is needed. If a reply is required, the agent retrieves relevant context from the database and includes it in the response, which is then sent back through the original channel. Once completed, the workflow ends.


```
supabase/functions/
├── upload-to-rag/           # Document processing & RAG indexing
├── process-binary-files/    # PDF/Image text extraction
└── transcribe-audio/        # Audio transcription (Whisper)
```

### Data Flow

1. **Document Upload Flow**:

   ```
   User Upload → Supabase Storage → Edge Function → Text Extraction →
   Metadata Generation (GPT) → Text Chunking → Weaviate Indexing
   ```

2. **Chat Flow**:

   ```
   User Message → N8N Webhook → AI Agent doing Magic→
   RAG Context Retrieval (Weaviate) → Response Generation
   ```

3. **Audio Flow**:
   ```
   Voice Recording → Base64 Encoding → Edge Function →
   OpenAI Whisper API → Transcribed Text → Chat Input
   ```

## 📡 API Documentation

### Edge Functions

#### 1. `upload-to-rag`

**Purpose**: Process and index documents into Weaviate

**Endpoint**: `https://<project-ref>.supabase.co/functions/v1/upload-to-rag`

**Method**: POST

**Authentication**: Required (Bearer token)

**Request Body**:

```typescript
{
  files: Array<{
    name: string;
    content: string;      // Base64 for binary, raw text for text files
    type: string;         // MIME type
    size: number;
    projectId?: string;
    chatId?: string;
  }>
}
```

**Response**:

```typescript
{
  textFiles: Array<{fileName: string}>;
  binaryFiles: Array<{fileName: string, fileId: string}>;
  message: string;
}
```

**Features**:

- Text chunking with configurable overlap (default: 220 chars, 40 overlap)
- GPT-4 metadata generation (title, category, department)
- Weaviate schema auto-creation
- Binary file storage in Supabase Storage
- Support for JSON, JSONL, CSV, and plain text

#### 2. `process-binary-files`

**Purpose**: Extract text from PDFs and images

**Endpoint**: `https://<project-ref>.supabase.co/functions/v1/process-binary-files`

**Method**: POST

**Authentication**: Optional

**Request Body**:

```typescript
{
  fileIds: string[];  // IDs from uploaded_files table
}
```

**Response**:

```typescript
{
  processedFiles: Array<{
    fileId: string;
    success: boolean;
    extractedLength?: number;
    error?: string;
  }>;
}
```

**Supported Formats**:

- PDF (text extraction via pattern matching)
- Images (PNG, JPG, JPEG, WEBP) - uses GPT-4 Vision
- Documents (DOCX, DOC) - basic text extraction

#### 3. `transcribe-audio`

**Purpose**: Convert speech to text

**Endpoint**: `https://<project-ref>.supabase.co/functions/v1/transcribe-audio`

**Method**: POST

**Authentication**: Not required

**Request Body**:

```typescript
{
  audio: string;  // Base64 encoded audio (WebM, MP3, WAV, M4A)
}
```

**Response**:

```typescript
{
  text: string;  // Transcribed text
}
```

**Features**:

- Uses OpenAI Whisper API
- Chunked processing to prevent memory issues
- Supports multiple audio formats

### N8N Webhook Integration

**Endpoint**: `https://customm.app.n8n.cloud/webhook/0f07e71e-d3c2-4cd2-a070-e9679bade1'`

**Method**: POST

**Payload**:

```typescript
{
  textPrompt: string;
  textType: "text";
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  metadata: {
    timestamp: string;
    uploadId: string;
    userAgent: string;
    // ... custom metadata
  };
}
```

**Implementation**: See `src/services/n8n.js`

## 🗄 Database Schema

### `projects` Table

```sql
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- name (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### `chats` Table

```sql
- id (uuid, primary key)
- project_id (uuid, references projects)
- title (text)
- order_index (integer)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### `messages` Table

```sql
- id (uuid, primary key)
- chat_id (uuid, references chats)
- content (text)
- is_user (boolean)
- timestamp (timestamptz)
```

### `uploaded_files` Table

```sql
- id (uuid, primary key)
- user_id (uuid)
- file_name (text)
- file_type (text)
- file_size (integer)
- storage_path (text)
- project_id (uuid, nullable)
- chat_id (uuid, nullable)
- rag_processed (boolean)
- uploaded_at (timestamptz)
```

**Note**: All tables have Row Level Security (RLS) enabled with user-specific policies.

## 🔐 Security

### Authentication

- Email/password authentication via Supabase Auth
- Auto-confirmed email signups (development mode)
- Session persistence with auto-refresh tokens
- Protected routes requiring authentication

### Row Level Security (RLS)

All database tables implement RLS policies:

- Users can only access their own data
- Policies enforce `user_id` matching on all operations
- Storage buckets have user-specific access controls

### API Security

- Edge Functions validate authentication tokens
- CORS headers properly configured
- Sensitive API keys stored as encrypted secrets
- No API keys in frontend code

## 🚀 Deployment

### Via Lovable Platform (Recommended)

1. Navigate to your Lovable project
2. Click **Share** → **Publish**
3. Your app will be deployed automatically

## 📝 Usage Guide

### Creating a Project

1. Log in to the application
2. Click the **+** button in the sidebar
3. Enter a project name
4. Start chatting or uploading documents

### Uploading Documents

1. Open a chat or create a new one
2. Click the document icon in the chat input
3. Select files (TXT, PDF, DOCX, images, etc.)
4. Wait for processing confirmation
5. Documents are now available to the AI for context

### Voice Input

1. Click the microphone icon in chat input
2. Grant microphone permissions
3. Speak your message
4. Click stop when finished
5. Transcription appears in the input field

### Managing Chats

- **Rename**: Hover over chat → Click edit icon
- **Delete**: Hover over chat → Click trash icon
- **Reorder**: Drag and drop chats using grip handle

## 🐛 Troubleshooting

### Documents Not Uploading

- Check Edge Function logs in Lovable Cloud backend
- Verify `WEAVIATE_URL` and `WEAVIATE_API_KEY` secrets
- Ensure Weaviate instance is accessible
- Check file size limits (max varies by plan)

### Audio Transcription Fails

- Verify `OPENAI_API_KEY` is configured
- Check audio format is supported
- Ensure microphone permissions granted
- Review `transcribe-audio` function logs

### Authentication Issues

- Clear browser localStorage
- Check if auto-confirm is enabled in Supabase Auth settings
- Verify email/password meet requirements

### Chat History Not Saving

- Check browser console for errors
- Verify RLS policies allow user access
- Ensure proper authentication state

## 🔮 Future Enhancements

- [ ] Multi-modal AI responses (images, charts)
- [ ] Collaborative projects with team sharing
- [ ] Advanced RAG with re-ranking
- [ ] Export conversations as PDF/Markdown
- [ ] Custom AI model selection
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)

## 📄 License

This project is built on Lovable platform. For licensing information, refer to Lovable's terms of service.

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome. Please open an issue to discuss potential changes.

## 📞 Support & Contact

- **Project Dashboard**: [Lovable Project](https://lovable.dev/projects/279602cc-2c3e-4506-a503-d022c8f48854)
- **Documentation**: [Lovable Docs](https://docs.lovable.dev/)
- **Community**: [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)

---

**Built with ❤️ using [Lovable](https://lovable.dev)**
