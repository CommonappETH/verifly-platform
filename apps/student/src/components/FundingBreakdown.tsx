import { Card, CardContent, CardHeader, CardTitle } from "@verifly/ui";
import { cn } from "@verifly/utils";

interface FundingBreakdownProps {
  totalTuition: number;
  estimatedScholarships: number;
  remainingAmount: number;
  verifiedAmount?: number;
  currency?: string;
  className?: string;
}

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function FundingBreakdown({
  totalTuition,
  estimatedScholarships,
  remainingAmount,
  verifiedAmount,
  currency = "USD",
  className,
}: FundingBreakdownProps) {
  const scholarshipPercent = totalTuition > 0 ? (estimatedScholarships / totalTuition) * 100 : 0;
  const verifiedPercent = verifiedAmount && totalTuition > 0 ? (verifiedAmount / totalTuition) * 100 : 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Funding Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Tuition</span>
            <span className="font-medium">{formatCurrency(totalTuition, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Scholarships</span>
            <span className="font-medium text-success">−{formatCurrency(estimatedScholarships, currency)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-sm">
            <span className="font-medium">Remaining to Verify</span>
            <span className="font-semibold text-primary">{formatCurrency(remainingAmount, currency)}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Funding Coverage</span>
            <span>{Math.round(scholarshipPercent)}% covered by scholarships</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-success rounded-l-full transition-all"
                style={{ width: `${scholarshipPercent}%` }}
              />
              {verifiedPercent > 0 && (
                <div
                  className="bg-primary transition-all"
                  style={{ width: `${Math.min(verifiedPercent - scholarshipPercent, 100 - scholarshipPercent)}%` }}
                />
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Students may only need to verify the remaining tuition amount after estimated scholarship support, where applicable.
        </p>
      </CardContent>
    </Card>
  );
}
