// app/page.js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const token = await cookies().get("session_marker")?.value;

  if (token) {
    redirect("/home"); // logged in → /home
  } else {
    redirect("/login"); // not logged in → /login
  }
}
