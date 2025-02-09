# Melody - AI-Powered ADHD Support Chatbot

An intelligent chatbot system designed to help adults with ADHD connect with occupational therapists and access support services.

## Features

- 🤖 AI-powered conversational interface
- 👩‍⚕️ Intelligent therapist matching
- 📊 Real-time analytics and performance monitoring
- 🔒 HIPAA-compliant data handling
- 💬 Seamless handoff to human agents
- 📈 Comprehensive feedback system

## Tech Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase
- **AI**: OpenAI GPT-4
- **Security**: DOMPurify, CryptoJS

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file with:
   ```
   VITE_OPENAI_API_KEY=your_openai_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/          # React components
├── utils/              # Utility functions
├── types/              # TypeScript types
├── data/              # Static data
└── lib/               # External library configurations
```

## Key Components

- **ChatMessage**: Handles message display and formatting
- **ChatInput**: User input interface
- **FeedbackWidget**: User feedback collection system

## Security Features

- Input sanitization
- Sensitive data masking
- HIPAA compliance measures
- Row-level security with Supabase

## Analytics and Monitoring

- Response time tracking
- User satisfaction metrics
- Resolution rate analysis
- Performance monitoring

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.