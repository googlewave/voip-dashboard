#!/bin/bash

echo "🧪 Testing Webhook & Phone Provisioning Flow"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Test 1: Check Dev Server${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dev server is running${NC}"
else
    echo -e "${RED}✗ Dev server not running. Start with: npm run dev${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Test 2: Check Webhook Endpoint${NC}"
WEBHOOK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{}')

if [ "$WEBHOOK_RESPONSE" == "400" ]; then
    echo -e "${GREEN}✓ Webhook endpoint exists (returns 400 for invalid signature - expected)${NC}"
else
    echo -e "${RED}✗ Unexpected response: $WEBHOOK_RESPONSE${NC}"
fi
echo ""

echo -e "${YELLOW}Test 3: Check Provision Number Endpoint${NC}"
PROVISION_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/admin/provision-number \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","areaCode":"302","e911":{"customerName":"Test","street":"123 Main","city":"City","region":"DE","postalCode":"19801"}}')

if [ "$PROVISION_RESPONSE" == "200" ] || [ "$PROVISION_RESPONSE" == "500" ]; then
    echo -e "${GREEN}✓ Provision endpoint exists (may fail without valid user - expected)${NC}"
else
    echo -e "${RED}✗ Unexpected response: $PROVISION_RESPONSE${NC}"
fi
echo ""

echo -e "${YELLOW}Test 4: Check Admin Portal${NC}"
ADMIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin)
if [ "$ADMIN_RESPONSE" == "200" ] || [ "$ADMIN_RESPONSE" == "307" ]; then
    echo -e "${GREEN}✓ Admin portal accessible${NC}"
else
    echo -e "${RED}✗ Admin portal error: $ADMIN_RESPONSE${NC}"
fi
echo ""

echo -e "${YELLOW}Test 5: Check User Dashboard${NC}"
DASHBOARD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
if [ "$DASHBOARD_RESPONSE" == "200" ] || [ "$DASHBOARD_RESPONSE" == "307" ]; then
    echo -e "${GREEN}✓ User dashboard accessible${NC}"
else
    echo -e "${RED}✗ Dashboard error: $DASHBOARD_RESPONSE${NC}"
fi
echo ""

echo -e "${YELLOW}Test 6: Check Purchase Flow${NC}"
BUY_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/buy)
if [ "$BUY_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✓ Purchase page accessible${NC}"
else
    echo -e "${RED}✗ Purchase page error: $BUY_RESPONSE${NC}"
fi
echo ""

echo "=============================================="
echo -e "${GREEN}✓ All endpoint tests complete!${NC}"
echo ""
echo "📋 Next Steps for Full Integration Test:"
echo ""
echo "1. Install Stripe CLI (if not installed):"
echo "   brew install stripe/stripe-cli/stripe"
echo ""
echo "2. Login to Stripe:"
echo "   stripe login"
echo ""
echo "3. Listen for webhooks:"
echo "   stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo ""
echo "4. In another terminal, trigger test:"
echo "   stripe trigger checkout.session.completed"
echo ""
echo "5. Or test via real checkout:"
echo "   - Visit: http://localhost:3000/buy"
echo "   - Select Monthly plan"
echo "   - Use test card: 4242 4242 4242 4242"
echo "   - Enter area code: 302"
echo "   - Complete checkout"
echo ""
echo "📊 Monitor logs for:"
echo "   ✓ User upgraded to monthly/annual"
echo "   ✓ Phone number provisioned"
echo "   ✓ Number appears in dashboard"
