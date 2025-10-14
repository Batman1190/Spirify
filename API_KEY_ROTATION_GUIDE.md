# API Key Rotation System Guide

## Overview

The Musika ni Rod music streaming app now includes an intelligent API key rotation system that allows you to add multiple YouTube API keys and automatically manage quota usage across all of them.

## Key Features

### 1. Multiple API Key Support
- Add unlimited YouTube API keys
- Enter multiple keys at once (comma-separated)
- Each key is tracked independently

### 2. Automatic Rotation
- Keys automatically rotate when approaching 90% of quota limit
- Seamless switching with no interruption to music playback
- Smart retry logic if a key hits quota during a request

### 3. Real-Time Quota Tracking
- Each API call's quota cost is tracked
- Visual progress bars show usage per key
- Color-coded warnings (green → orange → red)

### 4. Daily Reset
- Usage counters automatically reset each day
- Tracks last reset date to ensure accurate daily limits

## How to Use

### Adding API Keys

**Single Key:**
```
AIzaSyC1234567890abcdefghijklmnop
```

**Multiple Keys (comma-separated):**
```
AIzaSyC1234567890abcdefghijklmnop, AIzaSyD0987654321zyxwvutsrqponm, AIzaSyE1122334455ffeeddccbbaa
```

### Managing Keys

1. Click the **"Manage Keys"** button in the top-right
2. View all your API keys with:
   - Masked key values (for security)
   - Current usage and percentage
   - Visual progress bars
   - Active key indicator (🟢)
3. Remove keys by clicking the delete button
4. View statistics:
   - Total number of keys
   - Currently active key
   - Total usage today
   - Total quota available
   - Remaining quota

## Quota Costs

The system tracks different API operations with their respective costs:

| Operation | Quota Cost |
|-----------|------------|
| Search queries | 100 units |
| Video details (trending) | 1 unit |
| Channel details | 1 unit |

**Default daily limit per key:** 10,000 units

## How Rotation Works

### Automatic Rotation Triggers

1. **Approaching Limit (90% threshold)**
   - When a key reaches 9,000 units (90% of 10,000)
   - System automatically rotates to the next key
   - Logged in console: "API key approaching quota limit. Rotating..."

2. **Quota Exceeded Error**
   - If YouTube returns a 403 quota error
   - System immediately rotates to next key
   - Retries the failed request with new key

3. **Manual Rotation**
   - System cycles through keys in order
   - Returns to first key after reaching the last

### Rotation Example

With 3 API keys:
```
Key 1 (9,500 units) → Key 2 (2,000 units) → Key 3 (500 units) → Key 1 (reset)
```

## Benefits

### Extended Usage
- **Single key:** 10,000 units/day = ~100 searches
- **3 keys:** 30,000 units/day = ~300 searches
- **5 keys:** 50,000 units/day = ~500 searches

### Reliability
- If one key fails, others continue working
- No downtime due to quota limits
- Automatic failover

### Monitoring
- Real-time visibility into usage
- Plan ahead before hitting limits
- Identify which keys need replacement

## Storage

All API key data is stored in browser's localStorage:

```javascript
{
  keys: ["key1", "key2", "key3"],
  currentIndex: 0,
  usage: {
    "key1": 5000,
    "key2": 2000,
    "key3": 0
  },
  lastReset: "Mon Jan 01 2024"
}
```

## Best Practices

### 1. Use Multiple Keys
- Create 3-5 API keys for optimal coverage
- Distribute across different Google Cloud projects if needed

### 2. Monitor Usage
- Check "Manage Keys" regularly
- Add more keys before hitting limits
- Remove invalid or expired keys

### 3. Security
- Keys are stored locally in your browser
- Never share your API keys
- Use API key restrictions in Google Cloud Console

### 4. Key Restrictions (Recommended)
In Google Cloud Console, restrict each key to:
- **API restrictions:** YouTube Data API v3 only
- **Application restrictions:** HTTP referrers (your domain)

## Troubleshooting

### All Keys Exhausted
**Symptom:** "Error fetching music" even with multiple keys

**Solutions:**
1. Wait until next day for automatic reset
2. Add more API keys
3. Check if keys are valid in Google Cloud Console

### Keys Not Rotating
**Symptom:** Same key keeps getting used

**Solutions:**
1. Check browser console for errors
2. Verify multiple keys are added (click "Manage Keys")
3. Ensure keys are valid and enabled

### Usage Not Tracking
**Symptom:** Usage shows 0 for all keys

**Solutions:**
1. Clear browser cache and re-add keys
2. Check browser console for localStorage errors
3. Ensure JavaScript is enabled

## Technical Details

### Class: YouTubeAPIKeyRotator

**Key Methods:**
- `addAPIKey(key)` - Add a new API key
- `getKey(quotaCost)` - Get current key and track usage
- `rotateKey()` - Manually rotate to next key
- `removeKey(key)` - Remove a key from rotation
- `resetUsage()` - Reset all usage counters
- `getAllKeysWithUsage()` - Get all keys with stats

### Quota Cost Constants

```javascript
const YouTubeAPIQuotaCost = {
    SEARCH: 100,
    VIDEO_DETAILS: 1,
    CHANNEL_DETAILS: 1
};
```

## Example Scenarios

### Scenario 1: Heavy Usage Day
- **Setup:** 3 API keys
- **Usage:** 250 searches throughout the day
- **Result:** 
  - Key 1: 9,000 units (rotated at 90%)
  - Key 2: 9,000 units (rotated at 90%)
  - Key 3: 7,000 units
  - Total: 25,000 units used, 5,000 remaining

### Scenario 2: Key Failure
- **Setup:** 2 API keys
- **Event:** Key 1 hits quota at 10,000 units
- **Result:** 
  - System detects 403 error
  - Automatically rotates to Key 2
  - Retries failed request
  - User experiences no interruption

### Scenario 3: Daily Reset
- **Time:** 12:00 AM (midnight)
- **Before:** Key 1: 9,500 units, Key 2: 8,000 units
- **After:** Key 1: 0 units, Key 2: 0 units
- **Result:** Full quota restored for new day

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify API keys in Google Cloud Console
3. Review quota usage in "Manage Keys" modal
4. Ensure YouTube Data API v3 is enabled

---

**Note:** This rotation system is designed to maximize your YouTube API usage while staying within Google's terms of service. Always comply with YouTube's API usage policies and rate limits.
