package content

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

func (s *service) SeedDemo(ctx context.Context, adminID uuid.UUID) error {
	type catDef struct {
		Module      string
		Name        string
		Slug        string
		Description string
		SortOrder   int
	}
	catDefs := []catDef{
		{ModuleAcademy, "Foundations", "academy-foundations", "Core market structure and session basics.", 1},
		{ModuleAcademy, "Execution", "academy-execution", "Order flow, risk, and trade management.", 2},
		{ModulePsychology, "Mindset", "psychology-mindset", "Process, tilt control, and discipline.", 1},
		{ModulePsychology, "Process", "psychology-process", "Routines that keep the desk consistent.", 2},
		{ModuleDailyAnalysis, "Desk Notes", "analysis-desk-notes", "Daily levels, bias, and invalidation.", 1},
		{ModuleLanding, "Public Education", "landing-education", "Open primers before you join.", 1},
	}

	existingCats, err := s.repo.ListCategories(ctx, "", false)
	if err != nil {
		return err
	}
	bySlug := map[string]Category{}
	for _, c := range existingCats {
		bySlug[c.Slug] = c
	}
	for _, def := range catDefs {
		if _, ok := bySlug[def.Slug]; ok {
			continue
		}
		desc := def.Description
		c := Category{
			ID: uuid.New(), Module: def.Module, Name: def.Name, Slug: def.Slug,
			Description: &desc, SortOrder: def.SortOrder, IsActive: true,
		}
		if err := s.repo.CreateCategory(ctx, &c); err != nil {
			return err
		}
		bySlug[def.Slug] = c
	}

	now := time.Now().UTC()
	type itemDef struct {
		CatSlug     string
		Module      string
		Type        string
		Title       string
		Slug        string
		Excerpt     string
		Body        string
		Premium     bool
		DurationSec int
		HoursAgo    int
	}

	items := []itemDef{
		// Landing (public)
		{
			"landing-education", ModuleLanding, TypeVideo,
			"Why traders join under one IB", "why-traders-join-under-one-ib",
			"A short desk intro: verification, community quality, and what unlocks after MT5 approval.",
			"IB verification keeps the desk focused. Members share the same broker path, so education, signals, and support stay aligned. Watch this overview, then complete onboarding to unlock the full library.",
			false, 186, 120,
		},
		{
			"landing-education", ModuleLanding, TypeArticle,
			"Why IB verification matters", "why-ib-verification-matters",
			"How Introducing Broker verification protects desk quality and member access.",
			"Private trading communities fail when anyone can join with no skin in the game. IB verification ties membership to a real MT5 path under our broker. That filters noise, keeps Telegram focused, and lets us ship academy, analysis, and signals without watering them down.\n\nAfter you register and submit proof, an admin reviews your account. Once approved, premium modules unlock automatically.",
			false, 0, 100,
		},
		{
			"landing-education", ModuleLanding, TypeArticle,
			"What you unlock after MT5 approval", "what-you-unlock-after-mt5-approval",
			"Academy, daily analysis, live signals, journal, bonuses, and private Telegram.",
			"Verified members get the full desk: structured academy lessons, daily market reads, active trade setups with levels, a personal journal, downloadable bonuses, and the private Telegram channel. Guests can browse public education; everything else stays locked until approval.",
			false, 0, 90,
		},

		// Academy
		{
			"academy-foundations", ModuleAcademy, TypeArticle,
			"Session structure basics", "session-structure-basics",
			"Asia, London, and New York — what each session usually offers.",
			"Markets are not the same at 02:00 and 14:00. Asia often ranges; London expands liquidity; New York delivers continuation or reversal after the open.\n\nMap your setups to the session. If your edge is London breakouts, do not force Asia noise into the journal as the same play.",
			true, 0, 80,
		},
		{
			"academy-foundations", ModuleAcademy, TypeVideo,
			"Order flow walkthrough", "order-flow-walkthrough",
			"How we read aggressive orders around key levels before entry.",
			"This lesson walks a live chart from level → reaction → confirmation. Focus on absorption vs. break, and when to stand down.",
			true, 720, 72,
		},
		{
			"academy-foundations", ModuleAcademy, TypeArticle,
			"Liquidity pools explained", "liquidity-pools-explained",
			"Equal highs, equal lows, and why stops cluster before expansion.",
			"Liquidity is where orders wait. Equal highs above a range and equal lows below it attract stops. The desk treats these as magnets, not magic — wait for the sweep, then trade the reaction with a clear invalidation.",
			true, 0, 64,
		},
		{
			"academy-execution", ModuleAcademy, TypeVideo,
			"Risk framing before you click", "risk-framing-before-you-click",
			"Position size, R-multiple, and when the setup is not worth the click.",
			"Never size from conviction. Size from account risk and stop distance. If the R is ugly after spread and slippage, skip.",
			true, 540, 50,
		},
		{
			"academy-execution", ModuleAcademy, TypeArticle,
			"Trade management playbook", "trade-management-playbook",
			"Partial takes, move-to-BE rules, and when to let runners work.",
			"Define management before entry. Example: scale 50% at 1R, stop to break-even, trail the rest behind structure. Changing rules mid-trade is how tilt starts.",
			true, 0, 40,
		},
		{
			"academy-execution", ModuleAcademy, TypeVideo,
			"Journaling like a desk", "journaling-like-a-desk",
			"What to log so review sessions actually improve execution.",
			"Screenshot, thesis, risk, emotion tag, and outcome. Weekly review beats daily overthinking.",
			true, 480, 30,
		},

		// Psychology / articles rail
		{
			"psychology-mindset", ModulePsychology, TypeArticle,
			"Tilt control checklist", "tilt-control-checklist",
			"A short list to run when the next click feels emotional.",
			"Stop. Flat or reduce. Walk. Re-read the plan. Only resume if the next setup is A+ and size is reduced. Tilt trades rarely become heroic recoveries.",
			true, 0, 55,
		},
		{
			"psychology-mindset", ModulePsychology, TypeArticle,
			"Process over prediction", "process-over-prediction",
			"Why calling the top matters less than executing your rules.",
			"You do not need to be right about the macro narrative. You need repeatable entries with defined risk. Score yourself on process compliance, not P&L alone.",
			true, 0, 45,
		},
		{
			"psychology-process", ModulePsychology, TypeArticle,
			"Pre-market routine that sticks", "pre-market-routine-that-sticks",
			"Fifteen minutes that set bias, levels, and max loss for the day.",
			"1) Mark HTF levels. 2) Write one bias sentence. 3) Cap daily loss. 4) List A+ setups only. If none appear, that is a winning day.",
			true, 0, 35,
		},
		{
			"psychology-process", ModulePsychology, TypeArticle,
			"After a losing streak", "after-a-losing-streak",
			"How verified members reset without revenge trading.",
			"Cut size in half for three sessions. Review only process errors. Do not add a new strategy mid-drawdown. Consistency returns before size does.",
			true, 0, 20,
		},

		// Daily analysis
		{
			"analysis-desk-notes", ModuleDailyAnalysis, TypeArticle,
			"Asia open desk note", "asia-open-desk-note",
			"Range bias into London — levels and invalidation for the session.",
			"Bias: range continuation into London unless we lose yesterday's low. Watch equal highs above the overnight mid. Invalidation: impulsive close through the marked floor with volume.",
			true, 0, 18,
		},
		{
			"analysis-desk-notes", ModuleDailyAnalysis, TypeArticle,
			"London expansion read", "london-expansion-read",
			"Liquidity sweep scenario and the continuation path we favor.",
			"Prefer long only after a sweep of Asia lows and reclaim of the mid. Shorts need a clean break of the London open high with acceptance. Stay flat in the first 15 minutes of noise.",
			true, 0, 12,
		},
		{
			"analysis-desk-notes", ModuleDailyAnalysis, TypeArticle,
			"Gold levels into NY", "gold-levels-into-ny",
			"XAUUSD key zones, reaction plan, and what cancels the bias.",
			"Primary zone above; demand below. If NY opens into premium with no displacement, fade the first spike. Cancel if we accept above the weekly open.",
			true, 0, 6,
		},
		{
			"analysis-desk-notes", ModuleDailyAnalysis, TypeArticle,
			"USD strength checklist", "usd-strength-checklist",
			"Cross-asset cues we use before leaning into USD pairs.",
			"DXY structure, yields tone, and correlated pairs agreeing. One pair alone is not a desk thesis — wait for confluence or reduce size.",
			true, 0, 2,
		},
	}

	for _, def := range items {
		exists, err := s.repo.SlugExists(ctx, def.Slug, nil)
		if err != nil {
			return err
		}
		if exists {
			continue
		}
		cat, ok := bySlug[def.CatSlug]
		if !ok {
			continue
		}
		pub := now.Add(-time.Duration(def.HoursAgo) * time.Hour)
		excerpt, body := def.Excerpt, def.Body
		c := Content{
			ID: uuid.New(), CategoryID: &cat.ID, Module: def.Module, Type: def.Type,
			Title: def.Title, Slug: def.Slug, Excerpt: &excerpt, Body: &body,
			IsPremium: def.Premium, Status: StatusPublished, PublishedAt: &pub, CreatedBy: adminID,
		}
		if def.DurationSec > 0 {
			c.DurationSec = intPtr(def.DurationSec)
		}
		if err := s.repo.CreateContent(ctx, &c); err != nil {
			return err
		}
	}
	return nil
}

// SeedDemoProgress gives verified@ demo a Continue Learning rail.
func (s *service) SeedDemoProgress(ctx context.Context, userID uuid.UUID) error {
	slugs := []struct {
		Slug string
		Pct  float64
		Sec  int
	}{
		{"order-flow-walkthrough", 34, 240},
		{"session-structure-basics", 62, 0},
		{"risk-framing-before-you-click", 18, 90},
	}
	for _, row := range slugs {
		item, err := s.repo.FindContentBySlug(ctx, row.Slug)
		if err != nil {
			if errors.Is(err, ErrNotFound) {
				continue
			}
			return err
		}
		h := &ViewHistory{
			ID:              uuid.New(),
			UserID:          userID,
			ContentID:       item.ID,
			ProgressPct:     row.Pct,
			LastPositionSec: row.Sec,
			Completed:       false,
			LastViewedAt:    time.Now().UTC(),
		}
		if err := s.repo.UpsertHistory(ctx, h); err != nil {
			return err
		}
	}
	return nil
}

func intPtr(v int) *int { return &v }
