# Spark Backend

This is the backend for the Spark application. It relies on both vercel to host the server and on Supabase to handle the database and the cloud functions and CRON jobs.

## Vercel server

### Development

To run the server locally, you need to have Node.js installed. Then, you can install the dependencies and start the server:

```bash
yarn install
vercel dev
```

### Deployment

To deploy the server to Vercel, you just need to push your changes to the main branch. Vercel will automatically build and deploy the application.

## Supabase

### Setting up Supabase

Initialize your Supabase project by creating a new project on the [Supabase dashboard](https://app.supabase.io/). Once your project is created, you can connect it to your local environment.
You will need to set up the Supabase CLI and link it to your project. Follow these steps:

1. Install the Supabase CLI if you haven't already:

   ```bash
   yarn add global supabase
   ```

2. Log in to your Supabase account:

   ```bash
   supabase login
   ```

3. Initialize your Supabase project in your local directory:

   ```bash
   supabase init
   ```

4. Link your local project to your Supabase project:

   ```bash
   supabase link
   ```

### Deploying new functions

To create a new function, you can use the Supabase CLI. First, make sure you have the CLI installed. Then, you can create a new function with the following command:

```bash
supabase functions new <function-name>
```

This will create a new directory under `supabase/functions/<function-name>` where you can write your function code.

The to deploy the function, run:

```bash
supabase functions deploy <function-name>
```
