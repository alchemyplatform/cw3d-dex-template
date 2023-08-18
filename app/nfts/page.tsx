"use client";

import "@/app/globals.css";
import NftGallery from "@/components/nftGallery";
import { useAccount } from "wagmi";

export default function Home() {
  const { address } = useAccount();
  return (
    <main className="">
      <NftGallery walletAddress={address}  />
    </main>
  );
}
