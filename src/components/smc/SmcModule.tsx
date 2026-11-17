import { useOp } from "@/hooks/useOp";
import SmcToday from "./SmcToday";
import SmcTrade from "./SmcTrade";
import SmcMap from "./SmcMap";
import SmcRoutine from "./SmcRoutine";
import SmcStudy from "./SmcStudy";
import SmcData from "./SmcData";
import SmcSettings from "./SmcSettings";
import TabSkeleton from "@/components/TabSkeleton";

export default function SmcModule({ tab, go }: { tab: string; go: (t: string) => void }) {
  const op = useOp();
  if (op.loading && tab !== "op-estudo") return <TabSkeleton />;
  switch (tab) {
    case "op-hoje": return <SmcToday op={op} go={go} />;
    case "op-trade": return <SmcTrade op={op} />;
    case "op-mapa": return <SmcMap op={op} />;
    case "op-rotina": return <SmcRoutine op={op} />;
    case "op-estudo": return <SmcStudy />;
    case "op-dados": return <SmcData op={op} />;
    case "op-config": return <SmcSettings op={op} />;
    default: return null;
  }
}
