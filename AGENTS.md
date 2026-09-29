<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Product `category` is the primary shop category and `subcategory` can be a second shop category; match both in category filtering and counts so one product appears in both without duplicate records.

# Autonomous AI Agent Rules

For autonomous, scheduled, or assisted AI agents working on this repository:

1. Follow `docs/AI-RULES.md` as the source of truth for AI-agent safety and autonomy.
2. Never deploy or publish changes without explicit owner approval.
3. Never push directly to `main`. Use an `ai/<agent>/<short-topic>` branch and open a PR.
4. Never modify payments, orders, authentication, RLS, database migrations, secrets, production configuration, or other protected areas unless the owner explicitly approves that specific change.
5. Never send messages to customers or make changes to prices, stock, coupons, delivery settings, refunds, cancellations, or orders autonomously.
6. Never delete data, expose customer PII, export customer data, or create production test orders.
7. AI-generated changes must be reviewable, logged, and limited to one clear concern per PR.
8. If anything is unclear, stop and ask the owner rather than guessing.
9. Never claim a test, fix, deployment, or verification happened unless it actually happened.

## Project map for AI agents

- Store application: `src/`
- Server functions: `src/lib/*.functions.ts`
- Payment code: `src/lib/payments/`
- Payment webhook: `src/routes/api/public/payments/webhook.ts`
- Database migrations: `drizzle/migrations/` and `supabase/migrations/`
- Generated Supabase types: `integrations/supabase/types.ts`
- Admin routes/components: `src/routes/admin/` and related admin components
- AI-agent rules: `docs/AI-RULES.md`

Treat generated files and protected areas as read-only unless the owner explicitly approves a change.
