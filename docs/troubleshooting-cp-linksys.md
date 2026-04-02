# Troubleshooting CP's Linksys SPA2102 Setup

## Current Status
- **Device:** Linksys SPA2102
- **SIP Credentials:** sip_3abdb1_1773515304964
- **Password:** 0konnd4l1sxoA1!
- **Public IP:** 71.162.139.120
- **Symptoms:**
  - Outbound: Fast busy signal (call rejected by Twilio)
  - Inbound: Calls from external numbers fail to reach device
  - Registration: Device appears to be handshaking successfully

## Root Cause Analysis

Based on the symptoms, the most likely issues are:

### 1. **Missing Twilio Elastic SIP Trunk Configuration**

The Linksys is trying to register directly to `ringringclub.sip.us1.twilio.com`, but Twilio requires:
- **Credential List** configured on the SIP domain
- **IP Access Control List** (ACL) for inbound calls
- **Origination URL** for routing inbound calls

### 2. **Dial Plan Prefix Issue**

The Linksys config has:
```xml
<Dial_Plan_Prefix_1_>+</Dial_Plan_Prefix_1_>
```

This prefixes ALL dialed numbers with `+`, but the dial plan is:
```xml
<Dial_Plan_1_>(911|933|{approved_numbers})</Dial_Plan_1_>
```

**Problem:** If CP dials `911`, it becomes `+911`, which Twilio rejects.

## Immediate Actions Needed

### Step 1: Check Twilio Debugger

Go to: **[Twilio Console → Monitor → Logs → Errors & Warnings](https://console.twilio.com/us1/monitor/logs/errors)**

Look for recent SIP errors from:
- Username: `sip_3abdb1_1773515304964`
- IP: `71.162.139.120`

**Expected Error Codes:**
- **403 Forbidden** → Credential not in credential list
- **404 Not Found** → Dial plan issue or invalid number format
- **484 Address Incomplete** → Dial plan prefix issue

### Step 2: Verify Twilio SIP Domain Configuration

Go to: **[Twilio Console → Elastic SIP Trunking → Trunks](https://console.twilio.com/us1/develop/sip-trunking/trunks)**

**Check:**
1. **Trunk exists** for `ringringclub.sip.us1.twilio.com`
2. **Origination** tab:
   - Origination SIP URI: `sip:ringringclub.sip.us1.twilio.com`
   - Priority: 10
   - Weight: 10
   - Enabled: ✓
3. **Termination** tab:
   - IP Access Control List includes `71.162.139.120`
   - SIP Registration: Enabled
   - Credential List: Contains `sip_3abdb1_1773515304964`

### Step 3: Verify Credential List

Go to: **[Twilio Console → Elastic SIP Trunking → Credential Lists](https://console.twilio.com/us1/develop/sip-trunking/credential-lists)**

**Verify:**
- Credential List SID: `CL...` (from env var `TWILIO_SIP_CRED_LIST_SID`)
- Contains credential: `sip_3abdb1_1773515304964`
- Password matches: `0konnd4l1sxoA1!`
- Status: Active

### Step 4: Add IP to Access Control List

Go to: **[Twilio Console → Elastic SIP Trunking → IP Access Control Lists](https://console.twilio.com/us1/develop/sip-trunking/ip-access-control-lists)**

**Add CP's IP:**
- Friendly Name: `CP Home`
- IP Address: `71.162.139.120`
- Subnet Mask: `32` (single IP)

Then attach this ACL to the trunk's Termination settings.

## Configuration Fixes

### Fix 1: Update Dial Plan to Handle Emergency Numbers

The current dial plan prefix breaks emergency calls. We need to modify the Linksys config:

**Option A: Remove prefix for emergency numbers**
```xml
<Dial_Plan_1_>(911|933|<:+1>[2-9]XXXXXXXXX)</Dial_Plan_1_>
<Dial_Plan_Prefix_1_></Dial_Plan_Prefix_1_>
```

**Option B: Use conditional prefix (better)**
```xml
<Dial_Plan_1_>(911|933|<:+1>{approved_numbers})</Dial_Plan_1_>
```

This prefixes only approved numbers, not emergency numbers.

### Fix 2: Verify SIP Transport

Linksys is configured for TCP:
```xml
<SIP_Transport_1_>TCP</SIP_Transport_1_>
<SIP_Port_1_>5060</SIP_Port_1_>
```

**Verify Twilio supports TCP** (it does, but UDP is more common). If issues persist, try UDP:
```xml
<SIP_Transport_1_>UDP</SIP_Transport_1_>
```

### Fix 3: Check NAT Traversal

Current config:
```xml
<STUN_Enable>yes</STUN_Enable>
<STUN_Server>stun.l.google.com</STUN_Server>
<NAT_Keep_Alive_Enable_1_>Yes</NAT_Keep_Alive_Enable_1_>
<NAT_Keep_Alive_Intvl_1_>20</NAT_Keep_Alive_Intvl_1_>
```

This looks correct, but verify:
- Router has SIP ALG **disabled** (causes issues)
- Ports 5060 (SIP) and 10000-20000 (RTP) are not blocked

## Testing Steps

### 1. Test Registration
```bash
# Check if device is registered
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/SIP/Domains/ringringclub.sip.us1.twilio.com/CredentialListMappings.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```

### 2. Test Outbound Call
1. Pick up phone
2. Dial approved number (e.g., `12035989541`)
3. Listen for:
   - **Ringing** → Success!
   - **Fast busy** → Check Twilio debugger for error code
   - **Silence** → Registration issue

### 3. Test Inbound Call
1. Call CP's Twilio number from external phone
2. Should ring on Linksys
3. If no ring:
   - Check Twilio debugger for routing errors
   - Verify IP ACL includes `71.162.139.120`
   - Check Origination URL is correct

## Quick Fixes to Try

### Fix A: Update Linksys Config (via Admin Portal)

1. Go to admin portal → Devices
2. Find CP's device
3. Click "Provision" → Download new config
4. Upload to Linksys at `http://[linksys-ip]/admin/upgrade`

### Fix B: Manual Linksys Configuration

If auto-provisioning isn't working, manually configure via web UI:

**Line 1 Settings:**
- Proxy: `ringringclub.sip.us1.twilio.com:5060`
- Register: Yes
- User ID: `sip_3abdb1_1773515304964`
- Password: `0konnd4l1sxoA1!`
- Auth ID: `sip_3abdb1_1773515304964`

**NAT Settings:**
- STUN Enable: Yes
- STUN Server: `stun.l.google.com`
- NAT Keep Alive: Yes (20 seconds)

**Dial Plan:**
- Line 1: `(911|933|<:+1>[2-9]XXXXXXXXX)`

## Expected Twilio Configuration

Based on the code, here's what should be configured in Twilio:

### SIP Domain
- **Domain:** `ringringclub.sip.us1.twilio.com`
- **Voice URL:** Points to TwiML app or webhook
- **SIP Registration:** Enabled
- **Credential List:** Attached (SID: `CL...`)

### Credential List
- **Name:** Ring Ring SIP Credentials
- **SID:** From `TWILIO_SIP_CRED_LIST_SID` env var
- **Credentials:**
  - Username: `sip_3abdb1_1773515304964`
  - Password: `0konnd4l1sxoA1!`

### IP Access Control List
- **Name:** Ring Ring Allowed IPs
- **IPs:**
  - `71.162.139.120/32` (CP's home)
  - Add more as needed

### Trunk Configuration
- **Origination URI:** `sip:ringringclub.sip.us1.twilio.com`
- **Termination:** IP ACL attached
- **Authentication:** Credential List attached

## Next Steps for Bob

1. **Check Twilio Debugger** for specific error codes
2. **Verify IP ACL** includes `71.162.139.120`
3. **Verify Credential List** has CP's SIP credentials
4. **Check Trunk Configuration** (Origination + Termination)
5. **Share error codes** with CP for targeted troubleshooting

## For CP

Once Bob confirms the Twilio configuration:

1. **Reboot the Linksys** (power cycle)
2. **Check registration status** on Linksys web UI
3. **Test outbound call** to known working number
4. **Share specific error messages** from Linksys logs

## Common Issues & Solutions

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Fast busy on outbound | Dial plan prefix issue | Remove prefix or use conditional prefix |
| No inbound calls | IP not in ACL | Add `71.162.139.120` to IP ACL |
| Registration fails | Credential not in list | Verify credential list attached to domain |
| Calls drop after 30s | NAT timeout | Verify NAT keep-alive is enabled |
| One-way audio | Firewall blocking RTP | Open ports 10000-20000 UDP |

## Reference

- **Twilio SIP Domain:** `ringringclub.sip.us1.twilio.com`
- **Credential List SID:** Check `TWILIO_SIP_CRED_LIST_SID` in Vercel env vars
- **Linksys Config:** `/api/provision/[deviceId]/linksys.cfg`
- **Admin Portal:** `https://voip-dashboard-sigma.vercel.app/admin`
