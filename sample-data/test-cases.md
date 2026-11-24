# Sample Test Data (type these during testing / demo)

Use these inputs in **AI Assistant** or **New Service Request**. Expected AI behaviour is a guide — Gemini's exact wording will differ each time.

| # | Brand / Model / Year | Reg. No. | Fuel | Problem description | Expected urgency | Expected inspection |
|---|---|---|---|---|---|---|
| 1 | Maruti Suzuki / Swift VXi / 2019 | KA 01 MK 4521 | Petrol | Grinding metal noise when I press the brake pedal, and the car pulls slightly to the left while braking. | High | Yes |
| 2 | Hyundai / Creta SX / 2021 | KA 05 NB 7788 | Diesel | The AC is blowing warm air even on the coldest setting. The fan works but there is no cooling. | Low–Medium | Yes |
| 3 | Tata / Nexon / 2020 | KA 51 TN 3301 | Petrol | The temperature gauge goes near the red mark in traffic and I can smell something sweet from the bonnet. | High | Yes |
| 4 | Honda / Activa 6G / 2022 | KA 03 HR 2210 | Petrol | The scooter takes many attempts to start in the morning and the horn sounds weak. | Medium | Yes |
| 5 | Royal Enfield / Classic 350 / 2018 | KA 02 RE 9090 | Petrol | Engine check light is on and the bike jerks when I accelerate at low speed. | Medium | Yes |
| 6 | Toyota / Innova Crysta / 2017 | KA 04 TY 1122 | Diesel | Slight squeak from the front when going over speed bumps. No other issues. | Low | Maybe |
| 7 | (invalid) Kia / Seltos / 1900 | KA 01 XX 0001 | Petrol | Noise | — | Form shows validation warnings |
| 8 | Any | Any | Any | "What is the capital of France?" | Low | AI says it is not a vehicle problem |

## Accounts to create for testing
| Role | Email (example) | How |
|---|---|---|
| Customer | customer1@test.com | Register on `register.html` |
| Admin | admin@test.com | Put this email in the `ADMIN_EMAILS` environment variable, then register it (DEMO_GUIDE.md step 4) |

## sample-requests.json
Example records showing the shape of a service request and a full AI analysis (stored in the `ai_analysis` JSONB column). Use them as a reference.
