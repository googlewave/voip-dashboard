# CP's Linksys SPA2102 Setup Instructions

## Auto-Provisioning URL

**Device ID:** `9cfb58dd-5966-4255-91aa-3ca2b23abdb1`

**Provisioning URL:**
```
https://voip-dashboard-sigma.vercel.app/api/provision/auto/9cfb58dd-5966-4255-91aa-3ca2b23abdb1?type=linksys
```

---

## Setup Steps

### Step 1: Access Linksys Web Interface

1. Open browser and go to: `http://192.168.1.100` (or your Linksys IP)
2. Login:
   - **Username:** `admin`
   - **Password:** `admin` (or your custom password)

### Step 2: Configure Auto-Provisioning

1. Click **Admin** tab (top navigation)
2. Scroll down to **Upgrade** section
3. In the **"Upgrade Via"** field, enter:
   ```
   https://voip-dashboard-sigma.vercel.app/api/provision/auto/9cfb58dd-5966-4255-91aa-3ca2b23abdb1?type=linksys
   ```
4. Click **Upgrade** button
5. Wait for device to download config (30-60 seconds)
6. Device will automatically reboot

### Step 3: Verify Registration

After reboot (2-3 minutes):

1. Go back to Linksys web UI
2. Click **Info** tab
3. Look at **Line 1** section
4. **Registration State** should show: **Registered**

If it shows "Registered" - you're done! ✅

---

## What Gets Configured Automatically

The auto-provisioning will set:

✅ **SIP Server:** `ringringclub.sip.us1.twilio.com:5060`
✅ **SIP Credentials:** Auto-generated and secure
✅ **Dial Plan:** Emergency numbers (911) + approved contacts
✅ **NAT Settings:** STUN enabled for proper connectivity
✅ **Codec Settings:** Optimized for call quality
✅ **Transport:** TCP (more reliable than UDP)

---

## Testing Calls

### Outbound Test
1. Pick up phone connected to Linksys
2. Dial: `12035989541` (your cell)
3. Should ring and connect

### Inbound Test
1. Call your Twilio number from external phone
2. Linksys should ring
3. Pick up to answer

---

## Troubleshooting

### Issue: Registration State shows "Failed" or "None"

**Check:**
1. Verify internet connection on Linksys
2. Check router firewall isn't blocking port 5060
3. Disable SIP ALG on router if enabled
4. Try rebooting Linksys (unplug 30 seconds)

**Re-provision:**
1. Go back to Admin → Upgrade
2. Enter URL again
3. Click Upgrade

### Issue: Fast Busy on Outbound Calls

**Likely cause:** Dial plan issue

**Fix:**
1. Check approved contacts are configured in dashboard
2. Try dialing emergency number: `911` (should work)
3. If 911 works but other numbers don't, contact Bob

### Issue: One-Way Audio

**Likely cause:** NAT/firewall blocking RTP

**Fix:**
1. Verify STUN is enabled (should be auto-configured)
2. Check router doesn't have SIP ALG enabled (disable it)
3. Ensure ports 10000-20000 UDP are not blocked

### Issue: Can't Access Linksys Web UI

**Find IP address:**
1. Check router DHCP client list
2. Look for device named "Linksys" or "SPA2102"
3. Or use IP scanner tool

**Reset to defaults:**
1. Hold reset button on back for 30 seconds
2. Default IP will be `192.168.0.1` or `192.168.1.100`
3. Default login: `admin` / `admin`

---

## Advanced: Manual Configuration (If Auto-Provision Fails)

If auto-provisioning doesn't work, you can configure manually:

### Line 1 Settings (Voice tab)

**General:**
- Line Enable: `Yes`

**SIP Settings:**
- Proxy: `ringringclub.sip.us1.twilio.com:5060`
- Register: `Yes`
- Make Call Without Reg: `No`
- Ans Call Without Reg: `No`

**Subscriber Information:**
- Display Name: `Your Name`
- User ID: `[SIP_USERNAME]` (get from Bob)
- Password: `[SIP_PASSWORD]` (get from Bob)
- Auth ID: `[SIP_USERNAME]` (same as User ID)

**NAT Settings:**
- NAT Mapping Enable: `Yes`
- NAT Keep Alive Enable: `Yes`
- NAT Keep Alive Interval: `20`
- STUN Enable: `yes`
- STUN Server: `stun.l.google.com`

**SIP Transport:**
- SIP Transport: `TCP`
- SIP Port: `5060`

**Dial Plan:**
- Dial Plan: `(911|933|<:+1>[2-9]XXXXXXXXX)`

---

## What Bob Can See

After you provision, Bob can monitor:
- ✅ Provisioning success/failure
- ✅ Your IP address
- ✅ Device type (Linksys)
- ✅ Config version applied
- ✅ SIP registration status
- ✅ Any error messages

This helps with troubleshooting if something goes wrong.

---

## Support

**If you get stuck:**
1. Check Linksys **System** tab → **System Log** for errors
2. Take screenshot of **Info** tab → **Line 1** section
3. Share with Bob along with any error messages

**Quick checks:**
- Internet working? (ping 8.8.8.8)
- Linksys has IP address? (check Info tab)
- Router firewall blocking SIP? (port 5060)
- SIP ALG disabled on router?

---

## Success Checklist

- [ ] Accessed Linksys web UI
- [ ] Entered provisioning URL in Admin → Upgrade
- [ ] Device downloaded config and rebooted
- [ ] Registration State shows "Registered"
- [ ] Made test outbound call successfully
- [ ] Received test inbound call successfully
- [ ] Audio quality is good both ways

Once all checked, you're fully provisioned! 🎉

---

**Provisioning URL (for reference):**
```
https://voip-dashboard-sigma.vercel.app/api/provision/auto/9cfb58dd-5966-4255-91aa-3ca2b23abdb1?type=linksys
```
