import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Passwords for seed users - change these as needed
  const creatorPassword = 'x'
  const stakeholderPassword = '2122'

  const hashedCreatorPassword = await bcrypt.hash(creatorPassword, 10)
  const hashedStakeholderPassword = await bcrypt.hash(stakeholderPassword, 10)

  const creator = await prisma.user.upsert({
    where: { name: 'condor' },
    update: {
      password: hashedCreatorPassword,
      role: 'CREATOR'
    },
    create: {
      name: 'condor',
      password: hashedCreatorPassword,
      role: 'CREATOR'
    }
  })

  const wife = await prisma.user.upsert({
    where: { name: 'estefani' },
    update: {
      password: hashedStakeholderPassword,
      role: 'STAKEHOLDER'
    },
    create: {
      name: 'estefani',
      password: hashedStakeholderPassword,
      role: 'STAKEHOLDER'
    }
  })

  console.log('✅ Seed users created:')
  console.log('  - Creator:', creator.name, '(password: x)')
  console.log('  - Stakeholder:', wife.name, '(password: 2122)')

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