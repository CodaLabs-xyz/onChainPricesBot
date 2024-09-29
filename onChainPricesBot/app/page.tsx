"use client";

//import Image from "next/image";
import { useEffect, useState } from "react";
import {
  DynamicWidget,
  useTelegramLogin,
  useDynamicContext,
} from "../lib/dynamic";

import Spinner from "./Spinner";


export default function Home() {

  const { sdkHasLoaded, user } = useDynamicContext();
  const { telegramSignIn } = useTelegramLogin();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!sdkHasLoaded) return;
    // console.log("sdkHasLoaded - true");
    
    const signIn = async () => {
      if (!user) {
        // console.log("user - signing in");
        await telegramSignIn({ forceCreateUser: true });
        // console.log("user - telegramSignIn");
      }
      setIsLoading(false);
    };

    signIn();
  }, [sdkHasLoaded]);

  // Check if window.TelegramGameProxy is available
  if (typeof window !== "undefined" && window.TelegramGameProxy) {
    // Your logic here
  } else {
    console.warn("TelegramGameProxy is not available.");
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1>Hello World</h1>
        <div className="flex justify-center py-4">
            {isLoading ? <Spinner /> : <DynamicWidget />}
          </div>        
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <h1>Hello World</h1>
      </footer>
    </div>
  );
}
