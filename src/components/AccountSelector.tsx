import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Plus } from "lucide-react";
import { useState } from "react";

interface Account {
  id: string;
  name: string;
  broker: string;
  balance: number;
  type: string;
  active: boolean;
}

const mockAccounts: Account[] = [
  { id: "1", name: "Conta Principal", broker: "IC Markets", balance: 5000, type: "Real", active: true },
  { id: "2", name: "Conta Demo", broker: "MetaTrader 5", balance: 100000, type: "Demo", active: false },
  { id: "3", name: "Prop Firm", broker: "FTMO", balance: 25000, type: "Challenge", active: false },
];

export default function AccountSelector() {
  const [accounts] = useState<Account[]>(mockAccounts);
  const [activeId, setActiveId] = useState("1");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Gerenciar Contas
            </CardTitle>
            <CardDescription>Selecione e gerencie suas contas de trading</CardDescription>
          </div>
          <Button size="sm" className="gap-1">
            <Plus className="w-4 h-4" /> Nova Conta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className={`cursor-pointer transition-all border-2 ${
                activeId === account.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => setActiveId(account.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{account.name}</h3>
                  <Badge variant={account.type === "Real" ? "default" : "secondary"}>
                    {account.type}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-primary">${account.balance.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{account.broker}</p>
                {activeId === account.id && (
                  <Badge className="mt-3 bg-success text-success-foreground">Ativa</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
