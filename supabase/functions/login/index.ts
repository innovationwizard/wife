import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, password } = await req.json()

    if (!name || !password) {
      return new Response(
        JSON.stringify({ error: 'Name and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Query user from database
    const { data: user, error: dbError } = await supabase
      .from('User')
      .select('id, name, password, role')
      .eq('name', name)
      .single()

    if (dbError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify password using bcrypt
    // Note: This may fail with "Worker is not defined" error
    // If it does, we'll need to use a different approach
    let isValid = false
    try {
      const bcryptModule = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts')
      isValid = await bcryptModule.compare(password, user.password)
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', bcryptError)
      
      // Return detailed error to help debug
      return new Response(
        JSON.stringify({ 
          error: 'Password verification failed',
          details: bcryptError.message || String(bcryptError),
          hint: 'The bcrypt library may require Workers. Consider using Supabase Auth or a different authentication method.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return user data (without password)
    return new Response(
      JSON.stringify({
        id: user.id,
        name: user.name,
        role: user.role
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
