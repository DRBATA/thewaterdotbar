# MCP Stock Management Test Guide

## 1. Start the Agent Backend
```bash
cd c:\Users\azamb\OneDrive\Desktop\THE.WATER.BAR\website\hedra-avatar-starter\waterbar-avatar\backend
python agent_worker.py
```

## 2. Open Water Bar Stock Page
Navigate to: http://localhost:3000/stock

## 3. Test Voice Commands via UnifiedChatAvatar

### Test Commands:
1. **Add Stock:**
   - "Add 50 bottles of Alkaline Water to Dubai Marina venue"
   - "Add 100 Chaga Mushroom drinks to JBR venue"
   - "Stock delivery: 200 Premium Water bottles for Dubai Marina"

2. **Check Stock:**
   - "Check stock levels for Alkaline Water at Dubai Marina"
   - "What's the inventory for Chaga Mushroom at JBR?"

3. **Remove Stock (for breakage/spoilage):**
   - "Remove 5 Alkaline Water bottles from Dubai Marina due to breakage"
   - "Mark 3 Chaga drinks as spoiled at JBR venue"

## 4. Verify Updates
- Check the "Recent Additions" section on /stock page
- Verify real-time updates appear without page refresh
- Confirm quantities match voice commands

## Expected Flow:
1. Voice command → Agent processes via MCP function
2. MCP function directly updates database (stock_additions table)
3. Stock page subscription detects change
4. UI updates automatically with new stock levels

## Troubleshooting:
- If agent doesn't respond: Check agent_worker.py is running
- If stock doesn't update: Check Supabase connection
- If voice not recognized: Check microphone permissions
