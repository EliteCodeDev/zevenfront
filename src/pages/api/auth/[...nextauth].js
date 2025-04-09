import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import { signIn } from '../../../services/auth';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: 'Sign in with Email',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        try {
          const { user, jwt } = await signIn({
            email: credentials.email,
            password: credentials.password,
          });
          return { ...user, jwt };
        } catch (error) {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      if (account.provider === 'google' || account.provider === 'github') {
        try {
          console.log(`🔍 Verificando usuario en Strapi con ${account.provider}:`, profile.email);

          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?filters[email][$eq]=${profile.email}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            },
          });

          const users = await res.json();
          if (!res.ok || !Array.isArray(users)) return false;

          if (users.length > 0) {
            const existingUser = users[0];
            if (existingUser.provider === 'local') return false;
          }

          const authRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/${account.provider}/callback?access_token=${account.access_token}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            },
          });

          const authData = await authRes.json();
          if (!authData.jwt) return false;
          return true;
        } catch (error) {
          console.error(`❌ Error en signIn con ${account.provider}:`, error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const authRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/${account.provider}/callback?access_token=${account.access_token}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            },
          });

          const authData = await authRes.json();
          if (!authData.jwt) throw new Error('Error al autenticar con Strapi');

          token.id = authData.user.id;
          token.jwt = authData.jwt;
          token.name = authData.user.username || authData.user.email;
          token.email = authData.user.email;
          token.firstName = user.firstName; // Agregando firstName al token
          token.lastName = user.lastName; // Agregando firstName al token
          token.roleName = user.role?.name;
        } catch (error) {
          console.error('❌ Error autenticando con Strapi:', error);
        }
      } else if (user) {
        token.id = user.id;
        token.jwt = user.jwt;
        token.name = user.name;
        token.email = user.email;
        token.firstName = user.firstName; // Agregando firstName al token
        token.lastName = user.lastName; // Agregando firstName al token
        token.roleName = user.role?.name;
      }
      return token;
    },

    async session({ session, token }) {
      session.id = token.id;
      session.jwt = token.jwt;
      session.user.name = token.name;
      session.user.email = token.email;
      session.firstName = token.firstName; // Agregando firstName a la sesión
      session.lastName = token.lastName; // Agregando firstName a la sesión
      session.roleName = token.roleName; // Agregando roleName a la sesión
      return session;
    },
  },
  // session: {
  //   strategy: 'jwt',
  //   // 2) Definimos el tiempo máximo de vida del token en segundos
  //   maxAge: 60*60*24*5, // Ej: 72 horas
  // },

  pages: {
    signIn: '/login',
  },
});
