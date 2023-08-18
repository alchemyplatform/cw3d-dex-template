import { NextResponse } from "next/server";
import { Network, Alchemy } from "alchemy-sdk";

const settings = {
	apiKey: process.env.ALCHEMY_API_KEY,
	network: Network.ETH_MAINNET,
};
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const tokenA = searchParams.get("tokenA");
	const tokenB = searchParams.get("tokenB");
	if (tokenA && tokenB) {
		const alchemy = new Alchemy(settings);
		const tokenAMetadata = await alchemy.core.getTokenMetadata(tokenA);
		const tokenBMetadata = await alchemy.core.getTokenMetadata(tokenB);

		return NextResponse.json({ tokenAMetadata, tokenBMetadata });
	}
}
