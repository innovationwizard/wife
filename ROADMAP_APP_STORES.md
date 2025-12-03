<!--
⚠️ PROTECTED FILE - DO NOT DELETE ⚠️
This file contains the Wife App launch roadmap and should never be deleted.
It belongs to Wife App and is essential for app store submission planning.
-->

# Wife App: App Store & Play Store Launch Roadmap

**Target Timeline:** 10-14 days
**Total Cost:** $124-174
**Goal:** Launch Wife App on Apple App Store and Google Play Store

---

## Overview

Wife App is a task management tool focused on the stakeholder capture feature. The promotional angle: **"Stop nagging. Start tracking."**

This roadmap will guide you through converting your existing Next.js PWA into native iOS and Android apps and submitting them to both app stores.

---

## Phase 1: Choose Your Path (Day 1)

### Option A: Capacitor (RECOMMENDED)
**Why it's better for you:**
- Wraps your existing Next.js app as-is
- Minimal code changes needed
- Uses your current PWA interface
- Single codebase for iOS and Android
- Faster to market (2-3 days vs 1-2 weeks)

**Setup:**
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Wife App" "com.yourname.wifeapp"
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

### Option B: React Native
**Why you probably don't need it:**
- Requires rewriting all components
- More complex setup
- You already have a working PWA
- Longer development time

**Our recommendation: Go with Capacitor.**

---

## Phase 2: Convert to Mobile (Days 2-4)

### 2.1 Install Capacitor
```bash
cd /Users/jorgeluiscontrerasherrera/Documents/_git/wife
npm install @capacitor/core @capacitor/cli
npx cap init "Wife App" "com.yourname.wifeapp" --web-dir=out
```

### 2.2 Configure for Static Export
Update `next.config.ts`:
```typescript
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: 'export',  // Add this
  images: {
    unoptimized: true  // Required for static export
  }
}

export default nextConfig
```

### 2.3 Add Mobile Platforms
```bash
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

### 2.4 Build and Sync
```bash
npm run build
npx cap sync
```

### 2.5 Test on Simulators
```bash
# iOS (requires Xcode on Mac)
npx cap open ios

# Android (requires Android Studio)
npx cap open android
```

### 2.6 Handle Mobile-Specific Issues
- **Voice capture**: Test Web Speech API works on mobile browsers
- **Offline sync**: Verify localStorage works correctly
- **Authentication**: Ensure cookies/sessions work in WebView
- **Status bar**: Add `@capacitor/status-bar` plugin for native feel

---

## Phase 3: Prepare App Assets (Day 5)

### 3.1 App Icon (Required)
**Specifications:**
- Size: 1024x1024px
- Format: PNG
- No transparency
- No rounded corners (Apple adds them)

**Where to create:**
- Design in Figma/Canva
- Use a simple, recognizable icon
- Suggested concept: Wedding ring + checkmark, or clipboard with heart

**Generate all sizes:**
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#ffffff' --ios --android
```

### 3.2 App Screenshots (Required)
**iOS requirements:**
- 6.7" display (1290 x 2796 px) - iPhone 15 Pro Max
- 6.5" display (1284 x 2778 px) - iPhone 14 Plus
- 5.5" display (1242 x 2208 px) - iPhone 8 Plus
- Take 3-5 screenshots showing key features

**Android requirements:**
- Minimum 2 screenshots
- Maximum 8 screenshots
- Format: PNG or JPEG
- Dimensions: 1080 x 1920 px minimum

**Key screens to capture:**
1. Stakeholder capture interface (voice + text)
2. Accountability view (task tracking)
3. Creator workflow/Kanban board
4. A completed task with checkmark

### 3.3 Promotional Text
**App Name:** Wife App

**Short Description (80 chars):**
"Stop nagging. Start tracking. Assign tasks, get updates, stay in sync."

**Full Description:**
```
Wife App makes household task management effortless.

FOR STAKEHOLDERS:
• Capture tasks with voice or text
• Assign to your partner instantly
• Track progress without asking "Is it done yet?"
• Get real-time updates

FOR CREATORS:
• See all assigned tasks in one place
• Drag-and-drop Kanban workflow
• WIP limits keep you focused
• Progress tracking built-in

Perfect for couples, roommates, and families who want to stay organized without the friction.

Key Features:
✓ Voice capture in English & Spanish
✓ Offline-first (works without internet)
✓ Real-time sync
✓ Status tracking (Inbox → Backlog → Todo → Doing → Done)
✓ Accountability dashboard
✓ No ads, no subscriptions

Stop nagging. Start tracking.
```

### 3.4 Keywords (Apple App Store)
Maximum 100 characters, comma-separated:
```
task,todo,couple,household,chores,organize,productivity,family,assign,track
```

### 3.5 Category
- **Primary:** Productivity
- **Secondary:** Lifestyle

### 3.6 Age Rating
- **Rating:** 4+ (Everyone)
- No objectionable content

---

## Phase 4: Legal Requirements (Day 6)

### 4.1 Privacy Policy (REQUIRED)
Both stores require a publicly accessible privacy policy URL.

**Minimum requirements:**
- What data you collect (name, password, tasks)
- How you use it (app functionality only)
- How you store it (Supabase PostgreSQL)
- User rights (data deletion, access)
- Contact information

**Quick solution:**
Use a privacy policy generator:
- [PrivacyPolicies.com](https://www.privacypolicies.com/)
- [Termly](https://termly.io/)
- [FreePrivacyPolicy.com](https://www.freeprivacypolicy.com/)

**Where to host:**
- Add to your Next.js app: `/privacy-policy` route
- Deploy to your domain
- Must be publicly accessible

### 4.2 Terms of Service (RECOMMENDED)
Not strictly required but highly recommended.

**What to include:**
- Acceptable use
- Account termination rights
- Disclaimer of warranties
- Limitation of liability

### 4.3 Support URL (REQUIRED)
Create a simple support page:
- Email contact: support@yourapp.com
- FAQ section
- How to report bugs

**Quick solution:**
Add `/support` route to your Next.js app with a contact form.

---

## Phase 5: Apple App Store Submission (Days 7-11)

### 5.1 Apple Developer Account
**Cost:** $99/year

**Steps:**
1. Go to [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/)
2. Sign in with your Apple ID
3. Complete enrollment (Individual or Organization)
4. Pay $99/year fee
5. Wait for approval (usually 24-48 hours)

### 5.2 App Store Connect Setup
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platform:** iOS
   - **Name:** Wife App
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.yourname.wifeapp
   - **SKU:** wifeapp001

### 5.3 Build and Archive in Xcode
```bash
# Open your project
npx cap open ios

# In Xcode:
# 1. Select "Any iOS Device" as target
# 2. Product → Archive
# 3. Wait for build to complete
# 4. Click "Distribute App"
# 5. Select "App Store Connect"
# 6. Follow prompts to upload
```

### 5.4 Fill Out App Information
In App Store Connect:

**1. App Information:**
- Subtitle (30 chars): "Task management for couples"
- Category: Productivity
- Content Rights: You own all rights

**2. Pricing:**
- Price: Free (or set a price)
- Availability: All countries

**3. App Privacy:**
- Data Collection: Name, Email (if applicable)
- Purpose: App functionality
- Linked to user: Yes
- Used for tracking: No

**4. Version Information:**
- Version: 1.0.0
- Copyright: 2024 Your Name
- Description: (Use promotional text from Phase 3.3)
- Keywords: (Use keywords from Phase 3.4)
- Support URL: https://yourapp.com/support
- Privacy Policy URL: https://yourapp.com/privacy-policy

**5. Build:**
- Select the build you uploaded from Xcode

**6. Screenshots:**
- Upload screenshots from Phase 3.2

**7. Review Information:**
- First Name, Last Name
- Phone Number
- Email
- Demo account (if login required):
  - Username: condor
  - Password: x
  - Notes: "This is the creator account. Stakeholder account: estefani / 2122"

### 5.5 Submit for Review
1. Click "Add for Review"
2. Click "Submit to App Review"
3. Wait 3-5 days for review

**Common rejection reasons:**
- Missing privacy policy
- Broken demo account
- App crashes
- Misleading description

---

## Phase 6: Google Play Store Submission (Days 7-9)

### 6.1 Google Play Console Account
**Cost:** $25 (one-time)

**Steps:**
1. Go to [play.google.com/console](https://play.google.com/console)
2. Sign in with Google account
3. Pay $25 one-time registration fee
4. Complete identity verification
5. Accept developer agreement

### 6.2 Create App
1. In Play Console, click "Create app"
2. Fill in:
   - **App name:** Wife App
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
   - **Declarations:** Complete all required declarations

### 6.3 Build Android Release
```bash
# Generate signing key
keytool -genkey -v -keystore wifeapp.keystore -alias wifeapp -keyalg RSA -keysize 2048 -validity 10000

# Build release APK/AAB in Android Studio:
npx cap open android

# In Android Studio:
# 1. Build → Generate Signed Bundle / APK
# 2. Select Android App Bundle (AAB)
# 3. Create new keystore or use existing
# 4. Build release
```

### 6.4 Fill Out Store Listing
**Main store listing:**
- **App name:** Wife App
- **Short description:** (50 chars) "Task management for couples and families"
- **Full description:** (Use promotional text from Phase 3.3, max 4000 chars)
- **App icon:** 512 x 512 px (32-bit PNG)
- **Feature graphic:** 1024 x 500 px
- **Screenshots:** Upload from Phase 3.2
- **App category:** Productivity
- **Tags:** Productivity, Organization, Task Management

**Contact details:**
- Email: support@yourapp.com
- Phone: (Optional)
- Website: https://yourapp.com

**Privacy policy:**
- URL: https://yourapp.com/privacy-policy

**App content:**
- Target age: Everyone
- Content rating: Complete questionnaire (usually Everyone)
- Privacy & security: Complete data safety form

### 6.5 Content Rating
Complete the IARC questionnaire:
- Violence: None
- Sexual content: None
- Language: None
- Controlled substances: None
- Expected rating: Everyone

### 6.6 Data Safety Form
**Data collected:**
- Account info (name)
- Messages (tasks)

**Data sharing:**
- Not shared with third parties

**Data security:**
- Data encrypted in transit
- Data encrypted at rest (Supabase)
- No way to request data deletion (add this feature or mark as available)

### 6.7 Release
1. Upload AAB file
2. Create release notes: "Initial release of Wife App"
3. Choose rollout: 100% (or staged rollout)
4. Click "Review release"
5. Submit for review
6. Wait 2-3 days (usually faster than Apple)

---

## Phase 7: Post-Launch (Days 12-14)

### 7.1 Marketing
**Quick wins:**
- Share with friends and family who expressed interest
- Post on social media (Twitter, Reddit r/productivity)
- Product Hunt launch
- Submit to app directories (AlternativeTo, Slant)

**App Store Optimization (ASO):**
- Monitor keyword rankings
- Adjust description based on what users search for
- Update screenshots based on most-used features

### 7.2 Monitor Reviews
- Respond to all reviews within 24 hours
- Address bugs immediately
- Feature requests → roadmap

### 7.3 Analytics
Add basic analytics to track:
- Daily active users (DAU)
- Task completion rate
- Voice vs text capture usage
- Retention (7-day, 30-day)

**Recommended tools:**
- Mixpanel (free tier)
- Amplitude (free tier)
- Or build custom with Supabase

### 7.4 Iterate
**Week 1 priorities:**
- Fix any critical bugs reported
- Improve onboarding if users are confused
- Add app rating prompt (after 3 tasks completed)

**Month 1 priorities:**
- Push notifications (when task status changes)
- In-app messaging between stakeholder and creator
- Task templates (common household chores)

---

## Immediate Next Steps (Start Today)

1. **Decision:** Confirm you want to use Capacitor (recommended)
2. **Setup:** Install Capacitor and configure Next.js for static export
3. **Test:** Build and run on iOS simulator and Android emulator
4. **Design:** Create app icon (1024x1024px)
5. **Register:** Apple Developer Account ($99) and Google Play Console ($25)

---

## Cost Breakdown

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Program | $99 | Annual |
| Google Play Console | $25 | One-time |
| Privacy Policy Generator | $0-$50 | One-time (optional) |
| **Total First Year** | **$124-$174** | |
| **Total Subsequent Years** | **$99** | Annual (Apple only) |

---

## Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Choose Path | 1 day | None |
| 2. Convert to Mobile | 2-3 days | Phase 1 complete |
| 3. Prepare Assets | 1 day | Can run parallel with Phase 2 |
| 4. Legal Requirements | 1 day | Can run parallel with Phase 2 |
| 5. Apple Submission | 3-5 days | Phases 2, 3, 4 complete + Apple Dev Account |
| 6. Google Submission | 2-3 days | Phases 2, 3, 4 complete + Google Play Account |
| 7. Post-Launch | Ongoing | Apps approved |
| **Total** | **10-14 days** | |

**Critical path:** Apple review (longest wait time)
**Parallelization opportunity:** Work on Google while waiting for Apple review

---

## Troubleshooting

### "App crashes on launch"
- Check Capacitor config
- Verify `output: 'export'` in next.config.ts
- Test in browser first: `npm run build && npx serve out`

### "Voice capture doesn't work on mobile"
- Test in Safari (iOS) and Chrome (Android) first
- May need to use native plugins: `@capacitor/microphone`
- Check permissions in Info.plist (iOS) and AndroidManifest.xml

### "Apple rejected due to minimum functionality"
- Add more polish to UI
- Ensure 3+ core features work flawlessly
- Provide clear value proposition in description

### "Database connection fails on mobile"
- Verify Supabase URL is accessible from mobile networks
- Check CORS settings in Supabase dashboard
- Test on actual device, not just simulator

---

## Success Metrics

**Week 1:**
- [ ] 10+ downloads
- [ ] 5+ tasks captured
- [ ] Zero crashes

**Month 1:**
- [ ] 100+ downloads
- [ ] 50+ active users
- [ ] 4+ star average rating
- [ ] 10+ reviews

**Month 3:**
- [ ] 500+ downloads
- [ ] 200+ active users
- [ ] Feature in App Store "New Apps We Love" (aspirational)

---

## Resources

### Documentation
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Apple Developer](https://developer.apple.com/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)

### Tools
- [App Icon Generator](https://www.appicon.co/)
- [Screenshot Templates](https://www.mockuphone.com/)
- [Privacy Policy Generator](https://www.freeprivacypolicy.com/)
- [App Store Optimization](https://www.appfollow.io/)

### Community
- [r/SideProject](https://reddit.com/r/SideProject)
- [r/Entrepreneur](https://reddit.com/r/Entrepreneur)
- [Indie Hackers](https://www.indiehackers.com/)
- [Product Hunt](https://www.producthunt.com/)

---

## Notes

This roadmap is based on your current tech stack:
- Next.js 16.0.1
- Supabase PostgreSQL
- Prisma ORM
- NextAuth authentication
- Existing PWA interface

The fastest path to market is Capacitor + your existing code. No need to rebuild from scratch.

**Questions?** Create an issue in the repo or reach out via support channel.

---

**Ready to ship?** Let's do this. Start with Phase 1 and work through each section methodically. You'll have Wife App in both stores within 2 weeks.
