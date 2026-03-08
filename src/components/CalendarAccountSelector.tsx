import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccountManager } from "@/hooks/useAccountManager";
import { TradingCalendar } from "./TradingCalendar";

export function CalendarAccountSelector() {
  const { accounts, activeAccountId, switchAccount } = useAccountManager();
  const [selectedAccountId, setSelectedAccountId] = useState(activeAccountId);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground whitespace-nowrap">Conta:</label>
        <Select value={selectedAccountId} onValueChange={handleAccountChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecione a conta" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <TradingCalendar activeAccountId={selectedAccountId} />
    </div>
  );
}
