'use client'

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface Token {
	name: string;
	symbol: string;
	logo: string;
	decimals: number;
	balance: string;
	address: string;
}

export default function OwnedTokensPanel() {
	const { address } = useAccount();
	const [ownedTokens, setOwnedTokens] = useState<Token[]>([]);

	useEffect(() => {
		const getOwnedTokens = async () => {
			const response = await fetch(
				`/api/getWalletTokens?address=${address}`
			).then((response) => response.json());
			if (response) setOwnedTokens(response.unifiedBalancedAndMetadata);
		};

		getOwnedTokens();
	}, []);

	return (
		<div className="flex flex-wrap justify-center">
			{address && ownedTokens.map((token) => (
				<div
					key={token.address}
					className="bg-white rounded-lg shadow-md m-4 p-6 max-w-xs"
				>
					<div className="flex items-center justify-center">
						<img
							src={token.logo}
							alt={token.name}
							className="w-12 h-12 rounded-full"
						/>
					</div>
					<div className="mt-4">
						<h3 className="text-xl font-semibold mb-2">
							{token.name}
						</h3>
						<p className="text-gray-600">Symbol: {token.symbol}</p>
						<p className="text-gray-600">
							Balance: {token.balance}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}
