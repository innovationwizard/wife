import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  // Passwords for seed users
  const husbandPassword = 'x'
  const wifePassword = '2122'

  console.log('🔄 Creating users in Supabase Auth...\n')

  // Create husband user in Supabase Auth
  const husbandEmail = 'jorgeluiscontrerasherrera@gmail.com'
  console.log(`Creating auth user: ${husbandEmail}`)
  
  let husbandAuth: { user: any } | null = null
  
  // Try to create user
  const { data: husbandAuthData, error: husbandAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: husbandEmail,
    password: husbandPassword,
    email_confirm: true,
    user_metadata: {
      name: 'condor',
      role: 'HUSBAND'
    }
  })

  if (husbandAuthData?.user) {
    husbandAuth = husbandAuthData
    console.log('  ✅ Created new user')
  } else if (husbandAuthError) {
    // User might already exist, try to update
    if (husbandAuthError.message.includes('already registered') || husbandAuthError.code === 'email_exists') {
      console.log('  User exists, fetching and updating...')
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existing = existingUsers?.users?.find(u => u.email === husbandEmail)
      if (existing) {
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: husbandPassword,
          user_metadata: {
            name: 'condor',
            role: 'HUSBAND'
          }
        })
        husbandAuth = { user: existing }
        console.log('  ✅ Updated existing user')
      } else {
        throw new Error('User exists but could not be found')
      }
    } else {
      throw husbandAuthError
    }
  }

  // Create wife user in Supabase Auth
  const wifeEmail = 'stefani121@gmail.com'
  console.log(`Creating auth user: ${wifeEmail}`)
  
  let wifeAuth: { user: any } | null = null
  
  // Try to create user
  const { data: wifeAuthData, error: wifeAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: wifeEmail,
    password: wifePassword,
    email_confirm: true,
    user_metadata: {
      name: 'estefani',
      role: 'WIFE'
    }
  })

  if (wifeAuthData?.user) {
    wifeAuth = wifeAuthData
    console.log('  ✅ Created new user')
  } else if (wifeAuthError) {
    // User might already exist, try to update
    if (wifeAuthError.message.includes('already registered') || wifeAuthError.code === 'email_exists') {
      console.log('  User exists, fetching and updating...')
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existing = existingUsers?.users?.find(u => u.email === wifeEmail)
      if (existing) {
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: wifePassword,
          user_metadata: {
            name: 'estefani',
            role: 'WIFE'
          }
        })
        wifeAuth = { user: existing }
        console.log('  ✅ Updated existing user')
      } else {
        throw new Error('User exists but could not be found')
      }
    } else {
      throw wifeAuthError
    }
  }

  if (!husbandAuth || !husbandAuth.user) {
    throw new Error('Failed to create or find husband user')
  }
  if (!wifeAuth || !wifeAuth.user) {
    throw new Error('Failed to create or find wife user')
  }

  console.log('\n✅ Auth users created\n')

  // Create/update users in User table (using auth user IDs)
  const husband = await prisma.user.upsert({
    where: { name: 'condor' },
    update: {
      id: husbandAuth.user.id,
      role: 'HUSBAND'
    },
    create: {
      id: husbandAuth.user.id,
      name: 'condor',
      password: '', // No longer needed, auth handled by Supabase
      role: 'HUSBAND'
    }
  })

  const wife = await prisma.user.upsert({
    where: { name: 'estefani' },
    update: {
      id: wifeAuth.user.id,
      role: 'WIFE'
    },
    create: {
      id: wifeAuth.user.id,
      name: 'estefani',
      password: '', // No longer needed, auth handled by Supabase
      role: 'WIFE'
    }
  })

  console.log('✅ Database users synced:')
  console.log('  - Husband:', husband.name, `(email: ${husbandEmail}, password: ${husbandPassword})`)
  console.log('  - Wife:', wife.name, `(email: ${wifeEmail}, password: ${wifePassword})`)

  // Add system rules
  await prisma.rule.createMany({
    data: [
      { ruleKey: 'WIP_LIMIT', ruleValue: '1', description: 'Only one item in DOING status allowed' },
      { ruleKey: 'EXPEDITE_MAX_AGE', ruleValue: '24', description: 'Expedite items older than 24 hours trigger warning' },
      { ruleKey: 'STALE_TODO_DAYS', ruleValue: '7', description: 'TODO items older than 7 days are highlighted' },
    ],
    skipDuplicates: true
  })

  console.log('✅ System rules created')
  console.log('✅ Wife App seeding completed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
