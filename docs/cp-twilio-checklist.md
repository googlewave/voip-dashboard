# Twilio SIP Configuration - Simplified Checklist

## Enterprise-Grade Authentication (Credential-Based)

**Note:** We use credential-based authentication (username/password), NOT IP whitelisting. This scales to unlimited devices and works from any network.

See `docs/enterprise-sip-authentication.md` for detailed explanation.

---

## One-Time Twilio Setup (Do Once)

### 1. Create Credential List (2 minutes)

**Navigate to Credential Lists:**
1. Go to [Twilio Console](https://console.twilio.com)
2. In left sidebar: **Develop** → **Voice** → **Manage** → **Credential Lists**
3. Or direct link: https://console.twilio.com/us1/develop/voice/manage/credential-lists

**Create the list:**
- [ ] Click "Create new Credential List" (blue button)
  - Friendly Name: `RingRing Users`
  - Click "Create"
- [ ] Save the **Credential List SID** (starts with `CL...`)
- [ ] Add to Vercel env vars: `TWILIO_SIP_CRED_LIST_SID=CL...`

---

### 2. Configure SIP Domain (3 minutes)

**Navigate to SIP Domains:**
1. Go to [Twilio Console](https://console.twilio.com)
2. In left sidebar: **Develop** → **Voice** → **Manage** → **SIP Domains**
3. Or direct link: https://console.twilio.com/us1/develop/voice/manage/sip-domains

**Configure the domain:**
- [ ] Find or create domain: `ringringclub.sip.us1.twilio.com`
  - If creating: Click "Create new SIP Domain" → Enter domain name → Create
- [ ] Click on the domain name to open settings

**Enable SIP Registration:**
- [ ] Scroll to **SIP Registration** section:
  - Toggle to "Enabled" ✓

**Configure Call Control (Webhooks):**
- [ ] Scroll to **Call Control Configuration** section:
  - **Configure With:** Click dropdown → Select "Webhooks, TwiML Bins, Functions, Studio, Proxy"
  - **A Call Comes In:**
    - Click the dropdown on the left → Select **"Webhook"** (not TwiML Bin, Function, or Studio)
    - **HTTP Method:** Change from "HTTP GET" to **"HTTP POST"**
    - **Webhook URL:** `https://voip-dashboard-sigma.vercel.app/api/twilio/voice`
  - **Primary Handler Fails (optional):**
    - **HTTP Method:** HTTP POST
    - **Fallback URL:** `https://voip-dashboard-sigma.vercel.app/api/twilio/voice`
  - **Call Status Changes (optional):** Leave blank for now

**Attach Credential List:**
- [ ] Scroll to **Voice Authentication** section (or **Credential Lists** section):
  - Click "Add a Credential List" button
  - Select: `RingRing Users`
  - Click "Add"

**Save Configuration:**
- [ ] Scroll to bottom of page
- [ ] Click "Save" button

**That's it!** No IP ACLs needed. Devices authenticate with credentials.

---

## Per-Device Setup (Automated)

**The auto-provisioning system handles this automatically:**

1. ✅ Creates unique SIP credentials in Twilio
2. ✅ Adds credentials to credential list
3. ✅ Provisions device with credentials
4. ✅ Device registers with Twilio
5. ✅ Works from any IP address

**No manual steps needed per device.**

---

## Troubleshooting CP's Device

### 1. Check Twilio Debugger (2 minutes)

**Navigate to Error Logs:**
1. Go to [Twilio Console](https://console.twilio.com)
2. In left sidebar: **Monitor** → **Logs** → **Errors**
3. Or direct link: https://console.twilio.com/us1/monitor/logs/errors

**Search for issues:**
- [ ] Set time range: Last 24 hours
- [ ] In search box, try searching for device ID or SIP username
- [ ] Look for error codes:
  - 403 Forbidden → Credential not in credential list
  - 404 Not Found → Invalid number format
  - 484 Address Incomplete → Dial plan issue
- [ ] Copy exact error message to share with CP

---

### 2. Verify CP's SIP Credentials Exist (2 minutes)

**Navigate to Credential Lists:**
1. Go to [Twilio Console](https://console.twilio.com)
2. In left sidebar: **Develop** → **Voice** → **Manage** → **Credential Lists**
3. Or direct link: https://console.twilio.com/us1/develop/voice/manage/credential-lists

**Check credentials:**
- [ ] Click on `RingRing Users` (should match `TWILIO_SIP_CRED_LIST_SID` from Vercel)
- [ ] Look for username: `sip_3abdb1_1773515304964`
- [ ] Verify it's listed and active
- [ ] If missing, click "Add Credential" button:
  - Username: `sip_3abdb1_1773515304964`
  - Password: `0konnd4l1sxoA1!`
  - Click "Add"

---

### 3. Verify SIP Domain Configuration (2 minutes)

**Navigate to SIP Domains:**
1. Go to [Twilio Console](https://console.twilio.com)
2. In left sidebar: **Develop** → **Voice** → **Manage** → **SIP Domains**
3. Or direct link: https://console.twilio.com/us1/develop/voice/manage/sip-domains

**Verify configuration:**
- [ ] Click on domain: `ringringclub.sip.us1.twilio.com`
- [ ] Check **Voice Configuration** section:
  - SIP Registration: Should be "Enabled" ✓
  - Request URL: Should point to your webhook
- [ ] Check **Credential Lists** section:
  - Should show `RingRing Users` attached
  - If not, click "Add a Credential List" and select it

**If anything is missing, go back to "One-Time Setup" section above.**

---

## Response to CP

After checking the configuration, send this to CP:

```
Hey CP,

I've verified the Twilio configuration. Your device should be able to register now.

**Configuration Status:**
✓ SIP credentials created and active
✓ Credential list configured on SIP domain
✓ Auto-provisioning URL ready

**Your Provisioning URL:**
https://voip-dashboard-sigma.vercel.app/api/provision/auto/9cfb58dd-5966-4255-91aa-3ca2b23abdb1?type=linksys

**Next Steps for You:**
1. Access Linksys web UI: http://[your-linksys-ip]/admin
2. Go to Admin tab → Upgrade section
3. Enter the URL above in "Upgrade Via" field
4. Click "Upgrade"
5. Wait for device to download config and reboot (2-3 minutes)
6. Check Info tab → Line 1 → Registration State should show "Registered"
7. Test outbound call to (203) 598-9541
8. Test inbound call from your cell

**If registration fails:**
- Check Linksys System Log for errors
- Share screenshot of Info tab → Line 1 section
- Let me know any error messages

The device will work from any IP address - no network configuration needed on your end.

Bob
```

---

## Common Error Codes & Fixes

| Error Code | Meaning | Fix |
|------------|---------|-----|
| 403 Forbidden | Credential rejected | Verify credential is in credential list attached to trunk |
| 404 Not Found | Number not found | Check dial plan - likely prefix issue with emergency numbers |
| 484 Address Incomplete | Invalid number format | Remove `+` prefix for 911, or use conditional prefix |
| 408 Request Timeout | Registration timeout | Check NAT/firewall, verify STUN is working |
| 503 Service Unavailable | Trunk not configured | Verify trunk exists and is linked to SIP domain |

---

## Quick Test Commands

### Check if credential exists in Twilio:
```bash
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/SIP/CredentialLists.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```

### Check SIP domain configuration:
```bash
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/SIP/Domains/ringringclub.sip.us1.twilio.com.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```

---

## Expected Working State

When everything is configured correctly:

**Linksys Status Page:**
- Registration State: `Registered`
- Proxy: `ringringclub.sip.us1.twilio.com:5060`
- User ID: `sip_3abdb1_1773515304964`

**Outbound Test:**
- Dial `12035989541` (CP's cell)
- Should hear ringing, not fast busy

**Inbound Test:**
- Call Twilio number from external phone
- Linksys should ring

---

## Files Reference

- **Troubleshooting Guide:** `/docs/troubleshooting-cp-linksys.md`
- **Linksys Provisioning:** `/api/provision/[deviceId]/linksys.cfg`
- **SOP:** `/docs/SOP-Grandstream-Setup.md` (also covers Linksys)
