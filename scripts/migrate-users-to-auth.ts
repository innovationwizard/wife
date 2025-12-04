#!/usr/bin/env tsx
/**
 * Migration script to create Supabase Auth users from existing User table
 * Run: tsx scripts/migrate-users-to-auth.ts
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrateUsers() {
  console.log('🔄 Starting user migration to Supabase Auth...\n')

  // Get all users from User table
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      role: true,
    }
  })

  console.log(`Found ${users.length} users to migrate\n`)

  // Email mapping
  const emailMap: Record<string, string> = {
    'condor': 'jorgeluiscontrerasherrera@gmail.com',
    'estefani': 'stefani121@gmail.com',
  }

  for (const user of users) {
    try {
      const email = emailMap[user.name.toLowerCase()] || `${user.name}@wifeapp.local`
      
      console.log(`Creating auth user for: ${user.name} (${email})`)

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const exists = existingUsers?.users?.find(u => u.email === email)

      if (exists) {
        console.log(`  ⚠️  User already exists, updating metadata...`)
        
        // Update user metadata
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          exists.id,
          {
            user_metadata: {
              name: user.name,
              role: user.role
            }
          }
        )

        if (updateError) {
          console.error(`  ❌ Error updating user: ${updateError.message}`)
        } else {
          console.log(`  ✅ Updated user metadata`)
        }
        continue
      }

      // Create new user
      // Note: You'll need to set passwords manually or use a default
      // For security, we'll create users without passwords and you can set them in Dashboard
      const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: 'temp_password_change_me', // Change this!
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      })

      if (createError) {
        console.error(`  ❌ Error creating user: ${createError.message}`)
        continue
      }

      console.log(`  ✅ Created user: ${authUser.user.id}`)

      // Update User table with auth user id (optional, for reference)
      await prisma.user.update({
        where: { id: user.id },
        data: { id: authUser.user.id } // Sync IDs if you want
      })

    } catch (error) {
      console.error(`  ❌ Error migrating user ${user.name}:`, error)
    }
  }

  console.log('\n✅ Migration complete!')
  console.log('\n⚠️  IMPORTANT: Set passwords for users in Supabase Dashboard → Authentication → Users')
  console.log('   Or use the create-auth-user Edge Function to set passwords programmatically.')
}

migrateUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

