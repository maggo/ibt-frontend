import { ConnectButton } from "@rainbow-me/rainbowkit";

import { useEffect, useState } from "react";

import { VerificationResponse } from "@worldcoin/id/dist/types";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  useDisconnect,
  useNetwork,
  usePrepareContractWrite,
  useSwitchNetwork,
  useWaitForTransaction,
} from "wagmi";

import abi from "../contract.abi.json";

import { WorldIDWidget } from "@worldcoin/id";

import { defaultAbiCoder } from "ethers/lib/utils";
import { useSessionStorage } from "usehooks-ts";
import { Address } from "../components/Address";
import { BigNumber } from "ethers";

const CONTRACT_ADDRESS = "0x41e727A4c19EEA4B7D0A079688268F3E74D4F6F0";

export function Flow() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div className="mx-auto max-w-xl rounded-lg bg-gray-900 text-left font-sans text-white shadow">
      <header className="flex justify-between gap-4 border-b p-2">
        <div className="font-mono text-xs font-bold uppercase text-gray-400">
          Iris-bound Tokens
        </div>
        {!!isConnected && (
          <button
            className="font-mono text-xs font-bold uppercase underline decoration-dotted"
            onClick={() => disconnect()}
          >
            <Address address={address} />
          </button>
        )}
      </header>
      <div className="space-y-4 p-4">
        <Content key={address} />
      </div>
    </div>
  );
}

function Content() {
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { isConnected, address } = useAccount();

  const [isReclaiming, setIsReclaiming] = useState(false);

  const [verificationResponse, setVerificationResponse] = useSessionStorage<
    VerificationResponse | undefined
  >(`mint-${CONTRACT_ADDRESS}-${address}`, undefined);

  useEffect(() => {
    setIsReclaiming(false);
  }, [address, setIsReclaiming]);

  const [txId, setTxId] = useState<string | undefined>();
  const { isLoading: txLoading, isSuccess: txSuccess } = useWaitForTransaction({
    hash: txId,
  });

  const { data: tokenIdData } = useContractRead({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: abi,
    functionName: "nullifierHashToTokenId",
    args: verificationResponse?.nullifier_hash,
  });

  const tokenId = BigNumber.isBigNumber(tokenIdData)
    ? BigNumber.from(tokenIdData)
    : undefined;

  const { data: ownerData } = useContractRead({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: abi,
    functionName: "ownerOf",
    args: tokenId,
  });

  const hasMinted = !!tokenId?.toNumber();
  const owner = ownerData as string | undefined;

  const addressOwnsToken = address === owner;

  if (!isConnected) {
    return <ConnectButton label="Connect to check membership" />;
  }

  if (!!chain && chain.id !== 137) {
    return (
      <>
        <button
          className="rounded-lg bg-red-600 px-4 py-1 font-bold text-white disabled:opacity-50"
          onClick={() => switchNetwork?.(137)}
        >
          Please switch to Polygon network!
        </button>
      </>
    );
  }

  if (!verificationResponse) {
    return (
      <>
        <div>
          Please prove your identity for <Address address={address} />
        </div>
        <WorldIDWidget
          actionId={CONTRACT_ADDRESS}
          signal={address}
          debug={false}
          theme="dark"
          appName="Iris-bound Tokens"
          signalDescription="Mint your Iris-bound token"
          onSuccess={(verificationResponse) => {
            console.log(verificationResponse);
            setVerificationResponse(verificationResponse);
          }}
        />
      </>
    );
  }

  if (txLoading) {
    return (
      <>
        {isReclaiming ? "Moving your IBT…" : "Minting your IBT…"}{" "}
        {!!chain?.blockExplorers?.default && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`${chain.blockExplorers.default.url}/tx/${txId}`}
            className="underline decoration-dotted"
          >
            Check on {chain.blockExplorers.default.name}
          </a>
        )}
      </>
    );
  }

  if (txSuccess) {
    if (isReclaiming) {
      return (
        <>
          Success! <Address address={address} /> now owns your IBT.
        </>
      );
    }
    return (
      <>
        Congratulations! Your soul is now linked to <strong>CapybaraDAO</strong>
      </>
    );
  }

  if (isReclaiming && !addressOwnsToken) {
    return (
      <Reclaim
        owner={owner}
        verificationResponse={verificationResponse}
        onSuccess={(txId) => setTxId(txId)}
      />
    );
  }

  return (
    <>
      {hasMinted ? (
        <>
          {addressOwnsToken ? (
            <div className="text-lg">
              Congratulations! Your soul is linked to{" "}
              <strong>CapybaraDAO</strong>!
            </div>
          ) : (
            <>
              <div className="mb-2 text-lg">
                Congratulations! Your soul is linked to{" "}
                <strong>CapybaraDAO</strong>.<br />
                Your IBT is owned by <Address address={owner} />.
              </div>
              <footer className="flex items-center justify-between gap-4 border-t py-1">
                <div className="text-sm">
                  Do you want to claim your IBT with a different address?
                </div>
                <button
                  className="rounded-lg bg-green-600 px-4 py-1 font-bold text-white disabled:opacity-50"
                  onClick={() => setIsReclaiming(true)}
                >
                  Transfer IBT
                </button>
              </footer>
            </>
          )}
        </>
      ) : (
        <Mint
          verificationResponse={verificationResponse}
          onSuccess={(txId) => setTxId(txId)}
        />
      )}
    </>
  );
}

function Mint({
  verificationResponse,
  onSuccess,
}: {
  verificationResponse: VerificationResponse;
  onSuccess: (txId: string) => void;
}) {
  const unpackedProof = defaultAbiCoder.decode(
    ["uint256[8]"],
    verificationResponse.proof
  )[0];

  const { config } = usePrepareContractWrite({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: abi,
    functionName: "mint",
    args: [
      verificationResponse.merkle_root,
      verificationResponse.nullifier_hash,
      unpackedProof,
    ],
  });

  const { isLoading, write } = useContractWrite({
    ...config,
    onSuccess(data) {
      onSuccess(data.hash);
    },
  });

  return (
    <>
      <div>
        Mint your <strong>CapybaraDAO</strong> membership IBT now
      </div>

      <button
        disabled={!write || isLoading}
        className="rounded-lg bg-green-600 px-4 py-2 font-bold text-white disabled:opacity-50"
        onClick={() => write?.()}
      >
        Mint
      </button>
    </>
  );
}

function Reclaim({
  owner,
  verificationResponse,
  onSuccess,
}: {
  owner: string | undefined;
  verificationResponse: VerificationResponse;
  onSuccess: (txId: string) => void;
}) {
  const { address, connector } = useAccount();
  const unpackedProof = defaultAbiCoder.decode(
    ["uint256[8]"],
    verificationResponse.proof
  )[0];

  const { data: hasReclaimedAlreadyData } = useContractRead({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: abi,
    functionName: "addressHasBeenUsed",
    args: address,
  });

  const hasReclaimedAlready = !!hasReclaimedAlreadyData;

  const { config } = usePrepareContractWrite({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: abi,
    functionName: "reclaim",
    args: [
      verificationResponse.merkle_root,
      verificationResponse.nullifier_hash,
      unpackedProof,
    ],
    enabled: !hasReclaimedAlready,
  });

  const { isLoading, write } = useContractWrite({
    ...config,
    onSuccess(data) {
      onSuccess(data.hash);
    },
  });

  if (hasReclaimedAlready) {
    return (
      <>
        <div className="text-lg">
          You cannot claim your IBT with this address, since it has owned the
          IBT before. <br />
        </div>
        <div>
          Please switch to a different account in your wallet to continue.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-lg">
        You&apos;re about to claim your IBT with <Address address={address} />.
      </div>

      <div>
        Please remember, <Address address={owner} /> will lose access to this
        IBT <strong>FOREVERRRR.</strong>
      </div>

      <button
        disabled={!write || isLoading}
        className="rounded-lg bg-green-600 px-4 py-2 font-bold text-white disabled:opacity-50"
        onClick={() => write?.()}
      >
        Move IBT
      </button>
    </>
  );
}
