
import "@/app/globals.css";
import OwnedTokensPanel from "@/components/ownedTokensPanel";
import PopularTokensPanel from "@/components/popularTokensPanel";

export default function Home() {
	return (
		<main className="">
			<OwnedTokensPanel />
			{/* @ts-ignore */}
			<PopularTokensPanel />
		</main>
	);
}
