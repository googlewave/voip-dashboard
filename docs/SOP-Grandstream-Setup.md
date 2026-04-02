# SOP: Grandstream ATA Setup with RingRing SaaS Admin Portal

**Service:** RingRing SaaS  
**Document Type:** Standard Operating Procedure  
**Applies To:** All technicians onboarding new customers with a Grandstream ATA + analog phone

---

## Overview

This SOP covers the full process of setting up a Grandstream Analog Telephone Adapter (ATA) connected to a standard analog phone, from account creation through device provisioning and handoff to the customer. Follow every step in order.

---

## Required Information (Collect Before Starting)

Before beginning, gather the following from the customer:

| Field | Example |
|---|---|
| Customer email address | jane@acme.com |
| Desired plan | Free / Pro |
| Area code for phone number | 302 |
| E911 customer name | Jane Smith |
| E911 street address | 123 Main St |
| E911 city | Philadelphia |
| E911 state (2-letter) | PA |
| E911 ZIP code | 19103 |
| Contacts to whitelist / quick dial | Name + phone number for each |

> ⚠️ **E911 address is mandatory.** Twilio charges $75 per 911 call if no address is on file. Do not skip this.

---

## Equipment Needed

- Grandstream ATA (HT801 / HT802 or compatible model)
- Standard analog telephone (RJ-11)
- Ethernet cable
- Internet router/switch with available LAN port
- Laptop/tablet with access to the RingRing admin portal

---

## Step 1 — Physical Setup

1. Connect the **analog phone** to the **PHONE 1** (FXS) port on the Grandstream unit using an RJ-11 cable.
2. Connect an **Ethernet cable** from the Grandstream's **LAN** port to the customer's router or switch.
3. Plug in the **power adapter** and wait ~60 seconds for the unit to fully boot (power LED steady).
4. **Find the device IP address:**
   - Pick up the analog phone handset.
   - Dial `* 0 2` — the unit will read the IP address aloud.
   - Write it down (e.g., `192.168.1.105`).

---

## Step 2 — Create the Customer Account in the Admin Portal

1. Open the **RingRing admin portal** (e.g., `https://voip-dashboard-sigma.vercel.app/admin`).
2. Click **+ Add User** in the top-right corner.
3. Fill in:
   - **Email** — customer's email address
   - **Password** — set a temporary password (customer can change later)
   - **Plan** — Free or Pro as agreed
4. Click **Create User**.
5. Confirm the new user appears in the user list.

---

## Step 3 — Add the Grandstream Device

1. Find the customer in the user list and click **▼ Manage** to expand their account.
2. Under **📱 Devices**, click **+ Add Device**.
3. Fill in:
   - **Name** — something descriptive (e.g., `Office Desk Phone`)
   - **Type** — select **Grandstream**
4. Click **Add**.
5. Confirm the device appears under the customer's devices with `(grandstream)` shown.

---

## Step 4 — Provision a Phone Number

1. In the expanded customer view, locate the **📞 Phone Number** section.
2. Fill in all fields:
   - **Area Code** — 3-digit area code
   - **Customer Name** — full legal name for E911
   - **Street** — street address
   - **City** — city
   - **State** — 2-letter state abbreviation
   - **ZIP** — 5-digit ZIP code
3. Click **+ Provision Number**.
4. Wait for the page to reload. The customer's Twilio number will appear in green (e.g., `📞 +13025551234`).

> If provisioning fails, verify the area code has available numbers and the E911 fields are all filled in correctly.

---

## Step 5 — Create SIP Credentials

1. Locate the Grandstream device row under the customer's devices.
2. Click **Create SIP**.
3. A green box will appear showing:
   - **SIP Username**
   - **SIP Password**
4. **Save these credentials immediately** — the password is shown only once and cannot be retrieved later.
   - Screenshot or write them down securely.
5. The device row will now show **✅ SIP Active**.

---

## Step 6 — Add Whitelisted Contacts & Quick Dial Slots

The dial plan on the Grandstream is locked to **only allow outbound calls to whitelisted numbers plus 911/933**. Every number the customer needs to call must be added here.

1. Click **⚡ Quick Dial** on the device row to expand the contact panel.
2. For each contact to add:
   - Enter the **Name** (e.g., `Dr. Johnson`)
   - Enter the **Phone Number** (e.g., `+13025559876`)
   - Select a **Slot** (1–9) if the contact should be a speed dial button, or leave blank for whitelist-only
3. Click **+ Add**.
4. Repeat for all contacts.
5. Quick dial assignments are shown in the slot grid (slots 1–9).

> **Speed dial usage on the phone:** The customer dials `#1` through `#9` to reach the contact assigned to that slot (behavior depends on Grandstream model/FXS key mapping).

---

## Step 7 — Copy the Provisioning URL

1. On the device row, click **📋 Copy URL**.
2. The URL is now in your clipboard. It will look like:
   ```
   https://voip-dashboard-sigma.vercel.app/api/provision/abc123-device-id/grandstream.cfg
   ```
3. Keep this URL handy — it goes into the Grandstream in the next step.

---

## Step 8 — Apply Provisioning Config to the Grandstream

1. On your laptop, open a browser and go to `http://<device-ip>` (the IP found in Step 1).
2. Log in with admin credentials:
   - **Username:** `admin`
   - **Password:** `admin` (default — or check the label on the bottom of the unit)
3. Navigate to **Maintenance → Upgrade and Provisioning**.

   > ⚠️ **IMPORTANT — Prevent GAPS from overwriting your Config Server Path.**  
   > Grandstream devices contact `fm.grandstream.com/gs` (GAPS) on reboot and will reset the Config Server Path to its default. The setting that controls this is named differently depending on firmware version. Use whichever option matches what you see on your device.

   **Option A — Field is visible (older firmware):**
   - Find **Allow GAPS Override** and set it to **No**.

   **Option B — Field is not present (newer firmware):**
   - Look under the **Advanced Settings** tab for a field called **Automatic Provisioning**, **Provisioning Mode**, or **3CX Auto Provision** and set it to **Disabled** / **No**.

   **Option C — Neither field exists:**
   - Block `fm.grandstream.com` at the customer's router/firewall level before proceeding. This prevents the device from reaching GAPS entirely.
   - Alternatively, perform a **factory reset** on the unit, then immediately set the Config Server Path before the device has time to contact GAPS.

4. Find the **Config Server Path** field and **clear** any existing value (`fm.grandstream.com/gs` or similar).
5. **Paste the provisioning URL** from Step 7 into the **Config Server Path** field.
   ```
   https://voip-dashboard-sigma.vercel.app/api/provision/abc123-device-id/grandstream.cfg
   ```
6. Set **Upgrade Via** to `HTTPS`.
7. Set **Always Check for New Firmware** to `No`.
8. Set **Automatic Upgrade** to `No`.
9. Click **Save and Apply**.
10. The Grandstream will reboot automatically (~60 seconds).

   > Once the device successfully downloads the RingRing config file, auto-provisioning is disabled within the config itself — so GAPS will no longer override the settings on subsequent reboots.

---

## Step 9 — Verify Registration

After the Grandstream reboots:

1. **In the admin portal:** The device row should still show **✅ SIP Active**. Refresh if needed.
2. **On the Grandstream web UI:** Go to **Status** — the account should show `Registered`.
3. **On the analog phone:** Pick up the handset — you should hear a dial tone.
4. **Test a call:** Dial a whitelisted number to confirm audio works in both directions.
5. **Test 911 pass-through:** Dial `933` (Twilio test number) — confirm it connects without error.

> If the device shows `Not Registered`, double-check the provisioning URL was entered correctly and that SIP was created (Step 5). You can click **🔄 Reset SIP** in the portal to regenerate credentials, then re-provision.

---

## Step 10 — Enable the Device

1. In the admin portal, confirm the device status indicator is **green**.
2. If the device shows as disabled (gray dot), click **▶ Enable** on the device row.

---

## Step 11 — Customer Handoff Checklist

Before handing off to the customer, confirm the following:

- [ ] Analog phone has a dial tone
- [ ] Customer can dial a whitelisted contact
- [ ] Customer cannot dial unapproved numbers (test with a non-whitelisted number — should receive fast busy)
- [ ] 911 is reachable (dial 933 to verify)
- [ ] Quick dial slots work as expected (if configured)
- [ ] Customer has been given their phone number
- [ ] E911 address is confirmed correct
- [ ] Customer has been given login credentials (email + temporary password)

---

## Troubleshooting Reference

| Symptom | Likely Cause | Fix |
|---|---|---|
| No dial tone | Grandstream not registered | Re-check provisioning URL; reset SIP |
| Call fails to unapproved number | Expected — dial plan working correctly | Add number as a whitelisted contact |
| Call fails to whitelisted number | Contact phone number format issue | Re-enter number with country code (`+1XXXXXXXXXX`) |
| Provisioning URL returns 404 | SIP not yet created | Complete Step 5 first |
| Grandstream web UI unreachable | Wrong IP or unit not booted | Redial `* 0 2` on analog phone to hear IP again |
| Config Server Path reverts to `fm.grandstream.com/gs` | GAPS override is enabled (default) | Set **Allow GAPS Override** to **No** before saving the Config Server Path |
| "SIP not provisioned" on Copy URL | SIP credentials missing | Click Create SIP on the device row |
| Number provisioning fails | Area code unavailable or E911 missing | Try adjacent area code; ensure all E911 fields filled |

---

## Notes

- The provisioning URL is **unauthenticated by device ID** — treat it as confidential. Do not share it publicly.
- To update the dial plan or quick dial slots after handoff: add/remove contacts in the admin portal, then repeat Steps 7–8 to re-provision.
- If a customer needs more than 9 quick dial slots, only the first 9 assigned slots will map to speed dial; additional contacts remain whitelisted for outbound dialing only.

---

---

# SOP — Linksys SPA2102 Setup

Follow Steps 1–6 of the Grandstream SOP identically (create user, device, purchase number, assign number, create SIP, add contacts). When you reach Step 7, use this section instead.

---

## SPA2102 Step 7 — Copy the Provisioning URL

1. On the device row in the admin portal, confirm **adapterType** is set to `linksys`. If not, update it.
2. Click **📋 Copy URL** — the URL will look like:
   ```
   https://voip-dashboard-sigma.vercel.app/api/provision/abc123-device-id/linksys.cfg
   ```
3. Keep this URL handy — it goes into the SPA2102 in the next step.

---

## SPA2102 Step 8 — Find the Device IP

1. With an analog phone connected to **Phone 1** port, pick up the handset.
2. Dial `****` (four stars) — you will hear the IVR menu.
3. Dial `110#` to hear the IP address.
4. Open a browser and go to `http://<device-ip>`.

---

## SPA2102 Step 9 — Apply Provisioning Config

1. Log in to the SPA2102 web UI:
   - **Username:** `admin`
   - **Password:** `admin` (default)
2. Click the **Admin Login** link (top right) if in basic mode, then click **Advanced**.
3. Go to **Provisioning** tab.
4. Set the following fields:

   | Field | Value |
   |---|---|
   | **Profile Rule** | `https://voip-dashboard-sigma.vercel.app/api/provision/{deviceId}/linksys.cfg` |
   | **Resync On Reset** | `Yes` |
   | **Resync Periodic** | `0` (disables repeat after first sync) |
   | **Force Resync** | `Yes` |

5. Click **Submit All Changes** — the device will reboot and pull the cfg.

   > The cfg sets `<Provision_Enable>no</Provision_Enable>` so the device won't re-provision on subsequent reboots.

---

## SPA2102 Step 10 — Verify Registration

1. After reboot (~30 seconds), go back to `http://<device-ip>`.
2. Go to **Info** tab → **Line 1 Status** should show `Registered`.
3. Check **Twilio Console → Monitor → Logs → SIP Registration** for a successful entry.
4. Pick up the analog phone — you should hear a dial tone.

---

## SPA2102 Troubleshooting Reference

| Symptom | Likely Cause | Fix |
|---|---|---|
| No dial tone | SPA2102 not registered | Check Line 1 Status in Info tab; reset SIP and re-provision |
| `Not Registered` in Info tab | Wrong SIP domain or credentials | Reset SIP in admin portal, re-provision |
| No log in Twilio SIP Registration | Firewall blocking port 5060 | Disable SIP ALG on router; cfg uses TCP which helps |
| Provisioning fails | Profile Rule URL wrong | Confirm device ID in URL is correct |
| Web UI unreachable | Wrong IP | Dial `****` then `110#` on analog phone |
| Call blocked to whitelisted number | Number format issue | Re-enter with country code `+1XXXXXXXXXX` |
