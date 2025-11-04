// app/page.js
import { redirect } from "next/navigation";

function page() {
  redirect("/login");
  return <div>page</div>;
}

export default page;
