import { Network, Alchemy, TokenBalanceType } from "alchemy-sdk";
import { NextResponse } from "next/server";
const settings = {
	apiKey: process.env.ALCHEMY_API_KEY,
	network: Network.ETH_MAINNET,
};
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const address = searchParams.get("address");
	const alchemy = new Alchemy(settings);
	if (!address) {
		return NextResponse.json({ message: "address not provided" });
	}

	try {
		// fetch the token balances using the Alchemy SDK
		const fetchedTokens = await alchemy.core.getTokenBalances(address, {
			type: TokenBalanceType.ERC20,
		});

		// fetch the Ethereum balance for the given address
		const ethBalance = await alchemy.core.getBalance(address);
		const parsedEthBalance =
			parseInt(ethBalance.toString()) / Math.pow(10, 18);

		// create an object representing the Ethereum balance
		const ethBalanceObject = {
			name: "Ethereum",
			symbol: "ETH",
			logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
			decimals: 18,
			balance: parsedEthBalance.toFixed(2),
			address: "0x",
		};

		// extract the token balances and contract addresses from the fetched tokens
		const fetchedTokenBalances = fetchedTokens.tokenBalances.map(
			(token: { tokenBalance: any }) => token.tokenBalance
		);

		const fetchedTokenAddresses = fetchedTokens.tokenBalances.map(
			(token: { contractAddress: any }) => token.contractAddress
		);

		// fetch the token metadata for each token address
		const fetchedTokenMetadata = await Promise.all(
			fetchedTokenAddresses.map(async (address: any) => {
				let metadata;
				try {
					metadata = await alchemy.core.getTokenMetadata(address);
				} catch (e) {
					console.log(e);
					metadata = {
						name: null,
						symbol: null,
						logo: null,
						decimals: null,
					};
				}

				return metadata;
			})
		);

		const unifiedBalancedAndMetadata = [ethBalanceObject];

		for (let x = 0; x < fetchedTokenMetadata.length - 1; x++) {
			const tokenMetadata = fetchedTokenMetadata[x];
			const { name, symbol, logo, decimals } = tokenMetadata;
			const hexBalance = fetchedTokenBalances[x];
			const address = fetchedTokenAddresses[x];
			let convertedBalance;

			if (hexBalance && decimals && symbol && name && logo) {
				convertedBalance =
					parseInt(hexBalance) / Math.pow(10, decimals);
				if (convertedBalance > 0) {
					const tokenBalanceAndMetadata = {
						name,
						symbol:
							symbol.length > 6
								? `${symbol.substring(0, 6)}...`
								: symbol,
						logo,
						decimals,
						balance: convertedBalance.toFixed(2),
						address,
					};
					unifiedBalancedAndMetadata.push(tokenBalanceAndMetadata);
				}
			}
		}

		// filter out any token balances with empty names
		unifiedBalancedAndMetadata.filter(
			(balanceAndMetadata) => balanceAndMetadata.name.length
		);
		return NextResponse.json({ unifiedBalancedAndMetadata });
	} catch (e) {
		return NextResponse.json({ message: "server side error" });
	}
}
