// Importing necessary modules and components
import { useEffect, useState } from "react";

// Defining the main component of the NFT gallery
export default function NftGallery({
  walletAddress,
  collectionAddress,
  chain,
  pageSize,
}: any) {
  // Defining states for the component
  const [nfts, setNfts] = useState<any>();
  const [isLoading, setIsloading] = useState(false);
  const [pageKey, setPageKey] = useState<string | undefined>();
  const [excludeFilter, setExcludeFilter] = useState(true);

  // Defining functions for fetching NFTs
  const fetchNfts = async () => {
    setIsloading(true);
    if (walletAddress) {
      await getNftsForOwner();
    } else if (collectionAddress) {
      await getNftsForCollection();
    }
    setIsloading(false);
  };
  const getNftsForOwner = async () => {
    console.log(walletAddress);
    if (walletAddress) {
      try {
        // Making a POST request to the server to get NFTs
        const res = await fetch("/api/getNftsForOwner", {
          method: "POST",
          body: JSON.stringify({
            address: walletAddress,
            pageSize: pageSize ? pageSize : 30,
            chain: chain ? chain : "ETH_MAINNET",
            pageKey: pageKey ? pageKey : null,
            excludeFilter: excludeFilter,
          }),
        }).then((res) => res.json());
        if (pageKey?.length) {
          setNfts((prev: any) => {
            return [...prev, ...res.nfts];
          });
        } else {
          setNfts(res.nfts);
        }
        if (res.pageKey) {
          setPageKey(res.pageKey);
        } else setPageKey(undefined);
      } catch (e) {
        console.log(e);
      }
    }
  };

  // Defining useEffect hooks for fetching NFTs and updating when the wallet address changes
  useEffect(() => {
    if (walletAddress?.length) fetchNfts();
  }, [walletAddress]);

  const getNftsForCollection = async () => {
    if (collectionAddress) {
      try {
        // Making a POST request to the server to get NFTs
        const res = await fetch("/api/getNftsForCollection", {
          method: "POST",
          body: JSON.stringify({
            address: collectionAddress,
            pageSize: pageSize,
            chain: chain,
            pageKey: pageKey ? pageKey : null,
            excludeFilter: excludeFilter,
          }),
        }).then((res) => res.json());
        if (pageKey?.length) {
          setNfts((prev: any) => {
            return [...prev, ...res.nfts];
          });
        } else {
          setNfts(res.nfts);
        }
        if (res.pageKey) {
          setPageKey(res.pageKey);
        } else setPageKey(undefined);
      } catch (e) {
        console.log(e);
      }
    }
  };

  useEffect(() => {
    // Calling fetchNfts on component mount
    fetchNfts();
  }, []);

  // If data is still loading, display a loading message

  // Once data is loaded, display NFT gallery
  return (
    <div className="flex flex-col items-center w-full mt-8">
      <div className="flex flex-col items-center w-full max-w-1224 px-4 mb-4">
        <div className="grid grid-cols-1 gap-3 justify-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {nfts?.length ? (
            nfts.map((nft: any) => {
              return <NftCard key={nft.tokenId} nft={nft} />;
            })
          ) : (
            <p>No NFTs found for the selected address</p>
          )}
        </div>
      </div>

      {pageKey && (
        <div className="flex w-full justify-center">
          <a
            className="text-white px-4 py-2 bg-black rounded-lg cursor-pointer"
            onClick={() => {
              fetchNfts();
            }}
          >
            Load more
          </a>
        </div>
      )}
    </div>
  );
}
function NftCard({ nft }: any) {
    const newLocal = "max-h-22";
  return (
    <div className="bg-white w-full max-w-sm mx-auto p-2 border border-blue-300 rounded-lg">
      <div className="h-70">
        {nft.format === ".mp4" ? (
          <video className="w-full h-full">
            <source src={nft.media} />
          </video>
        ) : (
          <img
            src={nft.media}
            alt="NFT Media"
            className="object-cover w-full h-72 rounded-t-lg"
          />
        )}
      </div>
      <div className="flex flex-col justify-between p-2">
        <div className="">
          <h3 className="font-bold text-lg">
            {nft.title
              ? nft.title.length > 20
                ? `${nft.title.substring(0, 12)}...`
                : nft.title
              : `${nft.symbol} ${nft.tokenId.substring(0, 4)}`}
          </h3>
        </div>
        <hr className="my-2 border-gray-400" />
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <p className="font-bold text-lg">
              {nft.collectionName && nft.collectionName.length > 20
                ? `${nft.collectionName.substring(0, 20)}`
                : nft.collectionName}
            </p>
            {nft.verified === "verified" && (
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Twitter_Verified_Badge.svg/2048px-Twitter_Verified_Badge.svg.png"
                alt="Verified Badge"
                className="w-5 h-5 ml-1"
              />
            )}
          </div>
          <div className="flex items-center">
            <p className="text-sm cursor-pointer">
              {nft.contract?.slice(0, 6)}...{nft.contract?.slice(38)}
            </p>
            <img
              src="https://etherscan.io/images/brandassets/etherscan-logo-circle.svg"
              alt="Etherscan Logo"
              className="w-4 h-4 ml-1"
            />
          </div>
        </div>
        <div className={newLocal}>
          <p className="text-md text-gray-600">{nft.description}</p>
        </div>
      </div>
    </div>
  );
}
