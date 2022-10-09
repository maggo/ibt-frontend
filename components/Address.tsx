import { useEnsName } from "wagmi";
import { formatAddress } from "../utils/formatters";

export function Address({ address }: { address: string | undefined }) {
  const { data, isLoading } = useEnsName({ address, chainId: 1 });

  if (isLoading) return <>…</>;

  if (data) {
    return <code title={address}>{data}</code>;
  }

  return <code title={address}>{formatAddress(address)}</code>;
}
