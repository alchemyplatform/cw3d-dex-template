"use client";

import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import TokenGraph from "./graph";

interface TokenData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
}

export interface ChartData {
  price: number;
  date: string;
}
interface ChartDataObject {
  [key: string]: ChartData[];
}

export default function PopularTokensPanel() {
  const [tokens, setTokens] = useState<TokenData[]>();
  const [chartData, setChartData] = useState<ChartDataObject>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const tokensPerPage = 30;

  const getTokenChartDataWithRetries = async (
    tokens: TokenData[],
    retries = 3
  ) => {
    const failedTokens: TokenData[] = [];

    for (const token in tokens) {
      try {
        const tokenId = tokens[token].id;
        const response = await fetch(
          `/api/getTokenChartData?tokenId=${tokenId}`
        );
        console.log(response);
        const data = await response.json();
        const chartData = data.chartData.market_caps;
        const prices = chartData.map(
          (price: number[]): ChartData => ({
            date: new Date(price[0]).toLocaleDateString(),
            price: price[1],
          })
        );
        setChartData((prev) => {
          return { ...prev, [tokenId]: prices };
        });
      } catch (e) {
        failedTokens.push(tokens[token]);
        console.log(
          `Fetching token chart data for token ID ${tokens[token].id} failed. `
        );
      }
    }
    localStorage.setItem("chartData", JSON.stringify(chartData));

    if (failedTokens.length && retries > 0) {
      setTimeout(() => {
        getTokenChartDataWithRetries(failedTokens, retries - 1);
      }, 80000);
    } else {
      console.log("Some tokens failed to fetch");
    }
  };

  // Function to fetch tokens' graph data for the current page
  const getTokensChartDataForCurrentPage = async () => {
    if (!tokens || tokens.length === 0) {
      console.log("No tokens found");
      return;
    }
    console.log("Getting tokens for page", currentPage);
    const startIndex = (currentPage - 1) * tokensPerPage;
    const endIndex = Math.min(startIndex + tokensPerPage, tokens.length);
    const tokensPage = tokens.slice(startIndex, endIndex);

    await getTokenChartDataWithRetries(tokensPage);
  };
  
  useEffect(() => {
    getTokensChartDataForCurrentPage();
  }, [currentPage, tokens]);

  useEffect(() => {
    const setTokensData = async () => {
      const storedTokens = localStorage.getItem("popularTokens");
      if (storedTokens) {
        const storedTokensJSON = JSON.parse(storedTokens) as TokenData[];
        setTokens(storedTokensJSON);
      } else {
        const response = await fetch("api/getAllTokensPriceData");
        const { fetchedTokens } = await response.json();

        setTokens(fetchedTokens);
        localStorage.setItem("popularTokens", JSON.stringify(fetchedTokens));
        getTokensChartDataForCurrentPage();
      }
    };

    if (!tokens) {
      setTokensData();
    }
  }, []);
  const handlePageChange = (newPage: number) => {
    console.log(newPage);
    setCurrentPage(newPage);
  };
  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-semibold mb-4">Token Table</h2>
      <table className="table-auto w-full border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-2">Image</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Current Price</th>
            <th className="px-4 py-2">Market Cap</th>
            <th className="px-4 py-2">High 24h</th>
            <th className="px-4 py-2">Low 24h</th>
            <th className="px-4 py-2">Price Change 24h</th>
            <th className="px-4 py-2">Price Change % 24h</th>
            <th className="px-4 py-2">Graph</th>
          </tr>
        </thead>
        <tbody>
          {tokens &&
            tokens
              .slice(
                (currentPage - 1) * tokensPerPage,
                currentPage * tokensPerPage
              )
              .map((token) => {
                return (
                  <tr key={token.id}>
                    <td className="px-4 py-2 text-center">
                      <img
                        src={token.image}
                        alt={token.name}
                        className="w-8 h-8"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">{token.name}</td>
                    <td className="px-4 py-2 text-center">
                      {token.current_price}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {token.market_cap}
                    </td>
                    <td className="px-4 py-2 text-center">{token.high_24h}</td>
                    <td className="px-4 py-2 text-center">{token.low_24h}</td>
                    <td className="px-4 py-2 text-center">
                      {token.price_change_24h}
                    </td>
                    <td className="px-1 py-2 text-center">
                      {token.price_change_percentage_24h}
                    </td>
                    <td className=" py-2">
                      {chartData && chartData.length ? (
                        <TokenGraph
                          chartData={chartData[token.id.toString()]}
                        ></TokenGraph>
                      ) : (
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500"></div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
      <div className="my-4 flex w-full justify-center">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous Page
        </button>
        <button
          className="ml-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage * tokensPerPage >= (tokens?.length ?? 0)}
        >
          Next Page
        </button>
      </div>
    </div>
  );
}
