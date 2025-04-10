# AI Translator and Summarizer

ai-translator-summarizer adalah aplikasi yang menggunakan teknologi AI untuk menerjemahkan dan merangkum teks secara otomatis. Aplikasi ini memanfaatkan API OpenAI untuk pemrosesan bahasa alami dan integrasi dengan layanan Google untuk autentikasi pengguna.

## Application Interface
![alt text](image.png)

## Configuration

Before running the application, ensure you have configured the following:

1. **OpenAI API Key**: Set up your OpenAI API key.
2. **Google Client ID and Client Secret**: Obtain these from the Google Developer Console.
3. **NextAuth Secret**: Generate a secret for NextAuth.

You can set these configurations in your environment variables or a `.env` file:

```
OPENAI_API_KEY=your-openai-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
```
