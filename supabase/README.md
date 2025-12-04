# Supabase Edge Functions

This directory contains Supabase Edge Functions for server-side operations.

## Functions

### `login`
Handles user authentication with password verification.

**Endpoint**: `https://[PROJECT_ID].supabase.co/functions/v1/login`

**Request**:
```json
{
  "name": "username",
  "password": "password"
}
```

**Response**:
```json
{
  "id": "user-id",
  "name": "username",
  "role": "CREATOR" | "WIFE"
}
```

### `change-password`
Handles password changes for authenticated users.

**Endpoint**: `https://[PROJECT_ID].supabase.co/functions/v1/change-password`

**Request**:
```json
{
  "userId": "user-id",
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

**Response**:
```json
{
  "success": true
}
```

## Deployment

To deploy these functions, you'll need to:

1. Install Supabase CLI (see https://supabase.com/docs/guides/cli)
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref [PROJECT_ID]`
4. Deploy functions:
   ```bash
   supabase functions deploy login
   supabase functions deploy change-password
   ```

## Environment Variables

The functions require these environment variables (set in Supabase Dashboard → Edge Functions → Settings):

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from Settings → API)

## Testing

Test locally:
```bash
supabase functions serve login
supabase functions serve change-password
```

Then test with curl:
```bash
curl -X POST http://localhost:54321/functions/v1/login \
  -H "Content-Type: application/json" \
  -H "apikey: [ANON_KEY]" \
  -d '{"name":"condor","password":"x"}'
```

