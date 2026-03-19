import { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's postal address. */
            id: string
            handle?: string | null
            role?: string
            /**
             * By default, TypeScript merges new interface properties and overwrites existing ones.
             * In this case, the default session user properties will be overwritten,
             * so we need to add them back.
             */
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        handle?: string | null
        password?: string | null
        role?: string
        emailVerified?: Date | null
    }
}
