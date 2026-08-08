-- Keep the display label editable while enforcing a canonical key for new writes.
-- Nullable values preserve rows created before this migration; API writes populate it.
ALTER TABLE "BudgetOption" ADD COLUMN "normalizedLabel" TEXT;

CREATE UNIQUE INDEX "BudgetOption_normalizedLabel_key"
ON "BudgetOption"("normalizedLabel");
