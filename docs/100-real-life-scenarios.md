# CivicPulse — 100 Real-Life Scenarios & How the Product Solves Them

> A persona-driven scenario matrix. Each scenario describes a real person with
> distinct characteristics (age, gender, occupation, tech-literacy, language,
> disability, income, location) facing a genuine civic problem, and maps exactly
> which CivicPulse features solve it.

**Product capability legend (used throughout):**
- **V** = Voice intake (Tamil/English STT + translation)
- **P** = Photo intake (with EXIF GPS anti-fraud)
- **T** = Text intake (multilingual)
- **G** = GPS pin / location picker
- **O** = Offline queue + auto-sync
- **AI** = Auto-classification (drainage/garbage/pothole/streetlight/water)
- **D** = 4D-fusion duplicate detection & merge
- **R** = Smart routing → department + officer + councillor + escalation
- **9S** = 9-step resolution timeline
- **SLA** = SLA timers + escalation
- **N** = SMS/push notifications
- **Vf** = Citizen photo+OTP verification & rating
- **2D** = 2D heatmap
- **3D** = 3D extruded heatmap
- **OP** = Officer portal (ward/zonal/collector/admin)
- **RTI** = RTI-compliant transparency / audit trail

---

## A. Elderly & Low-Tech Citizens (1–12)

| # | Persona | Scenario | Solution |
|---|---------|----------|----------|
| 1 | 72-yr-old widow, Chennai, Tamil-only, no smartphone literacy | Streetlight outside her house dead for a week; dark & unsafe at night | **V** — she speaks in Tamil, Sarvam STT translates; **AI** classifies streetlight→TNEB; **R** routes to ward officer; **N** SMS updates in Tamil; **Vf** she confirms fix by photo |
| 2 | 68-yr-old retired teacher, Madurai, uses only a basic phone | Open manhole on her daily walking route | **V+P** — grandson helps take photo; **AI**→drainage/CMWSSB; **R**→ward officer; **SLA** high-priority 24h; **N** SMS |
| 3 | 80-yr-old farmer, Salem village, illiterate | Water pipeline leak flooding his field path | **V** — speaks in Tamil, no typing needed; **AI**→water/CMWSSB; **R**→ward officer; **O** works even in low-signal village, auto-syncs later |
| 4 | 65-yr-old man, Coimbatore, low vision | Broken footpath slab he trips on daily | **P** — one photo; **AI**→roads/highways; **R**→officer; **Vf** verify; large-text UI + voice guidance |
| 5 | 70-yr-old woman, Trichy, no bank/email | Garbage pile behind her house attracting rats | **V** — voice-only report; **AI**→SWM; **R**→sanitation; **N** SMS; no email needed |
| 6 | 74-yr-old man, Chennai, hearing impaired | Streetlight cable hanging dangerously low | **P+T** — photo + short text; **AI**→TNEB; **R**→officer; **N** visual push alerts (not just audio) |
| 7 | 66-yr-old woman, Kanyakumari, Tamil-only | Drainage blocked, flooding her kitchen during rain | **V** — urgent voice; **AI**→drainage/CMWSSB; **SLA** high; **R**→officer; **N** SMS |
| 8 | 78-yr-old man, Vellore, lives alone | Streetlight flickering, worried about safety | **V** — one voice note; **AI**→TNEB; **R**→officer; **9S** he can see progress without app skills |
| 9 | 63-yr-old woman, Thanjavur, low literacy | Overflowing public bin near temple | **P** — photo; **AI**→SWM; **R**→sanitation; **D** merges with existing reports to raise priority |
| 10 | 71-yr-old man, Erode, no smartphone | Pothole on the only road to the hospital | **V** — family member reports by voice; **AI**→roads; **R**→officer; **SLA** high; **N** SMS |
| 11 | 69-yr-old woman, Tirunelveli, Tamil-only | Water supply irregular, taps dry for days | **V** — voice; **AI**→water/CMWSSB; **R**→officer; **N** SMS; **Vf** confirm when restored |
| 12 | 75-yr-old man, Chennai, uses phone only for calls | Fallen tree branch blocking footpath | **V** — voice; **AI**→corporation; **R**→officer; **O** offline-safe; **N** SMS |

---

## B. Working Professionals & Commuters (13–24)

| # | Persona | Scenario | Solution |
|---|---------|----------|----------|
| 13 | 34-yr-old IT engineer, Chennai, tech-savvy | Pothole on his daily commute causing tyre damage | **P+G** — photo + GPS; **AI**→roads; **R**→officer; **9S** track; **Vf** verify; **2D/3D** see ward pressure |
| 14 | 29-yr-old woman software dev, Bengaluru-based but reports for parents in Coimbatore | Parents' street flooding every monsoon | **T+P** — reports remotely with parents' photo; **AI**→drainage; **R**→officer; **N** she gets updates |
| 15 | 41-yr-old cab driver, Chennai, Tamil+English | Streetlight out on his night route, safety risk | **V** — voice while parked; **AI**→TNEB; **R**→officer; **N** SMS; **Vf** |
| 16 | 38-yr-old nurse, Madurai, shift worker | Garbage not collected on her street for days | **P** — photo on way to shift; **AI**→SWM; **R**→sanitation; **D** merge; **N** |
| 17 | 45-yr-old school teacher, Salem | Broken footpath near school, kids trip | **P+T** — photo + note; **AI**→roads; **R**→officer; **SLA**; **Vf** |
| 18 | 31-yr-old delivery rider, Coimbatore | Manhole cover missing on delivery route | **P+G** — photo + GPS; **AI**→drainage; **R**→officer; **SLA** high; **N** |
| 19 | 52-yr-old bank manager, Trichy | Waterlogging at bank entrance after rain | **P** — photo; **AI**→drainage; **R**→officer; **9S**; **Vf** |
| 20 | 27-yr-old startup founder, Chennai | Illegal dumping of construction waste on vacant plot | **P+G** — photo + GPS; **AI**→SWM; **R**→officer; **RTI** audit trail |
| 21 | 36-yr-old architect, Chennai | Encroachment blocking public footpath | **P** — photo; **AI**→corporation; **R**→officer; **9S**; **RTI** |
| 22 | 48-yr-old HR manager, Coimbatore | Streetlight near office parking dead | **V** — voice; **AI**→TNEB; **R**→officer; **N** |
| 23 | 33-yr-old journalist, Madurai | Multiple potholes on arterial road, wants data | **P** — photo; **AI**→roads; **R**→officer; **2D/3D** visualize; **RTI** export |
| 24 | 40-yr-old shop owner, Salem | Drainage smell from open drain near shop | **P** — photo; **AI**→drainage; **R**→officer; **D** merge; **N** |

---

## C. Students & Young Adults (25–36)

| # | Persona | Scenario | Solution |
|---|---------|----------|----------|
| 25 | 19-yr-old college student, Chennai, heavy app user | Streetlight out on campus road | **P** — photo; **AI**→TNEB; **R**→officer; **9S**; **Vf** |
| 26 | 22-yr-old woman student, Coimbatore | Unsafe dark stretch on her walk home | **P+G** — photo + GPS; **AI**→streetlight; **R**→officer; **SLA**; **N** |
| 27 | 17-yr-old school student, Madurai | Garbage dump near school gate | **P** — photo; **AI**→SWM; **R**→sanitation; **D** merge |
| 28 | 24-yr-old fresh graduate, Chennai | Pothole damaging two-wheelers on his street | **P** — photo; **AI**→roads; **R**→officer; **Vf** |
| 29 | 20-yr-old student, Trichy, uses voice notes a lot | Water leak from public tap wasting water | **V** — voice; **AI**→water; **R**→officer; **N** |
| 30 | 26-yr-old young professional, Salem | Broken streetlight on his jogging route | **P** — photo; **AI**→TNEB; **R**→officer; **9S** |
| 31 | 18-yr-old student, Chennai, low-income | Overflowing drain near bus stop | **P** — photo; **AI**→drainage; **R**→officer; **D** merge |
| 32 | 23-yr-old woman, Coimbatore, reports for elderly neighbour | Neighbour's streetlight dead, neighbour can't use app | **V+P** — she reports by voice + photo; **AI**→TNEB; **R**→officer; **N** |
| 33 | 21-yr-old student, Madurai | Illegal dumping in vacant lot near hostel | **P+G** — photo + GPS; **AI**→SWM; **R**→officer; **RTI** |
| 34 | 25-yr-old gamer, Chennai, prefers text | Pothole on gaming-cafe street | **T** — text; **AI**→roads; **R**→officer; **9S** |
| 35 | 19-yr-old student, Salem | Streetlight flickering near library | **P** — photo; **AI**→TNEB; **R**→officer; **N** |
| 36 | 22-yr-old intern, Chennai | Waterlogging at metro exit | **P** — photo; **AI**→drainage; **R**→officer; **Vf** |

---

## D. Persons with Disabilities (37–44)

| # | Persona | Scenario | Solution |
|---|---------|----------|----------|
| 37 | 45-yr-old wheelchair user, Chennai | Broken ramp / no accessible footpath | **P+T** — photo + text; **AI**→roads; **R**→officer; **SLA**; **Vf** |
| 38 | 38-yr-old blind man, Coimbatore | Streetlight out on his guide-dog route | **V** — voice; **AI**→TNEB; **R**→officer; **N** visual+audio alerts |
| 39 | 50-yr-old deaf woman, Madurai | Garbage pile blocking accessible path | **P+T** — photo + text; **AI**→SWM; **R**→sanitation; **N** visual alerts |
| 40 | 33-yr-old man with limited mobility, Trichy | Pothole near his accessible parking | **P** — photo; **AI**→roads; **R**→officer; **Vf** |
| 41 | 60-yr-old man with arthritis, Salem | Streetlight switch box exposed, hazard | **P** — photo; **AI**→TNEB; **R**→officer; **SLA** high |
| 42 | 28-yr-old woman with low vision, Chennai | Water leak flooding accessible ramp | **V** — voice; **AI**→water; **R**→officer; **N** |
| 43 | 55-yr-old man, hearing impaired, Coimbatore | Drainage overflow near his home | **P+T** — photo + text; **AI**→drainage; **R**→officer; **N** visual |
| 44 | 41-yr-old woman, mobility impaired, Madurai | Streetlight out on her accessible route | **V** — voice; **AI**→TNEB; **R**→officer; **9S** |

---

## E. Rural & Semi-Urban Citizens (45–56)

| # | Persona | Scenario | Solution |
|---|---------|----------|----------|
| 45 | 52-yr-old farmer, Thanjavur village | Irrigation canal blocked | **V** — voice; **AI**→water; **R**→officer; **O** offline-safe |
| 46 | 47-yr-old woman, rural Salem | No streetlight on village main road | **V** — voice; **AI**→TNEB; **R**→officer; **O** |
| 47 | 58-yr-old man, rural Madurai | Water tanker not reaching village | **V** — voice; **AI**→water; **R**→officer; **N** SMS |
| 48 | 35-yr-old woman, rural Coimbatore | Garbage dumping in village pond | **P** — photo; **AI**→SWM; **R**→officer; **RTI** |
| 49 | 62-yr-old man, rural Trichy | Road to village damaged after rain | **P** — photo; **AI**→roads; **R**→officer; **O** |
| 50 | 44-yr-old woman, rural Vellore | Drainage overflow near school | **V** — voice; **AI**→drainage; **R**→officer; **N** |
| 51 | 39-yr-old man, rural Salem | Streetlight out on highway stretch | **P** — photo; **AI**→TNEB; **R**→officer; **SLA** |
| 52 | 55-yr-old woman, rural Madurai | Water supply irregular in village | **V** — voice; **AI**→water; **R**→officer; **N** |
| 53 | 30-yr-old man, rural Coimbatore | Pothole on farm access road | **P** — photo; **AI**→roads; **R**→officer; **Vf** |
| 54 | 48-yr-old woman, rural Trichy | Garbage pile near village well | **P** — photo; **AI**→SWM; **R**→sanitation; **D** |
| 55 | 60-yr-old man, rural Thanjavur | Broken hand pump / water point | **V** — voice; **AI**→water; **R**→officer; **O** |
| 56 | 42-yr-old woman, rural Salem | Streetlight out near village temple | **V** — voice; **AI**→TNEB; **R**→officer; **N** |

---

## F. Business Owners & Vendors (57–68)

| # | Persona | Scenario | Solution |
|---|---------|----------|----------|
| 57 | 46-yr-old restaurant owner, Chennai | Drainage smell affecting customers | **P** — photo; **AI**→drainage; **R**→officer; **D**; **N** |
| 58 | 38-yr-old street vendor, Madurai | Garbage not collected near his stall | **P** — photo; **AI**→SWM; **R**→sanitation; **N** |
| 59 | 50-yr-old textile shop owner, Coimbatore | Streetlight out affecting evening business | **P** — photo; **AI**→TNEB; **R**→officer; **9S** |
| 60 | 43-yr-old pharmacy owner, Salem | Pothole blocking customer access | **P** — photo; **AI**→roads; **R**→officer; **Vf** |
| 61 | 55-yr-old hardware store owner, Trichy | Waterlogging at shop entrance | **P** — photo; **AI**→drainage; **R**→officer; **SLA** |
| 62 | 33-yr-old cafe owner, Chennai | Illegal dumping behind his cafe | **P+G** — photo + GPS; **AI**→SWM; **R**→officer; **RTI** |
| 63 | 49-yr-old vegetable vendor, Coimbatore | Streetlight out at market | **V** — voice; **AI**→TNEB; **R**→officer; **N** |
| 64 | 41-yr-old auto-rickshaw owner, Madurai | Pothole damaging his vehicle | **P** — photo; **AI**→roads; **R**→officer; **Vf** |
| 65 | 37-yr-old salon owner, Salem | Drainage overflow near shop | **P** — photo; **AI**→drainage; **R**→officer; **D** |
| 66 | 52-yr-old grocery owner, Trichy | Garbage pile near shop entrance | **P** — photo; **AI**→SWM; **R**→sanitation; **N** |
| 67 | 44-yr-old bakery owner, Chennai | Water supply irregular affecting baking | **V** — voice; **AI**→water; **R**→officer; **N** |
| 68 | 39-yr-old mobile-repair shop owner, Coimbatore | Streetlight out on his street | **P** — photo; **AI**→TNEB; **R**→officer; **9S** |

---

## G. Government & Civic-Minded Citizens (69–80)

| # | Persona | Scenario | Solution |
|---|---------|----------|----------|
| 69 | 58-yr-old retired government officer, Chennai | Wants to report multiple issues systematically | **P+T** — photo + text; **AI**; **R**; **RTI** audit trail; **2D/3D** |
| 70 | 47-yr-old NGO worker, Madurai | Documents water issues across slums | **P+G** — photo + GPS; **AI**→water; **R**; **2D/3D** visualize; **RTI** |
| 71 | 62-yr-old retired teacher, Coimbatore | Reports streetlight issues for her whole street | **V** — voice; **AI**→TNEB; **R**; **D** merge; **N** |
| 72 | 35-yr-old community organiser, Salem | Coordinates garbage complaints for a colony | **P** — photo; **AI**→SWM; **R**; **D**; **2D** |
| 73 | 51-yr-old ex-serviceman, Trichy | Reports potholes on defence colony road | **P** — photo; **AI**→roads; **R**; **Vf** |
| 74 | 44-yr-old women's group leader, Chennai | Reports drainage issues in her area | **V** — voice; **AI**→drainage; **R**; **N** |
| 75 | 39-yr-old RTI activist, Madurai | Wants transparency on road repair | **P** — photo; **AI**→roads; **R**; **RTI** export; **9S** |
| 76 | 56-yr-old retired banker, Coimbatore | Reports water wastage from leak | **P** — photo; **AI**→water; **R**; **Vf** |
| 77 | 48-yr-old panchayat member, Salem | Reports village infrastructure issues | **V** — voice; **AI**; **R**; **O** offline |
| 78 | 42-yr-old school PTA president, Trichy | Reports safety hazards near school | **P** — photo; **AI**→roads; **R**; **SLA** |
| 79 | 37-yr-old resident welfare head, Chennai | Aggregates streetlight complaints for a block | **P** — photo; **AI**→TNEB; **R**; **D**; **2D/3D** |
| 80 | 53-yr-old retired nurse, Madurai | Reports garbage near hospital | **P** — photo; **AI**→SWM; **R**; **N** |

---

## H. Migrants, Daily-Wage & Marginalised (81–92)

| # | Persona | Scenario | Solution |
|---|---------|----------|----------|
| 81 | 29-yr-old migrant worker (Hindi-speaking), Chennai | Streetlight out in labour colony | **V** — speaks Hindi, translated; **AI**→TNEB; **R**; **N** |
| 82 | 34-yr-old daily-wage labourer, Coimbatore | Garbage pile near his hut | **P** — photo; **AI**→SWM; **R**; **N** |
| 83 | 26-yr-old migrant woman, Madurai | Water supply irregular in colony | **V** — voice; **AI**→water; **R**; **O** |
| 84 | 40-yr-old construction worker, Salem | Pothole on road to worksite | **P** — photo; **AI**→roads; **R**; **Vf** |
| 85 | 31-yr-old domestic worker, Chennai | Drainage overflow near her home | **V** — voice; **AI**→drainage; **R**; **N** |
| 86 | 45-yr-old fisherman, coastal village | Garbage dumped on beach | **P** — photo; **AI**→SWM; **R**; **RTI** |
| 87 | 28-yr-old migrant worker (Bengali), Trichy | Streetlight out in camp | **V** — voice; **AI**→TNEB; **R**; **N** |
| 88 | 36-yr-old rickshaw puller, Madurai | Pothole damaging his rickshaw | **P** — photo; **AI**→roads; **R**; **Vf** |
| 89 | 32-yr-old migrant woman, Coimbatore | Water leak flooding her lane | **V** — voice; **AI**→water; **R**; **O** |
| 90 | 50-yr-old waste-picker, Salem | Garbage not collected, health risk | **P** — photo; **AI**→SWM; **R**; **N** |
| 91 | 27-yr-old migrant worker (Odia), Chennai | Drainage blocked in colony | **V** — voice; **AI**→drainage; **R**; **N** |
| 92 | 43-yr-old daily-wage woman, Trichy | Streetlight out near her workplace | **V** — voice; **AI**→TNEB; **R**; **N** |

---

## I. Tourists, Visitors & Remote Reporters (93–100)

| # | Persona | Scenario | Solution |
|---|---------|----------|----------|
| 93 | 35-yr-old tourist (English), Chennai | Pothole near heritage site | **T+P** — text + photo; **AI**→roads; **R**; **Vf** |
| 94 | 28-yr-old visitor, Madurai | Garbage near temple | **P** — photo; **AI**→SWM; **R**; **N** |
| 95 | 40-yr-old NRI (reports for family), Coimbatore | Parents' streetlight out | **T** — text remotely; **AI**→TNEB; **R**; **N** |
| 96 | 33-yr-old tourist (Hindi), Salem | Waterlogging at bus stand | **P** — photo; **AI**→drainage; **R**; **N** |
| 97 | 45-yr-old visiting doctor, Trichy | Streetlight out near hospital | **P** — photo; **AI**→TNEB; **R**; **9S** |
| 98 | 30-yr-old traveller, Chennai | Illegal dumping on scenic road | **P+G** — photo + GPS; **AI**→SWM; **R**; **RTI** |
| 99 | 38-yr-old returning resident, Madurai | Multiple issues after long absence | **P** — photo; **AI**; **R**; **2D/3D** see ward status |
| 100 | 25-yr-old student abroad (reports for home), Coimbatore | Family's water supply issue | **T** — text; **AI**→water; **R**; **N** |

---

## Summary of Coverage

**Persona diversity:** age 17–80, both genders, urban/rural, tech-savvy to illiterate,
Tamil/Hindi/Bengali/Odia/English speakers, persons with disabilities (mobility, vision,
hearing), migrants, daily-wage workers, business owners, government/civic-minded,
tourists/NRIs.

**Issue types covered:** streetlights (TNEB), potholes/roads (Highways), garbage/SWM,
drainage/waterlogging (CMWSSB), water supply (CMWSSB), manholes, encroachment,
illegal dumping, public safety.

**Every scenario maps to at least one CivicPulse capability** — most use 3–5 features
(voice/photo intake → AI classification → smart routing → SLA tracking → notification →
citizen verification), and the 3D/2D heatmaps + RTI audit trail serve the civic-minded
and data-driven personas.
