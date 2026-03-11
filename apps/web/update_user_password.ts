import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'netemre387@gmail.com';
    const plainPassword = 'Emre1863';

    try {
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const updatedUser = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        console.log('USER_UPDATE_SUCCESS:' + JSON.stringify({
            id: updatedUser.id,
            email: updatedUser.email,
            passwordSet: !!updatedUser.password
        }, null, 2));
    } catch (error) {
        console.error('ERROR_UPDATING_USER:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
