"use client"

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CtaBtn() {
    const { data: session, isPending } = authClient.useSession();

    return <div className="flex flex-col w-full sm:w-auto gap-4 font-medium sm:flex-row mt-4">

        <Button
            nativeButton={false}
            className="rounded-full text-sm sm:text-base h-12 px-8 shadow-lg"
            render={<Link href={session ? "/home" : "/login"} />}
        >
            {isPending ? <Loader2 className="animate-spin" /> :

                session ? " Continue" : "Get Started"

            }
            {!isPending && <ArrowRight className="size-4" />}
        </Button>
    </div>
}