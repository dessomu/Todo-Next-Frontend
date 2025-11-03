import LoginLogoutContextProvider from "@/context/LoginLogoutContext";
import "./globals.css";
import SWRProvider from "@/lib/swrProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LoginLogoutContextProvider>
          <SWRProvider>{children}</SWRProvider>
        </LoginLogoutContextProvider>
      </body>
    </html>
  );
}
