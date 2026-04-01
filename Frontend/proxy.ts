import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => !!token && !token.blocked,
  },
});

export const config = {
  matcher: ["/fake-detection", "/settings"],
};
