"use client";

import { ConnectKitButton } from "connectkit";
import Link from "next/link";
import styles from "./Navbar.module.css";
export default function Navbar() {
	return (
		<nav className={"flex justify-between items-center w-full px-10 py-6"}>
			<Link href="/">DeX Template</Link>
			<div className="flex justify-evenly w-2/3">
				<Link href={"/swap"}>Swap</Link>
				<Link href={"/tokens"}>Tokens</Link>
				<Link href={"/nfts"}>NFTs</Link>
			</div>
			<ConnectKitButton />
		</nav>
	);
}
