const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function check() {
  const email = 'netemre387@gmail.com';
  console.log(`Checking user: ${email}`);
  
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('User not found in database.');
      return;
    }

    console.log('User found:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Name: "${user.name}" (length: ${user.name?.length})`);
    console.log(`- Email: "${user.email}" (length: ${user.email?.length})`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Status: ${user.status}`);
    console.log(`- Has password: ${!!user.password}`);

    const testPassword = 'Emre1863';
    if (user.password) {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`- Password 'Emre1863' is valid: ${isValid}`);
    }
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
