"use client";
import { useEffect } from "react";
import { track } from "@/lib/analytics";
export function PublicProfileView({ username }: { username: string }) { useEffect(() => { track("public_profile_viewed", { username }); }, [username]); return null; }
