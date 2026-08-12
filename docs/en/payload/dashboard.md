# Dashboard & User Manual

Welcome to Payload CMS Administration Panel!

## System Plugins Architecture

Below is the architectural diagram of the 5 ecosystem plugins:

![Payload Architecture Diagram](/docs/architecture.png)

### Interactive Mermaid Diagram

```mermaid
graph TD
  A["User Request"] --> B["Payload CMS Admin"]
  B --> C["Theme Plugin (Zero Flash)"]
  B --> D["Self Storage Plugin"]
  D --> E["On-Demand WebP Files"]
  B --> F["Contextual Manual Plugin"]
```

---

## Quick Navigation

- 📁 **[Go to Media Collection Guide](#doc:collections/media)**
- 🌐 **[Payload CMS Documentation (External Link)](https://payloadcms.com)**

## Keyboard Shortcuts
- `⌘ /` or `Ctrl + /` — Toggle this manual modal
- `Esc` — Close help modal
- `⌘ Enter` — Quick save current document
