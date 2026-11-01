"use client";

import { useParams } from "next/navigation";
import ProfileFollowListPage from "@/components/network/ProfileFollowListPage";

export default function FollowersPage() {
  const params = useParams<{ userId: string }>();

  return (
    <ProfileFollowListPage userId={params.userId} listType="followers" />
  );
}
