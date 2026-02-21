import { useState } from "react";
import { subDays, format } from "date-fns";
import { BarChart3, TrendingUp, ShoppingCart, DollarSign, Download, PieChart, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useAnalytics, exportCSV } from "@/hooks/useAnalytics";

const PIE_COLORS = [
  "hsl(15, 85%, 52%)", "hsl(35, 90%, 55%)", "hsl(145, 45%, 45%)", "hsl(210, 70%, 55%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 51%)", "hsl(50, 80%, 50%)", "hsl(180, 50%, 45%)",
];

export default function Analytics() {
  const [from, setFrom] = useState(() => subDays(new Date(), 6));
  const [to, setTo] = useState(() => new Date());
  const { data, isLoading } = useAnalytics({ from, to });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <BarChart3 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-foreground mr-auto">Analytics Dashboard</h1>
        <Input
          type="date"
          className="w-40"
          value={format(from, "yyyy-MM-dd")}
          onChange={(e) => e.target.value && setFrom(new Date(e.target.value))}
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="date"
          className="w-40"
          value={format(to, "yyyy-MM-dd")}
          onChange={(e) => e.target.value && setTo(new Date(e.target.value))}
        />
        <Button variant="outline" size="sm" onClick={() => exportCSV(data.orders)}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard icon={DollarSign} label="Total Sales" value={`£${data.totalSales.toFixed(2)}`} />
        <SummaryCard icon={ShoppingCart} label="Orders" value={String(data.totalOrders)} />
        <SummaryCard icon={TrendingUp} label="Avg Order" value={`£${data.avgOrderValue.toFixed(2)}`} />
        <SummaryCard icon={DollarSign} label="Profit" value={`£${data.totalProfit.toFixed(2)}`} />
        <SummaryCard icon={PieChart} label="Top Pizza" value={data.topPizza?.name ?? "—"} />
        <SummaryCard icon={TrendingUp} label="Most Profitable" value={data.mostProfitable?.name ?? "—"} />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Daily Sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Daily Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ sales: { label: "Sales (£)", color: "hsl(var(--primary))" } }} className="h-[220px]">
              <BarChart data={data.dailySales}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "dd MMM")} className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Hourly Sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-info" /> Hourly Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ sales: { label: "Sales (£)", color: "hsl(var(--info))" } }} className="h-[220px]">
              <BarChart data={data.hourlySales}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="hour" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Best-Selling Pizzas */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-secondary" /> Best-Selling Pizzas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.pizzaItems.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No pizza sales in this period</p>
            ) : (
              <div className="flex items-center gap-6 flex-wrap justify-center">
                <div className="h-[220px] w-[260px]">
                  <ResponsiveContainer>
                    <RePieChart>
                      <Pie data={data.pizzaItems} dataKey="qty" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {data.pizzaItems.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid gap-1 text-sm">
                  {data.pizzaItems.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-foreground">{p.name}</span>
                      <span className="text-muted-foreground ml-auto">{p.qty} sold</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-xs">{label}</span>
        </div>
        <span className="text-lg font-bold text-foreground truncate">{value}</span>
      </CardContent>
    </Card>
  );
}
