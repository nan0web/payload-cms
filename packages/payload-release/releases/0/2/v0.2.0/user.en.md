# v0.2.0: Interactive Product Tour & Release Onboarding

## User Overview
In the **v0.2.0** release, `@nan0web/payload-release` introduces an interactive guided product tour (Product Tour & Onboarding). Following any new release of the plugin or project, admin panel users can embark on an interactive walkthrough highlighting newly added views, fields, and workflows.

### What's New:
1. **Interactive Spotlight Highlighting:** Interface targets are highlighted with smooth dark backdrop and SVG focus masks, immediately drawing attention to key areas.
2. **Real-Time Interactive Actions:** The tour supports both passive reading (`next`) and interactive actions (`click`, `select`, `fill`), seamlessly guiding users across pages and forms.
3. **Declarative Tour Manifests:** Each release directory contains its own `tour.nan0` manifest (and localized `uk/tour.nan0` / `en/tour.nan0` files), keeping specification and UX tightly coupled with version history.
4. **Resilient Progress Tracking:** Completion status is stored via dual-layer caching (LocalStorage + User Preferences), preventing repetitive popups while permitting on-demand re-launches at any time.
