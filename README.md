<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1RoNdv1lpFpzWu_AEFdx8NvjF-RYd7rCV

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your `GEMINI_API_KEY` for AI features
   - Add your Supabase credentials:
     ```
     GEMINI_API_KEY=your_gemini_api_key_here
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
3. Set up Supabase:
   - Create a new project at [Supabase](https://app.supabase.com)
   - Go to SQL Editor and run the SQL from `supabase-setup.sql` to create the `car_entries` table
   - Get your project URL and anon key from Settings > API
4. Run the app:
   `npm run dev`
