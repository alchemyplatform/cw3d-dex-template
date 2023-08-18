import { useEffect, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { erc20ABI, useAccount, useWalletClient, useConnect } from "wagmi";
import BigNumber from "bignumber.js";
import { ErrorPopup } from "../errorPopup";
import { useModal } from "../errorPopup/hooks/useModal";
import { css } from "@emotion/react";
import { BeatLoader } from "react-spinners";

interface Token {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}

interface SwapData {
  fromToken: Token | undefined;
  toToken: Token | undefined;
  amountFrom: string | undefined;
}

export function Swap({ availableTokens }: any) {
  const [tokens, setTokens] = useState<Token[]>();
  const { address, isDisconnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { connect, connectors, error, pendingConnector } = useConnect();
  const [swapData, setSwapData] = useState<SwapData>({
    fromToken: undefined,
    toToken: undefined,
    amountFrom: undefined,
  });
  const [isLoading, setIsloading] = useState(false);
  const [amountTo, setAmountTo] = useState<string>();
  const [isDropdownAOpen, setIsDropdownAOpen] = useState(false);
  const [isDropdownBOpen, setIsDropdownBOpen] = useState(false);
  const [gasAmount, setGasAmount] = useState<string>();
  const [gasPrice, setGasPrice] = useState<string>();
  const [priceImpact, setPriceImpact] = useState<string>();

  const { visible, showModal } = useModal(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  useEffect(() => {
    const storedTokensList = localStorage.getItem("tokensList");
    if (storedTokensList?.length) {
      const storedTokensListJson = JSON.parse(storedTokensList);
      setTokens(storedTokensListJson as Token[]);
      setSwapData((prev: SwapData) => {
        return {
          ...prev,
          fromToken: storedTokensListJson[0] as Token,
          toToken: storedTokensListJson[1] as Token,
        };
      });
      return;
    }
    const fetchTokensList = async () => {
      const fetchedTokensList = await listAllAvailableTokens();
      const sortedTokensList = fetchedTokensList.sort((a: Token, b: Token) =>
        a.name.localeCompare(b.name)
      );

      if (sortedTokensList && !tokens) {
        localStorage.setItem("tokensList", JSON.stringify(sortedTokensList));
        setTokens(sortedTokensList);
      }
    };

    if (!tokens) {
      fetchTokensList();
    }
  }, []);

  useEffect(() => {
    getSwapData();
  }, [swapData]);

  const handleTokenASelect = (tokenName: string) => {
    const token = tokens?.find((token) => token.name === tokenName);
    if (token)
      setSwapData((prev: SwapData) => {
        return { ...prev, fromToken: token };
      });
  };
  const handleInvertTokens = () => {
    setSwapData((prev: SwapData) => {
      return {
        ...prev,
        fromToken: prev.toToken,
        toToken: prev.fromToken,
        amountFrom: amountTo,
      };
    });
  };
  const handleTokenBSelect = (tokenName: string) => {
    const token = tokens?.find((token) => token.name === tokenName);
    if (token)
      setSwapData((prev: SwapData) => {
        return { ...prev, toToken: token };
      });
  };
  const handleAmountFromChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = event.target.value;
    value = value.replace(/,/g, ".");
    const parsedValue = parseFloat(value.replace(/[^\d.]/g, ""));
    if (isNaN(parsedValue) || !value) {
      setErrorMessage("Please enter a valid number.");
      showModal(); // Show the error popup
      setSwapData((prev: SwapData) => {
        return { ...prev, amountFrom: undefined };
      });
      return;
    }
    if (value)
      setSwapData((prev: SwapData) => {
        return { ...prev, amountFrom: value };
      });
    console.log(value);
  };

  const getSwapQuote = async () => {
    if (
      swapData.amountFrom &&
      swapData.toToken &&
      swapData.fromToken &&
      swapData.amountFrom != "0"
    ) {
      const convertedAmount = BigInt(
        parseFloat(swapData.amountFrom) * 10 ** swapData.fromToken.decimals
      ).toString();
      const params = {
        sellToken: swapData.fromToken.address,
        buyToken: swapData.toToken.address,
        sellAmount: convertedAmount,
        takerAddres: address,
      };
      // Fetch the swap quote.
      const quote = await fetch("/api/getQuote", {
        method: "POST",
        body: JSON.stringify(params),
      }).then((response) => response.json());

      console.log(quote.quote);

      return quote;
    }
  };

  const getSwapData = async () => {
    if (swapData.amountFrom && swapData.toToken && swapData.fromToken) {
      const convertedAmount = BigInt(
        parseFloat(swapData.amountFrom) * 10 ** swapData.fromToken.decimals
      ).toString();
      const params = {
        sellToken: swapData.fromToken.address,
        buyToken: swapData.toToken.address,
        sellAmount: convertedAmount,
      };
      const price = await fetch("/api/getPrice", {
        method: "POST",
        body: JSON.stringify(params),
      }).then((response) => response.json());
      console.log(price);
      if (
        price.price.validationErrors &&
        price.price.validationErrors[0]?.reason ===
          "INSUFFICIENT_ASSET_LIQUIDITY"
      ) {
        setErrorMessage(
          "Not enough liquidity in the pool. Try with another token"
        );
        showModal();
      } else if (price.price.buyAmount) {
        const buyAmount =
          price.price.buyAmount / 10 ** swapData.toToken.decimals;
        setAmountTo(buyAmount.toString());

        setGasAmount(price.price.gas);
        setGasPrice(price.price.gasPrice);
        setPriceImpact(price.price.estimatedPriceImpact);
      } else {
        getSwapData();
      }
    }
  };

  const handleSwap = async () => {
    setIsloading(true);
    if (swapData.fromToken && swapData.toToken && swapData.amountFrom) {
      const quote = await getSwapQuote();
      if (await setApproval(quote.quote.allowanceTarget)) {
        walletClient?.sendTransaction(quote);
      }
    }
    setIsloading(false);
  };

  const setApproval = async (allowanceTarget: string) => {
    console.log(allowanceTarget);
    const maxApproval = new BigNumber(2).pow(250).minus(1).toNumber();
    try {
      await walletClient?.writeContract({
        address: swapData.fromToken?.address! as `0x${string}`,
        abi: erc20ABI,
        functionName: "approve",
        // @ts-ignore
        args: [allowanceTarget, maxApproval],
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  const toggleDropdownA = () => {
    setIsDropdownAOpen(!isDropdownAOpen);
    setIsDropdownBOpen(false);
  };

  const toggleDropdownB = () => {
    setIsDropdownBOpen(!isDropdownBOpen);
    setIsDropdownAOpen(false);
  };

  const handleTokenSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.toLowerCase();
    setTokens((prevTokens) => {
      if (!prevTokens) return prevTokens;
      const tokens = JSON.parse(localStorage.getItem("tokensList")!) as Token[];
      return tokens.filter((token) =>
        token.name.toLowerCase().includes(searchValue)
      );
    });
  };

  return (
    <div className="flex flex-col items-center ">
      <div className="flex flex-col  w-1/4">
        <div className="mb-4 flex items-center justify-center w-full">
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2  mr-2 w-3/5 outline-none"
            value={swapData.amountFrom}
            onChange={handleAmountFromChange}
            placeholder="Amount"
          />
          <div className="relative  w-2/5">
            <div
              className="border border-gray-300 rounded px-3 py-2  text-left flex gap-2 cursor-pointer  w-full h-10"
              onClick={toggleDropdownA}
            >
              {swapData.fromToken ? (
                <>
                  <LazyLoadImage
                    src={swapData.fromToken.logoURI}
                    alt={swapData.fromToken.name}
                    effect="blur"
                    width="20px"
                    height="20px"
                  />
                  <p>{swapData.fromToken.name}</p>
                </>
              ) : (
                ""
              )}
            </div>
            {isDropdownAOpen && (
              <div className="absolute left-0 right-0 bg-white mt-1 rounded-md shadow-md max-h-60 overflow-y-auto z-50">
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  placeholder="Search Token"
                  onChange={(e) => handleTokenSearch(e)}
                />
                {tokens &&
                  tokens.map((token) => (
                    <button
                      key={token.name}
                      className="flex items-center  px-3 py-2 hover:bg-gray-100"
                      onClick={() => {
                        handleTokenASelect(token.name);
                        toggleDropdownA();
                      }}
                    >
                      <LazyLoadImage
                        src={token.logoURI}
                        alt={token.name}
                        effect="blur"
                        width="20px"
                        height="20px"
                      />
                      <p className="ml-3">
                        {token.name.length > 15
                          ? token.name.slice(0, 15) + "..."
                          : token.name}
                      </p>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center w-full">
          <button onClick={handleInvertTokens} className="bg-gray-200 transition-all hover:bg-gray-300 l p-3 rounded-md">
            <img
              src="/arrow-icon.svg"
              alt="Arrow Icon"
              className="h-5 w-5 cursor-pointer"
            />
          </button>
        </div>

        <div className="flex items-center justify-center w-full">
          <input
            type="text"
            className="border border-gray-300 rounded rounded-b-none px-3 py-2  mr-2 w-3/5 outline-none"
            value={amountTo}
            disabled
            placeholder="Amount"
          />
          <div className="relative w-2/5">
            <div
              className="border border-gray-300 rounded rounded-b-none px-3 py-2  text-left flex gap-2 cursor-pointer h-10"
              onClick={toggleDropdownB}
            >
              {swapData.toToken ? (
                <>
                  <LazyLoadImage
                    src={swapData.toToken.logoURI}
                    alt={swapData.toToken.name}
                    effect="blur"
                    width="20px"
                  />
                  <p>{swapData.toToken.name}</p>
                </>
              ) : (
                ""
              )}
            </div>
            {isDropdownBOpen && (
              <div className="absolute left-0 right-0 bg-white mt-1 rounded-md shadow-md max-h-60 overflow-y-auto">
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  placeholder="Search Token"
                  onChange={(e) => handleTokenSearch(e)}
                />
                {tokens &&
                  tokens.map((token) => (
                    <button
                      key={token.name}
                      className="flex items-center px-3 py-2 hover:bg-gray-100"
                      onClick={() => {
                        handleTokenBSelect(token.name);
                        toggleDropdownB();
                      }}
                    >
                      <LazyLoadImage
                        src={token.logoURI}
                        alt={token.name}
                        effect="blur"
                        width="20px"
                        height="20px"
                      />
                      <p className="ml-3">
                        {token.name.length > 15
                          ? token.name.slice(0, 15) + "..."
                          : token.name}
                      </p>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-center w-full bg-slate-600 text-slate-100 mb-4 rounded-b">
          <div className="flex  flex-col justify-evenly w-full py-3 px-2 gap-3">
            <p>
              ⛽️ <strong> Gas</strong> {gasAmount}
            </p>

            <p>
              ⛽️ <strong>Price:</strong> {gasPrice}
            </p>
            {priceImpact && (
              <p>
                <strong>💸 Price impact: </strong>
                <span
                  className={
                    parseFloat(priceImpact) >= 30
                      ? "text-red-500"
                      : parseFloat(priceImpact) >= 15
                      ? "text-orange-500"
                      : "text-green-500"
                  }
                >
                  {priceImpact}
                </span>
              </p>
            )}
          </div>
        </div>

        <button
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white font-bold py-3 rounded"
          onClick={handleSwap}
          disabled={isDisconnected || isLoading}
        >
          {isLoading ? <BeatLoader color="white" size={4} /> : null}

          {isDisconnected ? "Connect to get started" : isLoading ? "" : "Swap"}
        </button>
      </div>
      {visible && <ErrorPopup message={errorMessage!} />}
    </div>
  );
}

const listAllAvailableTokens = async () => {
  const response = await fetch("/api/getAllTokens");
  const tokens = await response.json();
  console.log(tokens);
  return tokens.data;
};
