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
    const { name, password, role } = await req.json()

    if (!name || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Name, password, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Email mapping - update this if you add more users
    const emailMap: Record<string, string> = {
      'condor': 'jorgeluiscontrerasherrera@gmail.com',
      'estefani': 'stefani121@gmail.com',
    }

    const email = emailMap[name.toLowerCase()] || `${name}@wifeapp.local`

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role
      }
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update User table with auth user id
    const { error: updateError } = await supabaseAdmin
      .from('User')
      .update({ id: authUser.user.id })
      .eq('name', name)

    if (updateError) {
      console.error('Error updating User table:', updateError)
      // Don't fail - user is created in auth
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: authUser.user.id,
        email: authUser.user.email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

