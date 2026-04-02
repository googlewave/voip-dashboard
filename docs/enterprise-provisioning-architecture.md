# Enterprise-Grade Provisioning Architecture

## How Device Provisioning Actually Works

### The QR Code Misconception

**QR codes don't directly provision devices.** They're just a convenient way to deliver a URL to the customer.

**Actual Flow:**
```
Customer scans QR code
  ↓
QR code contains: https://voip-dashboard.../api/provision/auto/[deviceId]
  ↓
Customer manually enters this URL in device web interface
  ↓
Device fetches config from URL over HTTP
  ↓
Device applies config and reboots
  ↓
Device registers with Twilio
```

**QR code = URL delivery mechanism, not magic provisioning**

---

## Actual Provisioning Methods

### Method 1: HTTP Auto-Provisioning (Recommended)

**How it works:**
1. Customer accesses device web UI (e.g., `http://192.168.1.100`)
2. Goes to "Provisioning" or "Upgrade" section
3. Enters provisioning URL: `https://voip-dashboard.../api/provision/auto/[deviceId]`
4. Device fetches XML config from URL
5. Device applies config and reboots
6. Device registers with Twilio

**Supported devices:**
- Grandstream HT801/HT802 (via HTTP provisioning)
- Linksys SPA2102/SPA3102 (via Upgrade URL)

**Pros:**
- Works reliably
- No network discovery needed
- Customer has full control
- Can verify config before applying

**Cons:**
- Requires customer to access device web UI
- Must manually enter URL (or scan QR to get URL)

### Method 2: TFTP Provisioning (Not Implemented)

**How it works:**
1. Device boots and looks for TFTP server on local network
2. Device fetches config from TFTP server
3. Requires TFTP server running on customer's network

**Why we don't use this:**
- Requires customer to run TFTP server
- Complex network setup
- Firewall issues
- Not suitable for consumer product

### Method 3: Pre-Provisioning (Future - Best UX)

**How it works:**
1. We provision devices before shipping
2. Customer receives pre-configured hardware
3. Plug in → It works

**Requirements:**
- Manufacturing/warehouse integration
- MAC address → device ID mapping
- Pre-configuration before shipping

---

## Linksys SPA2102 End-of-Life Status

### Current Status (2026)

**Linksys SPA2102:**
- End of Sale: 2015
- End of Support: 2020
- **Provisioning still works:** Yes
- **Firmware updates:** No longer available
- **SIP registration:** Still functional

**Why it still works:**
- HTTP provisioning is a standard protocol
- SIP registration is protocol-based
- Twilio supports legacy SIP devices
- No proprietary cloud services required

**Concerns:**
- Security vulnerabilities (no firmware updates)
- Limited codec support
- No modern features (TLS, SRTP)
- Hardware failures (aging devices)

**Recommendation:**
- Support SPA2102 for existing customers
- Recommend Grandstream HT801 for new customers
- Plan migration path to modern devices

### Grandstream HT801 (Current Recommended)

**Status:**
- Currently manufactured and supported
- Regular firmware updates
- Modern security features
- Better codec support
- Lower cost than SPA2102

**Provisioning:**
- HTTP auto-provisioning: ✓
- TFTP provisioning: ✓
- TR-069: ✓
- Web UI config: ✓

---

## Enterprise-Grade Requirements

### 1. Provisioning Status Tracking

**Track:**
- Device provisioning attempts
- Success/failure rates
- Last provisioned timestamp
- Config version applied
- Registration status

**Implementation:**
```typescript
interface ProvisioningLog {
  deviceId: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
  configVersion: string;
  ipAddress: string;
  userAgent: string;
  errorMessage?: string;
}
```

### 2. Configuration Versioning

**Track config changes:**
- Version number in config
- Changelog for each version
- Rollback capability
- A/B testing for config changes

**Example:**
```xml
<!-- Config Version: 2.1.0 -->
<!-- Last Updated: 2026-03-23 -->
<!-- Changes: Added STUN server, updated dial plan -->
```

### 3. Device Registration Monitoring

**Monitor:**
- SIP registration status
- Last registration timestamp
- Registration failures
- Network connectivity
- Call quality metrics

**Alert on:**
- Registration failures > 3 attempts
- Device offline > 24 hours
- Call quality degradation
- Security events

### 4. Automatic Retry Logic

**If provisioning fails:**
```typescript
async function provisionWithRetry(deviceId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await provision(deviceId);
      await logProvisioningSuccess(deviceId, attempt);
      return;
    } catch (error) {
      await logProvisioningFailure(deviceId, attempt, error);
      
      if (attempt === maxRetries) {
        await notifyAdmin(deviceId, error);
        throw error;
      }
      
      // Exponential backoff
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

### 5. Fallback Manual Provisioning

**If auto-provisioning fails:**
1. Generate downloadable config file
2. Provide step-by-step manual instructions
3. Include screenshots for each step
4. Offer live chat support
5. Schedule callback from support team

---

## Admin Portal Requirements

### Device Provisioning Management

**Admin should be able to:**
- View all devices and provisioning status
- Generate provisioning URLs for any device
- Download config files manually
- View provisioning logs and errors
- Re-provision devices remotely
- Update device firmware (if supported)
- Monitor registration status in real-time

### Provisioning Dashboard

**Metrics to display:**
- Total devices provisioned
- Success rate (last 7/30 days)
- Average provisioning time
- Common failure reasons
- Devices pending provisioning
- Devices offline > 24 hours

### Bulk Operations

**Admin capabilities:**
- Bulk re-provision devices
- Bulk config updates
- Export provisioning reports
- Schedule maintenance windows
- Send notifications to customers

---

## Implementation Plan

### Phase 1: Core Provisioning (Done)
- ✅ Auto-provisioning endpoint
- ✅ Twilio auto-setup
- ✅ QR code URL delivery
- ✅ Device-specific configs

### Phase 2: Enterprise Features (Now)
- [ ] Provisioning status tracking
- [ ] Admin portal provisioning UI
- [ ] Registration monitoring
- [ ] Provisioning logs and alerts
- [ ] Manual config download

### Phase 3: Advanced Features (Future)
- [ ] Configuration versioning
- [ ] A/B testing for configs
- [ ] Automated device health checks
- [ ] Predictive failure detection
- [ ] Customer self-service portal

---

## Testing Requirements

### Device Testing Matrix

| Device | HTTP Provision | TFTP | Web UI | SIP Register | Call Quality |
|--------|---------------|------|--------|--------------|--------------|
| Grandstream HT801 | ✓ Test | - | ✓ Test | ✓ Test | ✓ Test |
| Grandstream HT802 | ✓ Test | - | ✓ Test | ✓ Test | ✓ Test |
| Linksys SPA2102 | ✓ Test | - | ✓ Test | ✓ Test | ✓ Test |
| Linksys SPA3102 | ✓ Test | - | ✓ Test | ✓ Test | ✓ Test |

### Test Scenarios

**1. Fresh Device Provisioning:**
- Factory reset device
- Access web UI
- Enter provisioning URL
- Verify config applied
- Verify SIP registration
- Make test call

**2. Re-Provisioning:**
- Update device config
- Re-provision device
- Verify new config applied
- Verify no service interruption

**3. Failure Recovery:**
- Simulate network failure during provisioning
- Verify retry logic
- Verify error logging
- Verify admin notification

**4. Multiple Devices:**
- Provision 10+ devices simultaneously
- Monitor success rate
- Check for race conditions
- Verify Twilio rate limits

---

## Security Considerations

### 1. Provisioning URL Security

**Current:** URLs are predictable (device ID in path)

**Risk:** Anyone with device ID can fetch config

**Mitigation:**
```typescript
// Add time-limited token to provisioning URL
const provisionUrl = `https://voip-dashboard.../api/provision/auto/${deviceId}?token=${generateToken(deviceId, expiresIn: '24h')}`;

// Verify token on request
async function verifyProvisionToken(deviceId: string, token: string) {
  const valid = await verifyJWT(token, { deviceId, maxAge: '24h' });
  if (!valid) throw new Error('Invalid or expired provisioning token');
}
```

### 2. Config Encryption

**Sensitive data in config:**
- SIP password
- API keys
- Device credentials

**Solution:**
- Use HTTPS for all provisioning
- Consider encrypting passwords in config
- Rotate credentials regularly

### 3. Rate Limiting

**Prevent abuse:**
```typescript
// Limit provisioning requests per device
const rateLimit = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
};

// Limit provisioning requests per IP
const ipRateLimit = {
  maxRequests: 100,
  windowMs: 60000,
};
```

---

## Customer Support Playbook

### Issue: Device Won't Provision

**Troubleshooting steps:**
1. Verify device can access internet
2. Check device firmware version
3. Verify provisioning URL is correct
4. Check admin portal for error logs
5. Try manual config file download
6. Verify Twilio credentials exist
7. Check SIP domain configuration

### Issue: Device Registers But Can't Call

**Troubleshooting steps:**
1. Check dial plan configuration
2. Verify approved contacts list
3. Test with emergency number (911)
4. Check Twilio debugger for errors
5. Verify codec compatibility
6. Check NAT/firewall settings

### Issue: One-Way Audio

**Troubleshooting steps:**
1. Verify STUN server is configured
2. Check RTP port range (10000-20000)
3. Verify router doesn't have SIP ALG enabled
4. Check firewall rules
5. Test from different network

---

## Next Steps

1. **Add provisioning tracking to database**
2. **Build admin portal provisioning UI**
3. **Implement provisioning logs**
4. **Add registration monitoring**
5. **Test with actual devices**
6. **Create customer support documentation**
7. **Build monitoring dashboard**

---

## Success Metrics

**Target KPIs:**
- Provisioning success rate: > 95%
- Average provisioning time: < 5 minutes
- Customer support tickets: < 5% of provisions
- Device uptime: > 99.5%
- Call quality (MOS): > 4.0

**Monitor:**
- Provisioning attempts vs successes
- Time to first successful registration
- Common failure points
- Customer satisfaction scores
- Support ticket volume
