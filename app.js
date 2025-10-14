// ============================================
// BROWSER COMPATIBILITY & POLYFILLS
// ============================================

// Check for required browser features
(function() {
    'use strict';
    
    // Feature detection
    const features = {
        localStorage: typeof Storage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined',
        map: typeof Map !== 'undefined',
        classList: 'classList' in document.documentElement,
        dataset: 'dataset' in document.documentElement
    };
    
    // Log browser info for debugging
    console.log('Browser compatibility check:', features);
    
    // Polyfill for Array.from (IE11)
    if (!Array.from) {
        Array.from = function(arrayLike) {
            return [].slice.call(arrayLike);
        };
    }
    
    // Polyfill for Object.assign (IE11)
    if (typeof Object.assign !== 'function') {
        Object.assign = function(target) {
            if (target == null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }
            target = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source != null) {
                    for (var key in source) {
                        if (Object.prototype.hasOwnProperty.call(source, key)) {
                            target[key] = source[key];
                        }
                    }
                }
            }
            return target;
        };
    }
    
    // Polyfill for String.includes (IE11)
    if (!String.prototype.includes) {
        String.prototype.includes = function(search, start) {
            if (typeof start !== 'number') {
                start = 0;
            }
            if (start + search.length > this.length) {
                return false;
            } else {
                return this.indexOf(search, start) !== -1;
            }
        };
    }
    
    // Fix for viewport height on mobile browsers
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', vh + 'px');
    }
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Prevent zoom on double-tap for iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Check if localStorage is available and working
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
    } catch (e) {
        console.warn('localStorage is not available. Some features may not work correctly.');
    }
    
    // Detect if running as PWA
    window.isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true;
    
    console.log('Running as PWA:', window.isPWA);
    
    // Browser detection and warning for outdated browsers
    function detectBrowser() {
        const ua = navigator.userAgent;
        let browserInfo = {
            name: 'Unknown',
            version: 0,
            isSupported: true
        };
        
        // Detect browser
        if (ua.indexOf('Firefox') > -1) {
            browserInfo.name = 'Firefox';
            browserInfo.version = parseInt(ua.match(/Firefox\/(\d+)/)[1]);
            browserInfo.isSupported = browserInfo.version >= 88;
        } else if (ua.indexOf('Edg') > -1) {
            browserInfo.name = 'Edge';
            browserInfo.version = parseInt(ua.match(/Edg\/(\d+)/)[1]);
            browserInfo.isSupported = browserInfo.version >= 90;
        } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
            browserInfo.name = 'Chrome';
            browserInfo.version = parseInt(ua.match(/Chrome\/(\d+)/)[1]);
            browserInfo.isSupported = browserInfo.version >= 90;
        } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
            browserInfo.name = 'Safari';
            const match = ua.match(/Version\/(\d+)/);
            browserInfo.version = match ? parseInt(match[1]) : 0;
            browserInfo.isSupported = browserInfo.version >= 14;
        } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
            browserInfo.name = 'Internet Explorer';
            browserInfo.version = 11;
            browserInfo.isSupported = false; // IE not fully supported
        }
        
        console.log('Browser detected:', browserInfo);
        
        // Show warning for outdated browsers
        if (!browserInfo.isSupported) {
            setTimeout(function() {
                const warning = document.createElement('div');
                warning.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ff9800; color: #000; padding: 12px; text-align: center; z-index: 10000; font-size: 14px;';
                warning.innerHTML = `
                    <strong>⚠️ Browser Warning:</strong> You're using ${browserInfo.name} which may not support all features. 
                    For the best experience, please update to the latest version or try Chrome, Firefox, or Safari.
                    <button onclick="this.parentElement.remove()" style="margin-left: 12px; padding: 4px 12px; border: none; background: #000; color: #fff; border-radius: 4px; cursor: pointer;">Dismiss</button>
                `;
                document.body.insertBefore(warning, document.body.firstChild);
            }, 2000);
        }
        
        return browserInfo;
    }
    
    // Run browser detection
    window.browserInfo = detectBrowser();
})();

// YouTube API Key Rotation System
class YouTubeAPIKeyRotator {
    constructor() {
        this.apiKeys = [];
        this.currentKeyIndex = 0;
        this.keyUsage = new Map(); // Track API calls per key
        this.quotaLimit = 10000; // Default daily quota limit per key
        this.loadFromStorage();
    }

    // Load API keys from localStorage
    loadFromStorage() {
        const stored = localStorage.getItem('youtube_api_keys');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.apiKeys = data.keys || [];
                this.currentKeyIndex = data.currentIndex || 0;
                // Load usage data
                if (data.usage) {
                    this.keyUsage = new Map(Object.entries(data.usage));
                }
                // Check if we need to reset daily usage
                const lastReset = data.lastReset;
                const today = new Date().toDateString();
                if (lastReset !== today) {
                    this.resetUsage();
                }
            } catch (e) {
                console.error('Error loading API keys:', e);
            }
        }
    }

    // Save API keys to localStorage
    saveToStorage() {
        const data = {
            keys: this.apiKeys,
            currentIndex: this.currentKeyIndex,
            usage: Object.fromEntries(this.keyUsage),
            lastReset: new Date().toDateString()
        };
        localStorage.setItem('youtube_api_keys', JSON.stringify(data));
    }

    // Add a new API key to the rotation
    addAPIKey(key) {
        if (typeof key !== 'string' || !key.trim()) {
            throw new Error('Invalid API key');
        }
        if (this.apiKeys.includes(key)) {
            throw new Error('API key already exists');
        }
        this.apiKeys.push(key);
        this.keyUsage.set(key, 0);
        this.saveToStorage();
    }

    // Get the current active API key
    getCurrentKey() {
        if (this.apiKeys.length === 0) {
            throw new Error('No API keys available');
        }
        return this.apiKeys[this.currentKeyIndex];
    }

    // Rotate to the next available API key
    rotateKey() {
        if (this.apiKeys.length === 0) {
            throw new Error('No API keys available');
        }
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        this.saveToStorage();
        console.log(`Rotated to API key ${this.currentKeyIndex + 1}/${this.apiKeys.length}`);
        return this.getCurrentKey();
    }

    // Track API call for the current key
    trackAPICall(quotaCost = 1) {
        const currentKey = this.getCurrentKey();
        const currentUsage = this.keyUsage.get(currentKey) || 0;
        this.keyUsage.set(currentKey, currentUsage + quotaCost);
        this.saveToStorage();

        // Rotate key if current key is approaching quota limit (90% threshold)
        if (currentUsage + quotaCost >= this.quotaLimit * 0.9) {
            console.warn(`API key approaching quota limit. Rotating...`);
            return this.rotateKey();
        }
        return currentKey;
    }

    // Reset usage counts (should be called daily)
    resetUsage() {
        this.keyUsage.clear();
        this.apiKeys.forEach(key => this.keyUsage.set(key, 0));
        this.saveToStorage();
        console.log('API usage reset for new day');
    }

    // Get an API key for use, automatically handling rotation
    getKey(quotaCost = 1) {
        try {
            return this.trackAPICall(quotaCost);
        } catch (error) {
            throw new Error('No available API keys');
        }
    }

    // Remove an API key from rotation
    removeKey(key) {
        const index = this.apiKeys.indexOf(key);
        if (index > -1) {
            this.apiKeys.splice(index, 1);
            this.keyUsage.delete(key);
            if (this.currentKeyIndex >= this.apiKeys.length) {
                this.currentKeyIndex = 0;
            }
            this.saveToStorage();
        }
    }

    // Get all keys with their usage
    getAllKeysWithUsage() {
        return this.apiKeys.map((key, index) => ({
            key,
            usage: this.keyUsage.get(key) || 0,
            isActive: index === this.currentKeyIndex,
            percentage: ((this.keyUsage.get(key) || 0) / this.quotaLimit) * 100
        }));
    }

    // Get total usage across all keys
    getTotalUsage() {
        let total = 0;
        this.keyUsage.forEach(usage => total += usage);
        return total;
    }
}

// YouTube API Quota Costs
const YouTubeAPIQuotaCost = {
    SEARCH: 100,
    VIDEO_DETAILS: 1,
    CHANNEL_DETAILS: 1
};

// Create singleton instance
const apiKeyRotator = new YouTubeAPIKeyRotator();

// Pre-load API keys if none exist
if (apiKeyRotator.apiKeys.length === 0) {
    const preloadedKeys = [
        'AIzaSyBRB8bXp-UFdoNFhTqh9n2hWdthpm--gXk',
        'AIzaSyBi9XME_hKIdmFyKT2sX9Qzq-YW4uwaPGc',
        'AIzaSyAaT_fn6jzNLUjee7n7hQIJAdjvQiKHSTU',
        'AIzaSyD0ZhRR292c95yMkSx-ZPWtsGL-FkwEH2Y',
        'AIzaSyB0z2xXRZX5dh8tMw3PZh9oqfSGgwiWx-U',
        'AIzaSyByQDjEkBdrbJqi3O35UUyOEgGrEqImoXU',
        'AIzaSyA4iPnRBOkNcVnG6i2Osdplr-6KOOidJso',
        'AIzaSyBp1KT6xYFkP5pkq5vldiS5M-275Jyhk1o',
        'AIzaSyBSUK5rvC9NUIfGg7Ol-c5fByZDLxkV4MA',
        'AIzaSyBBN1oCDauSMk_QdRMKfriv3KsP--jGgIE',
        'AIzaSyBzD1zDrYqVl-RH3vTwfmXDkGqjdH3Zlr0',
        'AIzaSyDzoPLaJUFjAB0kSSPRGQfUwiMlywWIO4I',
        'AIzaSyCSMlS_3EpigNZYoyxU7L6mnLPfpFbJ6vA',
        'AIzaSyAvw2xoR4eaQOzsyEBjthCQSFo5x60jNV8',
        'AIzaSyDOd-fwjmHblCWYZWFtu6V0QNGHNBMb0Tw',
        'AIzaSyDKye_UeYzygyeo7H35-bKrM3wgCXb3wPs',
        'AIzaSyBg_4VpFdldAYh4eyEOdJKibMS1HeM7wZQ',
        'AIzaSyDIhTB0yw5Qkbdp3Wpu1n0djdJQXvELGlc',
        'AIzaSyCCgPxoUbeo3yiKo-2i8FTDyMO2MEhVS5Q',
        'AIzaSyDc-OSidO2qU5QAiXi7Ad1qASH3rPGZB3w',
        'AIzaSyA1KrCE-nCrnw_6lCrm0WK3n5iE5LlOpoQ',
        'AIzaSyCHby00rzviTneGRsYoaXPDSTNZ5mByYRs',
        'AIzaSyANh88_Ut5RXlGkw8TgbpgCcHHXTPqgN74',
        'AIzaSyCjgMk3Q_D-545I-slLdpOkcsi5rhUbwLg',
        'AIzaSyBRGmaiOgS9Ma0d6X6GqDxLbfJLFolkgCs',
        'AIzaSyBwQVmWudUVfBSA-Xd0Py3dWaBdubjEKDk',
        'AIzaSyAohDXe4nuKALD07eQGXG7WiCPC9u4j-No',
        'AIzaSyDEDWKHYGpjRJHM_xvgwzqUgCUgTI4BP24'
    ];
    
    preloadedKeys.forEach(key => {
        try {
            apiKeyRotator.addAPIKey(key);
        } catch (e) {
            console.error('Error adding preloaded key:', e);
        }
    });
    
    console.log(`Pre-loaded ${apiKeyRotator.apiKeys.length} API keys`);
}

// YouTube API Configuration
const MUSIC_CATEGORY_ID = '10'; // Music category

// Spiritual Music Keywords Filter
const SPIRITUAL_KEYWORDS = [
    'Worship',
    'Praise',
    'Gospel',
    'Faith',
    'Jesus',
    'Hallelujah',
    'Prayer',
    'Spirit',
    'Grace',
    'Blessing'
];

// Function to get a random spiritual keyword
function getRandomSpiritualKeyword() {
    return SPIRITUAL_KEYWORDS[Math.floor(Math.random() * SPIRITUAL_KEYWORDS.length)];
}

// Function to build spiritual search query
function buildSpiritualQuery(userQuery = '') {
    const keyword = getRandomSpiritualKeyword();
    if (userQuery) {
        // Combine user query with spiritual context
        return `${userQuery} ${keyword} music`;
    }
    // For trending, use spiritual keywords
    return `${keyword} music songs`;
}

// Player State
let player;
let currentPlaylist = [];
let currentTrackIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 0; // 0: off, 1: all, 2: one
let recentlyPlayed = JSON.parse(localStorage.getItem('recently_played')) || [];
let likedSongs = JSON.parse(localStorage.getItem('liked_songs')) || [];

// Preset Playlists Data
const PRESET_PLAYLISTS = [
    {
        id: 'preset_worship_adoration',
        name: '🙏 Worship & Adoration',
        description: 'Deep worship songs that lift the soul and draw you closer to God\'s presence',
        isPreset: true,
        tracks: [],
        suggestedSongs: [
            'What a Beautiful Name - Hillsong Worship',
            'Here I Am to Worship - Tim Hughes',
            'Heart of Worship - Matt Redman',
            'Oceans Where Feet May Fail - Hillsong UNITED',
            'How Great Is Our God - Chris Tomlin',
            'Build My Life - Housefires',
            'Goodness of God - Bethel Music'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'preset_praise_celebration',
        name: '🎉 Praise & Celebration',
        description: 'Joyful songs that celebrate faith, hope, and victory in Christ',
        isPreset: true,
        tracks: [],
        suggestedSongs: [
            'Our God - Chris Tomlin',
            'This Is Amazing Grace - Phil Wickham',
            'I Thank God - Maverick City Music',
            'Trading My Sorrows - Darrell Evans',
            'Joy of the Lord - Rend Collective',
            'Alive - Hillsong Young & Free',
            'God\'s Not Dead - Newsboys'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'preset_gospel_classics',
        name: '🎵 Gospel Classics',
        description: 'Timeless gospel tracks that uplift and inspire the spirit',
        isPreset: true,
        tracks: [],
        suggestedSongs: [
            'Take Me to the King - Tamela Mann',
            'I Smile - Kirk Franklin',
            'You Know My Name - Tasha Cobbs Leonard',
            'Break Every Chain - Jesus Culture',
            'Total Praise - Richard Smallwood',
            'Something About the Name Jesus - The Rance Allen Group',
            'Every Praise - Hezekiah Walker'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'preset_contemporary_faith',
        name: '✨ Contemporary Faith',
        description: 'Modern Christian hits for reflection, worship, and encouragement',
        isPreset: true,
        tracks: [],
        suggestedSongs: [
            'Who You Say I Am - Hillsong Worship',
            'Gratitude - Brandon Lake',
            'God Only Knows - for KING & COUNTRY',
            'Scars in Heaven - Casting Crowns',
            'Rescue - Lauren Daigle',
            'In Jesus Name God of Possible - Katy Nichole',
            'Firm Foundation He Won\'t - Cody Carnes'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'preset_bukas_palad',
        name: '🇵🇭 Bukas Palad Favorites',
        description: 'Inspiring Filipino Christian songs from Bukas Palad Music Ministry',
        isPreset: true,
        tracks: [],
        suggestedSongs: [
            'Humayo\'t Ihayag - Bukas Palad',
            'Sa \'Yo Lamang - Bukas Palad',
            'Tanging Yaman - Bukas Palad',
            'I Will Sing Forever - Bukas Palad',
            'Anima Christi - Bukas Palad',
            'Lead Me Lord - Bukas Palad',
            'Panalangin sa Pagiging Bukas Palad'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// Playlist Management System
class PlaylistManager {
    constructor() {
        this.userPlaylists = this.loadUserPlaylists();
        this.presetPlaylists = this.loadPresetPlaylists();
        this.playlists = [...this.presetPlaylists, ...this.userPlaylists];
        this.currentPlaylistId = null;
        this.pendingTrack = null; // Track to add when creating new playlist
    }

    loadUserPlaylists() {
        const stored = localStorage.getItem('user_playlists');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error loading playlists:', e);
                return [];
            }
        }
        return [];
    }

    loadPresetPlaylists() {
        const stored = localStorage.getItem('preset_playlists_data');
        if (stored) {
            try {
                // Load preset playlists with their saved tracks
                const savedPresets = JSON.parse(stored);
                return PRESET_PLAYLISTS.map(preset => {
                    const saved = savedPresets.find(p => p.id === preset.id);
                    return saved ? { ...preset, tracks: saved.tracks } : preset;
                });
            } catch (e) {
                console.error('Error loading preset playlists:', e);
                return [...PRESET_PLAYLISTS];
            }
        }
        return [...PRESET_PLAYLISTS];
    }

    savePlaylists() {
        // Save user playlists and preset playlists separately
        localStorage.setItem('user_playlists', JSON.stringify(this.userPlaylists));
        localStorage.setItem('preset_playlists_data', JSON.stringify(this.presetPlaylists));
        this.updatePlaylistDisplay();
    }

    createPlaylist(name, description = '') {
        const playlist = {
            id: Date.now().toString(),
            name: name.trim(),
            description: description.trim(),
            tracks: [],
            isPreset: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.userPlaylists.push(playlist);
        this.playlists = [...this.presetPlaylists, ...this.userPlaylists];
        this.savePlaylists();
        return playlist;
    }

    getPlaylist(id) {
        return this.playlists.find(p => p.id === id);
    }

    updatePlaylist(id, updates) {
        const playlist = this.getPlaylist(id);
        if (playlist) {
            Object.assign(playlist, updates);
            playlist.updatedAt = new Date().toISOString();
            this.savePlaylists();
            return true;
        }
        return false;
    }

    deletePlaylist(id) {
        // Prevent deletion of preset playlists
        const playlist = this.getPlaylist(id);
        if (playlist && playlist.isPreset) {
            showNotification('Preset playlists cannot be deleted', 'warning');
            return false;
        }
        
        const index = this.userPlaylists.findIndex(p => p.id === id);
        if (index > -1) {
            this.userPlaylists.splice(index, 1);
            this.playlists = [...this.presetPlaylists, ...this.userPlaylists];
            this.savePlaylists();
            return true;
        }
        return false;
    }

    addTrackToPlaylist(playlistId, track) {
        const playlist = this.getPlaylist(playlistId);
        if (playlist) {
            // Check if track already exists
            const exists = playlist.tracks.some(t => t.id === track.id);
            if (!exists) {
                playlist.tracks.push({
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    thumbnail: track.thumbnail,
                    addedAt: new Date().toISOString()
                });
                playlist.updatedAt = new Date().toISOString();
                
                // Update the appropriate array
                if (playlist.isPreset) {
                    const presetIndex = this.presetPlaylists.findIndex(p => p.id === playlistId);
                    if (presetIndex > -1) {
                        this.presetPlaylists[presetIndex] = playlist;
                    }
                } else {
                    const userIndex = this.userPlaylists.findIndex(p => p.id === playlistId);
                    if (userIndex > -1) {
                        this.userPlaylists[userIndex] = playlist;
                    }
                }
                
                this.savePlaylists();
                return true;
            }
        }
        return false;
    }

    removeTrackFromPlaylist(playlistId, trackId) {
        const playlist = this.getPlaylist(playlistId);
        if (playlist) {
            const index = playlist.tracks.findIndex(t => t.id === trackId);
            if (index > -1) {
                playlist.tracks.splice(index, 1);
                playlist.updatedAt = new Date().toISOString();
                this.savePlaylists();
                return true;
            }
        }
        return false;
    }

    updatePlaylistDisplay() {
        const container = document.getElementById('playlistContainer');
        
        container.innerHTML = '';
        
        // Add Preset Playlists section
        if (this.presetPlaylists.length > 0) {
            const presetHeader = document.createElement('div');
            presetHeader.style.cssText = 'padding: 12px 12px 8px; color: var(--text-secondary); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;';
            presetHeader.textContent = 'Featured Playlists';
            container.appendChild(presetHeader);
            
            this.presetPlaylists.forEach(playlist => {
                const item = this.createPlaylistItem(playlist);
                container.appendChild(item);
            });
        }
        
        // Add User Playlists section
        const userHeader = document.createElement('div');
        userHeader.style.cssText = 'padding: 16px 12px 8px; color: var(--text-secondary); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;';
        userHeader.textContent = 'Your Playlists';
        container.appendChild(userHeader);
        
        if (this.userPlaylists.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.style.cssText = 'color: var(--text-secondary); padding: 12px; font-size: 12px;';
            emptyMsg.textContent = 'No playlists yet. Create one!';
            container.appendChild(emptyMsg);
        } else {
            this.userPlaylists.forEach(playlist => {
                const item = this.createPlaylistItem(playlist);
                container.appendChild(item);
            });
        }
    }
    
    createPlaylistItem(playlist) {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        if (this.currentPlaylistId === playlist.id) {
            item.classList.add('active');
        }
        
        // Show actions only for user playlists or hide delete for presets
        const actionsHTML = playlist.isPreset ? '' : `
            <div class="playlist-item-actions">
                <button class="btn-icon" onclick="playlistManager.editPlaylist('${playlist.id}')" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn-icon" onclick="playlistManager.confirmDeletePlaylist('${playlist.id}')" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `;
        
        item.innerHTML = `
            <div class="playlist-item-info">
                <div class="playlist-item-name">${playlist.name}</div>
                <div class="playlist-item-count">${playlist.tracks.length} song${playlist.tracks.length !== 1 ? 's' : ''}</div>
            </div>
            ${actionsHTML}
        `;

        item.addEventListener('click', (e) => {
            if (!e.target.closest('.playlist-item-actions')) {
                this.loadPlaylistView(playlist.id);
            }
        });
        
        return item;
    }

    loadPlaylistView(playlistId) {
        const playlist = this.getPlaylist(playlistId);
        if (!playlist) return;

        this.currentPlaylistId = playlistId;
        this.updatePlaylistDisplay();

        // Switch to library view and show playlist
        switchView('library');
        const container = document.getElementById('libraryContent');
        
        if (playlist.tracks.length === 0) {
            // For preset playlists, show suggested songs with load button
            if (playlist.isPreset && playlist.suggestedSongs) {
                const suggestedList = playlist.suggestedSongs.map(song => `<li style="padding: 4px 0;">${song}</li>`).join('');
                container.innerHTML = `
                    <div style="padding: 20px;">
                        <h2 style="margin-bottom: 8px;">${playlist.name}</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 20px;">${playlist.description || 'No description'}</p>
                        <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                            <h3 style="margin-bottom: 12px; font-size: 14px;">Suggested Songs:</h3>
                            <ul style="color: var(--text-secondary); font-size: 13px; padding-left: 20px;">
                                ${suggestedList}
                            </ul>
                        </div>
                        <button class="btn-primary" id="loadPresetBtn" style="display: flex; align-items: center; gap: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"/>
                                <polyline points="1 20 1 14 7 14"/>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                            </svg>
                            Load Songs to Playlist
                        </button>
                        <p style="color: var(--text-secondary); font-size: 12px; margin-top: 12px;">This will search and add these songs to your playlist.</p>
                    </div>
                `;
                
                document.getElementById('loadPresetBtn').addEventListener('click', () => {
                    this.loadPresetPlaylistSongs(playlistId);
                });
            } else {
                container.innerHTML = `
                    <div style="padding: 20px;">
                        <h2 style="margin-bottom: 8px;">${playlist.name}</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 20px;">${playlist.description || 'No description'}</p>
                        <p style="color: var(--text-secondary);">This playlist is empty. Add some songs!</p>
                    </div>
                `;
            }
        } else {
            container.innerHTML = `
                <div style="padding-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
                        <div style="flex: 1; min-width: 200px;">
                            <h2 style="margin-bottom: 8px;">${playlist.name}</h2>
                            <p style="color: var(--text-secondary); margin-bottom: 8px;">${playlist.description || 'No description'}</p>
                            <p style="color: var(--text-secondary); font-size: 14px;">${playlist.tracks.length} song${playlist.tracks.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <button class="btn-primary" id="playAllBtn" style="display: flex; align-items: center; gap: 8px;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                                Play All
                            </button>
                            <button class="btn-secondary" id="shufflePlaylistBtn" style="display: flex; align-items: center; gap: 8px;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="16 3 21 3 21 8"/>
                                    <line x1="4" y1="20" x2="21" y2="3"/>
                                    <polyline points="21 16 21 21 16 21"/>
                                    <line x1="15" y1="15" x2="21" y2="21"/>
                                    <line x1="4" y1="4" x2="9" y2="9"/>
                                </svg>
                                Shuffle
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            const gridContainer = document.createElement('div');
            gridContainer.className = 'music-grid';
            displayMusicCards(playlist.tracks, gridContainer, playlistId);
            container.appendChild(gridContainer);

            // Add event listeners for play buttons
            document.getElementById('playAllBtn').addEventListener('click', () => {
                this.playPlaylist(playlistId, false);
            });

            document.getElementById('shufflePlaylistBtn').addEventListener('click', () => {
                this.playPlaylist(playlistId, true);
            });
        }
    }

    playPlaylist(playlistId, shuffle = false) {
        const playlist = this.getPlaylist(playlistId);
        if (!playlist || playlist.tracks.length === 0) return;

        currentPlaylist = [...playlist.tracks];
        
        if (shuffle) {
            // Shuffle the playlist
            currentPlaylist = this.shuffleArray(currentPlaylist);
            isShuffle = true;
            document.getElementById('shuffleButton').classList.add('active');
        } else {
            isShuffle = false;
            document.getElementById('shuffleButton').classList.remove('active');
        }

        currentTrackIndex = 0;
        playTrack(currentPlaylist[0]);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    editPlaylist(id) {
        const playlist = this.getPlaylist(id);
        if (!playlist) return;

        // Preset playlists cannot be edited
        if (playlist.isPreset) {
            showNotification('Preset playlists cannot be renamed. You can add or remove songs.', 'warning');
            return;
        }

        document.getElementById('playlistModalTitle').textContent = 'Edit Playlist';
        document.getElementById('playlistNameInput').value = playlist.name;
        document.getElementById('playlistDescInput').value = playlist.description;
        document.getElementById('playlistModal').classList.add('active');
        document.getElementById('playlistModal').dataset.editId = id;
    }

    confirmDeletePlaylist(id) {
        const playlist = this.getPlaylist(id);
        if (playlist) {
            showConfirmDialog(`Delete playlist "${playlist.name}"?`, () => {
                this.deletePlaylist(id);
                if (this.currentPlaylistId === id) {
                    this.currentPlaylistId = null;
                    updateLibrary();
                }
            });
        }
    }

    showAddToPlaylistModal(track) {
        this.pendingTrack = track;
        const modal = document.getElementById('addToPlaylistModal');
        const list = document.getElementById('playlistSelectionList');

        if (this.playlists.length === 0) {
            list.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No playlists yet. Create one below!</p>';
        } else {
            list.innerHTML = '';
            this.playlists.forEach(playlist => {
                const item = document.createElement('div');
                item.className = 'playlist-selection-item';
                
                const trackExists = playlist.tracks.some(t => t.id === track.id);
                
                item.innerHTML = `
                    <div class="playlist-selection-item-info">
                        <div class="playlist-selection-item-name">${playlist.name}</div>
                        <div class="playlist-selection-item-count">${playlist.tracks.length} songs</div>
                    </div>
                    ${trackExists ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                `;

                if (!trackExists) {
                    item.addEventListener('click', () => {
                        if (this.addTrackToPlaylist(playlist.id, track)) {
                            modal.classList.remove('active');
                            showNotification(`Added to "${playlist.name}"`, 'success');
                        }
                    });
                } else {
                    item.style.opacity = '0.5';
                    item.style.cursor = 'default';
                }

                list.appendChild(item);
            });
        }

        modal.classList.add('active');
    }

    async loadPresetPlaylistSongs(playlistId) {
        const playlist = this.getPlaylist(playlistId);
        if (!playlist || !playlist.isPreset || !playlist.suggestedSongs) return;

        const container = document.getElementById('libraryContent');
        container.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="margin-bottom: 8px;">${playlist.name}</h2>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">Loading songs...</p>
                <div class="loading">Searching for songs</div>
            </div>
        `;

        let loadedCount = 0;
        for (const songQuery of playlist.suggestedSongs) {
            try {
                // Search for the song
                const results = await fetchMusicVideos(songQuery, 1);
                if (results && results.length > 0) {
                    const track = results[0];
                    // Add to playlist without triggering notification
                    const exists = playlist.tracks.some(t => t.id === track.id);
                    if (!exists) {
                        playlist.tracks.push({
                            id: track.id,
                            title: track.title,
                            artist: track.artist,
                            thumbnail: track.thumbnail,
                            addedAt: new Date().toISOString()
                        });
                        loadedCount++;
                    }
                }
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                console.error(`Error loading song: ${songQuery}`, error);
            }
        }

        // Update the playlist
        playlist.updatedAt = new Date().toISOString();
        const presetIndex = this.presetPlaylists.findIndex(p => p.id === playlistId);
        if (presetIndex > -1) {
            this.presetPlaylists[presetIndex] = playlist;
        }
        this.playlists = [...this.presetPlaylists, ...this.userPlaylists];
        this.savePlaylists();

        showNotification(`Loaded ${loadedCount} songs to ${playlist.name}`, 'success');
        
        // Reload the playlist view
        this.loadPlaylistView(playlistId);
    }
}

// Create global playlist manager instance
const playlistManager = new PlaylistManager();
window.playlistManager = playlistManager;

// Local File Management with IndexedDB
class LocalFileManager {
    constructor() {
        this.db = null;
        this.audioElement = null;
        this.currentLocalTrack = null;
        this.initDB();
        this.initAudioElement();
    }

    initDB() {
        const request = indexedDB.open('MusikaLocalFiles', 1);

        request.onerror = () => {
            console.error('IndexedDB failed to open');
        };

        request.onsuccess = (event) => {
            this.db = event.target.result;
            console.log('IndexedDB opened successfully');
            this.loadLocalFiles();
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('audioFiles')) {
                const objectStore = db.createObjectStore('audioFiles', { keyPath: 'id' });
                objectStore.createIndex('title', 'title', { unique: false });
                objectStore.createIndex('artist', 'artist', { unique: false });
                objectStore.createIndex('addedAt', 'addedAt', { unique: false });
            }
        };
    }

    initAudioElement() {
        this.audioElement = new Audio();
        
        // Mobile browser compatibility attributes
        this.audioElement.setAttribute('playsinline', 'true');
        this.audioElement.setAttribute('webkit-playsinline', 'true');
        this.audioElement.preload = 'metadata';
        
        this.audioElement.addEventListener('ended', () => {
            playNext();
        });
        this.audioElement.addEventListener('timeupdate', () => {
            if (this.currentLocalTrack) {
                this.updateLocalProgress();
            }
        });
        this.audioElement.addEventListener('loadedmetadata', () => {
            if (this.currentLocalTrack) {
                updateVolumeDisplay();
            }
        });
        // Add error handler to auto-skip to next track on playback errors
        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio playback error:', e);
            const error = this.audioElement.error;
            if (error) {
                const errorMessages = {
                    1: 'Audio loading aborted',
                    2: 'Network error while loading audio',
                    3: 'Audio decoding failed',
                    4: 'Audio format not supported'
                };
                console.error(`Audio Error (${error.code}): ${errorMessages[error.code] || 'Unknown error'}`);
            }
            if (typeof showNotification === 'function') {
                showNotification('Error playing track, skipping to next...', 'error', 2000);
            }
            // Automatically skip to next track
            setTimeout(() => {
                playNext();
            }, 500);
        });
        
        // Add stalled event handler (for buffering issues)
        this.audioElement.addEventListener('stalled', () => {
            console.warn('Audio playback stalled, attempting recovery...');
        });
        
        // Add waiting event handler
        this.audioElement.addEventListener('waiting', () => {
            console.log('Audio buffering...');
        });
        
        // Add canplay event handler
        this.audioElement.addEventListener('canplay', () => {
            console.log('Audio can play');
        });
    }

    async addFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                const audioData = e.target.result;
                
                // Extract metadata
                const fileData = {
                    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
                    title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                    artist: 'Unknown Artist',
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    audioData: audioData,
                    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23282828" width="200" height="200"/%3E%3Cpath fill="%231db954" d="M100 50c-27.6 0-50 22.4-50 50s22.4 50 50 50 50-22.4 50-50-22.4-50-50-50zm0 80c-16.5 0-30-13.5-30-30s13.5-30 30-30 30 13.5 30 30-13.5 30-30 30z"/%3E%3Ccircle fill="%231db954" cx="100" cy="100" r="10"/%3E%3C/svg%3E',
                    addedAt: new Date().toISOString(),
                    duration: 0
                };

                const transaction = this.db.transaction(['audioFiles'], 'readwrite');
                const objectStore = transaction.objectStore('audioFiles');
                const request = objectStore.add(fileData);

                request.onsuccess = () => {
                    console.log('File added to IndexedDB:', fileData.title);
                    resolve(fileData);
                };

                request.onerror = () => {
                    console.error('Error adding file to IndexedDB');
                    reject(request.error);
                };
            };

            reader.onerror = () => {
                reject(reader.error);
            };

            reader.readAsDataURL(file);
        });
    }

    async getAllFiles() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve([]);
                return;
            }

            const transaction = this.db.transaction(['audioFiles'], 'readonly');
            const objectStore = transaction.objectStore('audioFiles');
            const request = objectStore.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async deleteFile(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioFiles'], 'readwrite');
            const objectStore = transaction.objectStore('audioFiles');
            const request = objectStore.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async loadLocalFiles() {
        const files = await this.getAllFiles();
        this.displayLocalFiles(files);
    }

    displayLocalFiles(files) {
        const container = document.getElementById('localMusicContent');
        
        if (files.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">No local files yet. Upload some music to play offline!</p>';
            return;
        }

        container.innerHTML = '';
        files.forEach((file, index) => {
            const card = document.createElement('div');
            card.className = 'music-card';
            card.innerHTML = `
                <div class="music-card-menu">
                    <button class="music-card-menu-btn remove-btn" title="Delete file" aria-label="Delete ${sanitizeHTML(file.title)}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
                <div class="music-card-image">
                    <img src="${file.thumbnail}" alt="${sanitizeHTML(file.title)}" loading="lazy">
                    <div class="play-overlay">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </div>
                </div>
                <div class="music-card-title">${sanitizeHTML(file.title)}</div>
                <div class="music-card-artist">${sanitizeHTML(file.artist)}</div>
                <div class="music-card-artist" style="font-size: 11px;">📁 ${(file.fileSize / 1024 / 1024).toFixed(2)} MB</div>
            `;

            // Delete button
            const deleteBtn = card.querySelector('.music-card-menu-btn');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                showConfirmDialog(`Delete "${file.title}"?`, async () => {
                    await this.deleteFile(file.id);
                    await this.loadLocalFiles();
                });
            });

            // Play file
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.music-card-menu')) {
                    currentPlaylist = files;
                    currentTrackIndex = index;
                    this.playLocalFile(file);
                }
            });

            container.appendChild(card);
        });
    }

    playLocalFile(file) {
        // Stop YouTube player if playing
        if (player && player.pauseVideo) {
            player.pauseVideo();
        }

        this.currentLocalTrack = file;
        this.audioElement.src = file.audioData;
        
        // Handle autoplay restrictions (especially on iOS)
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                updatePlayButton();
                // Update Media Session playback state
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'playing';
                }
            }).catch(error => {
                console.warn('Autoplay prevented:', error);
                if (typeof showNotification === 'function') {
                    showNotification('Click play to start audio', 'info', 2000);
                }
                isPlaying = false;
                updatePlayButton();
            });
        }
        
        updateTrackInfo(file);
        addToRecentlyPlayed(file);
    }

    updateLocalProgress() {
        const currentTime = this.audioElement.currentTime;
        const duration = this.audioElement.duration;

        if (duration > 0) {
            const progress = (currentTime / duration) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressSlider').value = progress;
            document.getElementById('currentTime').textContent = formatTime(currentTime);
            document.getElementById('duration').textContent = formatTime(duration);
        }
    }

    togglePlay() {
        if (this.audioElement.paused) {
            this.audioElement.play();
            isPlaying = true;
            // Update Media Session playback state
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        } else {
            this.audioElement.pause();
            isPlaying = false;
            // Update Media Session playback state
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'paused';
            }
        }
        updatePlayButton();
    }

    setVolume(volume) {
        this.audioElement.volume = volume / 100;
    }

    seek(percentage) {
        const duration = this.audioElement.duration;
        if (duration > 0) {
            this.audioElement.currentTime = (percentage / 100) * duration;
        }
    }
}

// Create global local file manager instance
const localFileManager = new LocalFileManager();
window.localFileManager = localFileManager;

// Initialize YouTube Player API
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtubePlayer', {
        height: '1',     // Minimum size (not 0) for background playback on mobile
        width: '1',      // Minimum size (not 0) for background playback on mobile
        playerVars: {
            'playsinline': 1,           // Required for iOS inline playback
            'controls': 0,
            'modestbranding': 1,
            'rel': 0,                   // Don't show related videos
            'fs': 0,                    // Hide fullscreen button on mobile
            'enablejsapi': 1,           // Enable JavaScript API
            'origin': window.location.origin,  // Security requirement
            'widget_referrer': window.location.origin,
            'autoplay': 0               // Don't autoplay
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    console.log('YouTube Player Ready');
    updateVolumeDisplay();
    
    // Mobile browser compatibility: Try to mute initially to allow autoplay
    if (isMobileDevice()) {
        try {
            player.mute();
            console.log('Player muted for mobile compatibility');
        } catch (e) {
            console.warn('Could not mute player:', e);
        }
    }
}

// Mobile device detection
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        playNext();
    } else if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        updatePlayButton();
        startProgressUpdate();
        startCassetteAnimation();
        // Update Media Session playback state
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        updatePlayButton();
        stopCassetteAnimation();
        // Update Media Session playback state
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
    }
}

// Handle YouTube player errors and auto-skip to next track
function onPlayerError(event) {
    console.error('YouTube player error:', event.data);
    const errorMessages = {
        2: 'Invalid video ID',
        5: 'HTML5 player error',
        100: 'Video not found or private',
        101: 'Video not allowed to be embedded',
        150: 'Video not allowed to be embedded'
    };
    
    const errorMsg = errorMessages[event.data] || 'Unknown error';
    console.error(`YouTube Error (${event.data}): ${errorMsg}`);
    
    if (typeof showNotification === 'function') {
        showNotification('Error playing video, skipping to next...', 'error', 2000);
    }
    
    // Automatically skip to next track after a brief delay
    setTimeout(() => {
        playNext();
    }, 500);
}

// ============================================
// MEDIA SESSION API - Background Playback Support
// ============================================

/**
 * Update Media Session metadata for background playback
 * Enables media controls in notification panel and lock screen on mobile
 */
function updateMediaSession(track) {
    // Check for both navigator.mediaSession and MediaMetadata
    if ('mediaSession' in navigator && typeof MediaMetadata !== 'undefined') {
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title || 'Unknown Title',
                artist: track.artist || 'Unknown Artist',
                album: 'Spirify ni Rod',
                artwork: [
                    { src: track.thumbnail || '', sizes: '96x96', type: 'image/jpeg' },
                    { src: track.thumbnail || '', sizes: '128x128', type: 'image/jpeg' },
                    { src: track.thumbnail || '', sizes: '192x192', type: 'image/jpeg' },
                    { src: track.thumbnail || '', sizes: '256x256', type: 'image/jpeg' },
                    { src: track.thumbnail || '', sizes: '384x384', type: 'image/jpeg' },
                    { src: track.thumbnail || '', sizes: '512x512', type: 'image/jpeg' }
                ]
            });
            
            console.log('Media Session updated:', track.title);
        } catch (error) {
            console.warn('Failed to update Media Session:', error);
        }
    } else {
        console.log('Media Session API not available in this browser');
    }
}

/**
 * Initialize Media Session action handlers
 * Enables hardware media keys and notification controls
 */
function initMediaSessionHandlers() {
    if ('mediaSession' in navigator) {
        try {
            // Play action
            navigator.mediaSession.setActionHandler('play', () => {
                console.log('Media Session: Play action');
                if (localFileManager.currentLocalTrack) {
                    localFileManager.audioElement.play();
                    isPlaying = true;
                    updatePlayButton();
                } else if (player && player.playVideo) {
                    player.playVideo();
                }
            });

            // Pause action
            navigator.mediaSession.setActionHandler('pause', () => {
                console.log('Media Session: Pause action');
                if (localFileManager.currentLocalTrack) {
                    localFileManager.audioElement.pause();
                    isPlaying = false;
                    updatePlayButton();
                } else if (player && player.pauseVideo) {
                    player.pauseVideo();
                }
            });

            // Previous track
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                console.log('Media Session: Previous track action');
                playPrevious();
            });

            // Next track
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                console.log('Media Session: Next track action');
                playNext();
            });

            // Seek backward (optional)
            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                console.log('Media Session: Seek backward action');
                const seekTime = details.seekOffset || 10;
                if (localFileManager.currentLocalTrack) {
                    localFileManager.audioElement.currentTime = Math.max(0, localFileManager.audioElement.currentTime - seekTime);
                } else if (player && player.getCurrentTime) {
                    const currentTime = player.getCurrentTime();
                    player.seekTo(Math.max(0, currentTime - seekTime));
                }
            });

            // Seek forward (optional)
            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                console.log('Media Session: Seek forward action');
                const seekTime = details.seekOffset || 10;
                if (localFileManager.currentLocalTrack) {
                    const duration = localFileManager.audioElement.duration;
                    localFileManager.audioElement.currentTime = Math.min(duration, localFileManager.audioElement.currentTime + seekTime);
                } else if (player && player.getCurrentTime && player.getDuration) {
                    const currentTime = player.getCurrentTime();
                    const duration = player.getDuration();
                    player.seekTo(Math.min(duration, currentTime + seekTime));
                }
            });

            // Seek to (optional - for progress bar in notifications)
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                console.log('Media Session: Seek to action', details.seekTime);
                if (details.seekTime) {
                    if (localFileManager.currentLocalTrack) {
                        localFileManager.audioElement.currentTime = details.seekTime;
                    } else if (player && player.seekTo) {
                        player.seekTo(details.seekTime);
                    }
                }
            });

            console.log('Media Session handlers initialized for background playback');
        } catch (error) {
            console.warn('Failed to initialize Media Session handlers:', error);
        }
    } else {
        console.log('Media Session API not supported in this browser');
    }
}

// Initialize Media Session handlers on app load
initMediaSessionHandlers();

// ============================================
// MOBILE BROWSER COMPATIBILITY INITIALIZATION
// ============================================

/**
 * Initialize mobile-specific compatibility features
 * Handles iOS audio restrictions and mobile browser quirks
 */
function initMobileBrowserCompatibility() {
    if (!isMobileDevice()) {
        console.log('Desktop browser detected, skipping mobile-specific initialization');
        return;
    }
    
    console.log('Mobile browser detected, initializing mobile compatibility features...');
    
    // iOS requires user interaction before audio can play
    // Create a one-time unlock function
    let audioUnlocked = false;
    
    const unlockAudio = () => {
        if (audioUnlocked) return;
        
        console.log('Attempting to unlock audio for mobile...');
        
        // Unlock YouTube player
        if (player && player.playVideo && player.pauseVideo) {
            try {
                player.mute();
                player.playVideo();
                setTimeout(() => {
                    player.pauseVideo();
                    player.unMute();
                }, 100);
                console.log('YouTube player audio unlocked');
            } catch (e) {
                console.warn('Could not unlock YouTube player:', e);
            }
        }
        
        // Unlock local audio element
        if (localFileManager && localFileManager.audioElement) {
            try {
                const audio = localFileManager.audioElement;
                audio.muted = true;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        audio.pause();
                        audio.currentTime = 0;
                        audio.muted = false;
                        console.log('Local audio unlocked');
                    }).catch(e => {
                        console.warn('Could not unlock local audio:', e);
                    });
                }
            } catch (e) {
                console.warn('Error unlocking local audio:', e);
            }
        }
        
        audioUnlocked = true;
        
        // Remove listeners after first unlock
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('touchend', unlockAudio);
        document.removeEventListener('click', unlockAudio);
    };
    
    // Listen for first user interaction
    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    document.addEventListener('touchend', unlockAudio, { once: true, passive: true });
    document.addEventListener('click', unlockAudio, { once: true });
    
    console.log('Mobile audio unlock listeners attached');
}

// Initialize mobile compatibility when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initMobileBrowserCompatibility, 1000);
    });
} else {
    setTimeout(initMobileBrowserCompatibility, 1000);
}

// ============================================
// PAGE VISIBILITY API - Background Playback Support
// ============================================

/**
 * Handle page visibility changes for background playback
 * Attempts to keep YouTube playback running when tab goes to background
 */
let wasPlayingBeforeHidden = false;

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is now hidden (background)
        console.log('Page hidden - attempting to maintain playback');
        
        // Remember if we were playing
        wasPlayingBeforeHidden = isPlaying;
        
        // For YouTube player, try to keep it playing
        if (player && isPlaying && !localFileManager.currentLocalTrack) {
            console.log('YouTube playing in background');
            
            // Update Media Session to indicate still playing
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
            
            // On some browsers, the player may pause when hidden
            // Try to resume after a short delay if it paused
            setTimeout(() => {
                if (player && player.getPlayerState && player.getPlayerState() === YT.PlayerState.PAUSED && wasPlayingBeforeHidden) {
                    console.log('Attempting to resume YouTube playback in background');
                    try {
                        player.playVideo();
                    } catch (e) {
                        console.warn('Could not resume playback:', e);
                    }
                }
            }, 500);
        }
        
        // Local audio should continue playing automatically
        if (localFileManager.currentLocalTrack && isPlaying) {
            console.log('Local audio playing in background');
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        }
    } else {
        // Page is now visible (foreground)
        console.log('Page visible - resuming normal playback');
        
        // Update play button state
        updatePlayButton();
    }
});

console.log('Page Visibility API listener added for background playback');

// API Key Management
document.getElementById('saveApiKey').addEventListener('click', () => {
    const apiKeyInput = document.getElementById('apiKeyInput').value.trim();
    if (apiKeyInput) {
        // Support comma-separated keys
        const keys = apiKeyInput.split(',').map(k => k.trim()).filter(k => k);
        let addedCount = 0;
        let errorCount = 0;
        
        keys.forEach(key => {
            try {
                apiKeyRotator.addAPIKey(key);
                addedCount++;
            } catch (e) {
                errorCount++;
                console.error('Error adding key:', e.message);
            }
        });
        
        if (addedCount > 0) {
            showNotification(`Successfully added ${addedCount} API key(s)!${errorCount > 0 ? ` (${errorCount} duplicate(s) skipped)` : ''}`, 'success');
            document.getElementById('apiKeyInput').value = '';
            loadTrendingMusic();
            updateAPIKeyDisplay();
        } else {
            showNotification('No new API keys were added. They may already exist.', 'warning');
        }
    } else {
        showNotification('Please enter at least one valid API key', 'warning');
    }
});

// Manage API Keys Button
document.getElementById('manageApiKeys').addEventListener('click', () => {
    document.getElementById('apiModal').classList.add('active');
    updateAPIKeyManagementModal();
});

document.getElementById('closeApiModal').addEventListener('click', () => {
    document.getElementById('apiModal').classList.remove('active');
});

document.getElementById('apiModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('apiModal').classList.remove('active');
    }
});

// Update API Key Display
function updateAPIKeyDisplay() {
    const keys = apiKeyRotator.getAllKeysWithUsage();
    const input = document.getElementById('apiKeyInput');
    if (keys.length > 0) {
        input.placeholder = `${keys.length} API key(s) configured - Add more (comma-separated)`;
    } else {
        input.placeholder = 'Enter YouTube API Key(s) - separate with commas';
    }
}

// Update API Key Management Modal
function updateAPIKeyManagementModal() {
    const keysList = document.getElementById('apiKeysList');
    const keys = apiKeyRotator.getAllKeysWithUsage();
    
    if (keys.length === 0) {
        keysList.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No API keys configured. Add keys using the input above.</p>';
    } else {
        keysList.innerHTML = keys.map((keyData, index) => {
            const maskedKey = keyData.key.substring(0, 8) + '...' + keyData.key.substring(keyData.key.length - 4);
            const usageClass = keyData.percentage > 90 ? 'danger' : keyData.percentage > 70 ? 'warning' : '';
            
            return `
                <div class="api-key-item">
                    <div class="api-key-info">
                        <div class="api-key-value">
                            ${keyData.isActive ? '🟢 ' : ''}Key ${index + 1}: ${maskedKey}
                        </div>
                        <div class="api-key-usage">
                            Usage: ${keyData.usage.toLocaleString()} / ${apiKeyRotator.quotaLimit.toLocaleString()} (${keyData.percentage.toFixed(1)}%)
                        </div>
                        <div class="api-key-usage-bar">
                            <div class="api-key-usage-fill ${usageClass}" style="width: ${Math.min(keyData.percentage, 100)}%"></div>
                        </div>
                    </div>
                    <div class="api-key-actions">
                        <button class="btn-icon-small delete" onclick="removeAPIKey('${keyData.key}')" title="Remove key">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Update stats
    const stats = document.getElementById('apiStats');
    const totalUsage = apiKeyRotator.getTotalUsage();
    const totalQuota = apiKeyRotator.apiKeys.length * apiKeyRotator.quotaLimit;
    
    stats.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Total API Keys:</span>
            <span class="stat-value">${apiKeyRotator.apiKeys.length}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Active Key:</span>
            <span class="stat-value">Key ${apiKeyRotator.currentKeyIndex + 1}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Usage Today:</span>
            <span class="stat-value">${totalUsage.toLocaleString()}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Quota Available:</span>
            <span class="stat-value">${totalQuota.toLocaleString()}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Remaining Quota:</span>
            <span class="stat-value">${(totalQuota - totalUsage).toLocaleString()}</span>
        </div>
    `;
}

// Remove API Key
function removeAPIKey(key) {
    showConfirmDialog('Are you sure you want to remove this API key?', () => {
        apiKeyRotator.removeKey(key);
        updateAPIKeyManagementModal();
        updateAPIKeyDisplay();
    });
}

// Make removeAPIKey global
window.removeAPIKey = removeAPIKey;

// Load API keys on startup
updateAPIKeyDisplay();

// Fetch Music from YouTube
async function fetchMusicVideos(query = '', maxResults = 20) {
    try {
        // Get API key with quota tracking
        const quotaCost = query ? YouTubeAPIQuotaCost.SEARCH : YouTubeAPIQuotaCost.VIDEO_DETAILS;
        const apiKey = apiKeyRotator.getKey(quotaCost);
        
        let url;
        if (query) {
            // Search with query
            url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=${MUSIC_CATEGORY_ID}&maxResults=${maxResults}&key=${apiKey}`;
        } else {
            // Get trending music videos
            url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=${MUSIC_CATEGORY_ID}&maxResults=${maxResults}&regionCode=US&key=${apiKey}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('YouTube API Error:', data.error);
            
            // If quota exceeded, try rotating to next key
            if (data.error.code === 403 && data.error.message.includes('quota')) {
                console.warn('Quota exceeded, rotating to next key...');
                apiKeyRotator.rotateKey();
                // Retry with new key
                return fetchMusicVideos(query, maxResults);
            }
            
            showNotification('Error fetching music: ' + data.error.message, 'error');
            return [];
        }

        return data.items.map(item => ({
            id: item.id.videoId || item.id,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
            description: item.snippet.description
        }));
    } catch (error) {
        if (error.message === 'No available API keys') {
            showNotification('Please add at least one YouTube API key to start using the app.', 'warning');
        } else {
            console.error('Error fetching music:', error);
            showNotification('Error fetching music. Please check your API keys and internet connection.', 'error');
        }
        return [];
    }
}

// Load Trending Music
async function loadTrendingMusic() {
    const container = document.getElementById('trendingMusic');
    container.innerHTML = '<div class="loading">Loading spiritual music</div>';

    // Load spiritual music using filtered keywords
    const spiritualQuery = buildSpiritualQuery();
    const music = await fetchMusicVideos(spiritualQuery, 20);
    displayMusicCards(music, container);
}

// Search Music
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length > 2) {
        searchTimeout = setTimeout(async () => {
            const container = document.getElementById('searchResults');
            container.innerHTML = '<div class="loading">Searching</div>';

            // Search with spiritual context
            const spiritualQuery = buildSpiritualQuery(query);
            const music = await fetchMusicVideos(spiritualQuery, 30);
            displayMusicCards(music, container);

            // Switch to search view
            switchView('search');
        }, 500);
    }
});

// Display Music Cards
function displayMusicCards(musicList, container, playlistId = null) {
    if (musicList.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">No music found. Try a different search or check your API key.</p>';
        return;
    }

    container.innerHTML = '';
    musicList.forEach((music, index) => {
        const card = document.createElement('div');
        card.className = 'music-card';
        
        // Different button for playlist context vs general context
        const menuButton = playlistId 
            ? `<button class="music-card-menu-btn remove-btn" title="Remove from playlist">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>`
            : `<button class="music-card-menu-btn add-btn" title="Add to playlist">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                </button>`;
        
        card.innerHTML = `
            <div class="music-card-menu">
                ${menuButton}
            </div>
            <div class="music-card-image">
                <img src="${music.thumbnail}" alt="${sanitizeHTML(music.title)}" loading="lazy">
                <div class="play-overlay">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                </div>
            </div>
            <div class="music-card-title">${sanitizeHTML(music.title)}</div>
            <div class="music-card-artist">${sanitizeHTML(music.artist)}</div>
        `;

        // Menu button functionality
        const menuBtn = card.querySelector('.music-card-menu-btn');
        if (playlistId) {
            // Remove from playlist
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showConfirmDialog('Remove this song from the playlist?', () => {
                    if (playlistManager.removeTrackFromPlaylist(playlistId, music.id)) {
                        playlistManager.loadPlaylistView(playlistId);
                    }
                });
            });
        } else {
            // Add to playlist
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                playlistManager.showAddToPlaylistModal(music);
            });
        }

        // Play track on card click
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.music-card-menu')) {
                currentPlaylist = musicList;
                currentTrackIndex = index;
                playTrack(music);
            }
        });

        container.appendChild(card);
    });
}

// Play Track
function playTrack(track) {
    if (!player || !player.loadVideoById) {
        showNotification('Player not ready. Please wait a moment and try again.', 'warning');
        return;
    }

    try {
        // Stop local audio if playing
        if (localFileManager.currentLocalTrack) {
            localFileManager.audioElement.pause();
            localFileManager.currentLocalTrack = null;
        }
        
        player.loadVideoById(track.id);
        updateTrackInfo(track);
        addToRecentlyPlayed(track);
        
        // Handle mobile autoplay restrictions
        if (isMobileDevice()) {
            // Attempt to play with promise handling
            setTimeout(() => {
                if (player && player.playVideo) {
                    player.playVideo();
                }
            }, 100);
        }
        
        isPlaying = true;
        updatePlayButton();
    } catch (error) {
        console.error('Error playing track:', error);
        showNotification('Error loading track. Skipping...', 'error', 2000);
        setTimeout(() => playNext(), 500);
    }
}

// Update Track Info
function updateTrackInfo(track) {
    document.getElementById('trackTitle').textContent = track.title;
    document.getElementById('trackArtist').textContent = track.artist;
    document.getElementById('trackImage').src = track.thumbnail;
    document.getElementById('cassetteTitle').textContent = track.title;

    // Update like button
    const likeButton = document.getElementById('likeButton');
    const isLiked = likedSongs.some(song => song.id === track.id);
    if (isLiked) {
        likeButton.classList.add('active');
        likeButton.querySelector('svg').setAttribute('fill', 'currentColor');
    } else {
        likeButton.classList.remove('active');
        likeButton.querySelector('svg').setAttribute('fill', 'none');
    }
    
    // Update Media Session for background playback (mobile)
    updateMediaSession(track);
}

// Player Controls
document.getElementById('playButton').addEventListener('click', togglePlay);

function togglePlay() {
    // Check if playing local file
    if (localFileManager.currentLocalTrack) {
        localFileManager.togglePlay();
        return;
    }

    if (!player || !player.getPlayerState) return;

    if (isPlaying) {
        player.pauseVideo();
    } else {
        if (player.getPlayerState() === -1 && currentPlaylist.length > 0) {
            playTrack(currentPlaylist[currentTrackIndex]);
        } else {
            player.playVideo();
        }
    }
}

function updatePlayButton() {
    const playButton = document.getElementById('playButton');
    const svg = playButton.querySelector('svg');

    if (isPlaying) {
        svg.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    } else {
        svg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    }
}

// Previous/Next Track
document.getElementById('prevButton').addEventListener('click', playPrevious);
document.getElementById('nextButton').addEventListener('click', playNext);

function playPrevious() {
    if (currentPlaylist.length === 0) return;

    currentTrackIndex = (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    playTrack(currentPlaylist[currentTrackIndex]);
}

function playNext() {
    if (currentPlaylist.length === 0) return;

    if (repeatMode === 2) {
        // Repeat one
        playTrack(currentPlaylist[currentTrackIndex]);
    } else if (isShuffle) {
        currentTrackIndex = Math.floor(Math.random() * currentPlaylist.length);
        playTrack(currentPlaylist[currentTrackIndex]);
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        playTrack(currentPlaylist[currentTrackIndex]);
    }
}

// Shuffle
document.getElementById('shuffleButton').addEventListener('click', () => {
    isShuffle = !isShuffle;
    const shuffleBtn = document.getElementById('shuffleButton');
    shuffleBtn.classList.toggle('active', isShuffle);
    shuffleBtn.setAttribute('aria-pressed', isShuffle);
});

// Repeat
document.getElementById('repeatButton').addEventListener('click', () => {
    repeatMode = (repeatMode + 1) % 3;
    const button = document.getElementById('repeatButton');
    button.setAttribute('aria-pressed', repeatMode > 0);

    if (repeatMode === 0) {
        button.classList.remove('active');
        button.querySelector('svg').innerHTML = `
            <polyline points="17 1 21 5 17 9"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <polyline points="7 23 3 19 7 15"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        `;
    } else if (repeatMode === 1) {
        button.classList.add('active');
        button.querySelector('svg').innerHTML = `
            <polyline points="17 1 21 5 17 9"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <polyline points="7 23 3 19 7 15"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        `;
    } else {
        button.classList.add('active');
        button.querySelector('svg').innerHTML = `
            <polyline points="17 1 21 5 17 9"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <polyline points="7 23 3 19 7 15"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            <text x="12" y="14" font-size="8" fill="currentColor" text-anchor="middle">1</text>
        `;
    }
});

// Like Button
document.getElementById('likeButton').addEventListener('click', () => {
    if (currentPlaylist.length === 0) return;

    const currentTrack = currentPlaylist[currentTrackIndex];
    const isLiked = likedSongs.some(song => song.id === currentTrack.id);

    if (isLiked) {
        likedSongs = likedSongs.filter(song => song.id !== currentTrack.id);
    } else {
        likedSongs.push(currentTrack);
    }

    localStorage.setItem('liked_songs', JSON.stringify(likedSongs));
    updateTrackInfo(currentTrack);
    updateLibrary();
});

// Progress Bar
let progressInterval;

function startProgressUpdate() {
    stopProgressUpdate();
    progressInterval = setInterval(updateProgress, 250);
}

function stopProgressUpdate() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
}

function updateProgress() {
    if (!player || !player.getCurrentTime) return;

    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();

    if (duration > 0) {
        const progress = (currentTime / duration) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressSlider').value = progress;
        document.getElementById('currentTime').textContent = formatTime(currentTime);
        document.getElementById('duration').textContent = formatTime(duration);
    }
}

document.getElementById('progressSlider').addEventListener('input', (e) => {
    const percentage = e.target.value;
    
    // Seek local file if playing
    if (localFileManager.currentLocalTrack) {
        localFileManager.seek(percentage);
        return;
    }
    
    // Seek YouTube player
    if (!player || !player.getDuration) return;
    const duration = player.getDuration();
    const seekTime = (percentage / 100) * duration;
    player.seekTo(seekTime, true);
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Volume Control
document.getElementById('volumeSlider').addEventListener('input', (e) => {
    const volume = e.target.value;
    
    // Set volume for local file if playing
    if (localFileManager.currentLocalTrack) {
        localFileManager.setVolume(volume);
    }
    
    // Set volume for YouTube player
    if (player && player.setVolume) {
        player.setVolume(volume);
    }
    
    updateVolumeIcon(volume);
});

document.getElementById('volumeButton').addEventListener('click', () => {
    if (!player) return;

    const currentVolume = player.getVolume();
    if (currentVolume > 0) {
        player.setVolume(0);
        document.getElementById('volumeSlider').value = 0;
        updateVolumeIcon(0);
    } else {
        player.setVolume(70);
        document.getElementById('volumeSlider').value = 70;
        updateVolumeIcon(70);
    }
});

function updateVolumeDisplay() {
    if (!player || !player.getVolume) return;
    const volume = player.getVolume();
    document.getElementById('volumeSlider').value = volume;
    updateVolumeIcon(volume);
}

function updateVolumeIcon(volume) {
    const button = document.getElementById('volumeButton');
    const svg = button.querySelector('svg');

    if (volume === 0) {
        svg.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/>
            <line x1="17" y1="9" x2="23" y2="15"/>
        `;
    } else if (volume < 50) {
        svg.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        `;
    } else {
        svg.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        `;
    }
}

// Cassette Player Modal
document.getElementById('cassetteButton').addEventListener('click', () => {
    document.getElementById('cassetteModal').classList.add('active');
    if (isPlaying) {
        startCassetteAnimation();
    }
});

document.getElementById('closeCassette').addEventListener('click', () => {
    document.getElementById('cassetteModal').classList.remove('active');
});

document.getElementById('cassetteModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('cassetteModal').classList.remove('active');
    }
});

function startCassetteAnimation() {
    document.getElementById('leftReel').classList.add('playing');
    document.getElementById('rightReel').classList.add('playing');
}

function stopCassetteAnimation() {
    document.getElementById('leftReel').classList.remove('playing');
    document.getElementById('rightReel').classList.remove('playing');
}

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const view = item.dataset.view;
        switchView(view);
    });
});

function switchView(viewName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewName + 'View').classList.add('active');

    // Load content if needed
    if (viewName === 'library') {
        updateLibrary();
    }
}

// Recently Played
function addToRecentlyPlayed(track) {
    // Remove if already exists
    recentlyPlayed = recentlyPlayed.filter(t => t.id !== track.id);

    // Add to beginning
    recentlyPlayed.unshift(track);

    // Keep only last 20
    recentlyPlayed = recentlyPlayed.slice(0, 20);

    localStorage.setItem('recently_played', JSON.stringify(recentlyPlayed));
    updateRecentlyPlayed();
}

function updateRecentlyPlayed() {
    const container = document.getElementById('recentlyPlayed');
    displayMusicCards(recentlyPlayed, container);
}

// Library
function updateLibrary() {
    const container = document.getElementById('libraryContent');
    if (likedSongs.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">No liked songs yet. Like some songs to see them here!</p>';
    } else {
        displayMusicCards(likedSongs, container);
    }
}

// Playlist Modal Event Listeners
document.getElementById('createPlaylistBtn').addEventListener('click', () => {
    document.getElementById('playlistModalTitle').textContent = 'Create Playlist';
    document.getElementById('playlistNameInput').value = '';
    document.getElementById('playlistDescInput').value = '';
    document.getElementById('playlistModal').classList.add('active');
    delete document.getElementById('playlistModal').dataset.editId;
    document.getElementById('playlistNameInput').focus();
});

document.getElementById('closePlaylistModal').addEventListener('click', () => {
    document.getElementById('playlistModal').classList.remove('active');
});

document.getElementById('cancelPlaylistBtn').addEventListener('click', () => {
    document.getElementById('playlistModal').classList.remove('active');
});

document.getElementById('savePlaylistBtn').addEventListener('click', () => {
    const name = document.getElementById('playlistNameInput').value.trim();
    const description = document.getElementById('playlistDescInput').value.trim();
    const modal = document.getElementById('playlistModal');
    const editId = modal.dataset.editId;

    if (!name) {
        showNotification('Please enter a playlist name', 'warning');
        return;
    }

    if (editId) {
        // Update existing playlist
        playlistManager.updatePlaylist(editId, { name, description });
        showNotification('Playlist updated!', 'success');
    } else {
        // Create new playlist
        const playlist = playlistManager.createPlaylist(name, description);
        
        // If there's a pending track, add it
        if (playlistManager.pendingTrack) {
            playlistManager.addTrackToPlaylist(playlist.id, playlistManager.pendingTrack);
            playlistManager.pendingTrack = null;
        }
        
        showNotification('Playlist created!', 'success');
    }

    modal.classList.remove('active');
    delete modal.dataset.editId;
});

document.getElementById('closeAddToPlaylistModal').addEventListener('click', () => {
    document.getElementById('addToPlaylistModal').classList.remove('active');
    playlistManager.pendingTrack = null;
});

document.getElementById('createNewPlaylistFromAdd').addEventListener('click', () => {
    document.getElementById('addToPlaylistModal').classList.remove('active');
    document.getElementById('createPlaylistBtn').click();
});

// Close modals on background click
document.getElementById('playlistModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('playlistModal').classList.remove('active');
    }
});

document.getElementById('addToPlaylistModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('addToPlaylistModal').classList.remove('active');
        playlistManager.pendingTrack = null;
    }
});

// Local File Upload Event Listeners
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const browseFilesBtn = document.getElementById('browseFilesBtn');

browseFilesBtn.addEventListener('click', () => {
    fileInput.click();
});

uploadArea.addEventListener('click', (e) => {
    if (e.target.id !== 'browseFilesBtn') {
        fileInput.click();
    }
});

fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    await handleFileUpload(files);
    fileInput.value = ''; // Reset input
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('audio/')
    );
    
    await handleFileUpload(files);
});

async function handleFileUpload(files) {
    if (files.length === 0) {
        showNotification('Please select audio files', 'warning');
        return;
    }

    const uploadStatus = document.createElement('div');
    uploadStatus.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--bg-secondary); padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 2000;';
    uploadStatus.innerHTML = `<p style="color: var(--text-primary);">Uploading ${files.length} file(s)...</p>`;
    document.body.appendChild(uploadStatus);

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
        try {
            await localFileManager.addFile(file);
            successCount++;
        } catch (error) {
            console.error('Error uploading file:', error);
            errorCount++;
        }
    }

    await localFileManager.loadLocalFiles();
    
    uploadStatus.innerHTML = `
        <p style="color: var(--accent-primary);">✓ ${successCount} file(s) uploaded successfully!</p>
        ${errorCount > 0 ? `<p style="color: #ff4444;">✗ ${errorCount} file(s) failed</p>` : ''}
    `;
    
    setTimeout(() => {
        uploadStatus.remove();
    }, 3000);
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Display Featured Playlists in Home View
function displayFeaturedPlaylists() {
    const container = document.getElementById('featuredPlaylists');
    container.innerHTML = '';
    
    playlistManager.presetPlaylists.forEach(playlist => {
        const card = document.createElement('div');
        card.className = 'featured-playlist-card';
        
        // Extract emoji from name if present
        const emoji = playlist.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '🎵';
        const nameWithoutEmoji = playlist.name.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
        
        card.innerHTML = `
            <div class="featured-playlist-icon">${emoji}</div>
            <div class="featured-playlist-name">${nameWithoutEmoji}</div>
            <div class="featured-playlist-description">${playlist.description}</div>
            <div class="featured-playlist-count">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                </svg>
                ${playlist.tracks.length > 0 ? `${playlist.tracks.length} songs` : 'Click to load songs'}
            </div>
        `;
        
        card.addEventListener('click', () => {
            playlistManager.loadPlaylistView(playlist.id);
        });
        
        container.appendChild(card);
    });
}

// Initialize App
window.addEventListener('load', () => {
    if (apiKeyRotator.apiKeys.length > 0) {
        loadTrendingMusic();
    }
    updateRecentlyPlayed();
    updateLibrary();
    updateAPIKeyDisplay();
    playlistManager.updatePlaylistDisplay();
    displayFeaturedPlaylists();
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in inputs or textareas
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    // Space bar to play/pause
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
    }

    // Arrow keys for seek
    if (e.code === 'ArrowRight' && player && player.getCurrentTime) {
        e.preventDefault();
        player.seekTo(player.getCurrentTime() + 5, true);
    }

    if (e.code === 'ArrowLeft' && player && player.getCurrentTime) {
        e.preventDefault();
        player.seekTo(player.getCurrentTime() - 5, true);
    }
    
    // Arrow Up/Down for volume
    if (e.code === 'ArrowUp') {
        e.preventDefault();
        const volumeSlider = document.getElementById('volumeSlider');
        const newVolume = Math.min(100, parseInt(volumeSlider.value) + 5);
        volumeSlider.value = newVolume;
        if (player && player.setVolume) player.setVolume(newVolume);
        if (localFileManager.currentLocalTrack) localFileManager.setVolume(newVolume);
        updateVolumeIcon(newVolume);
    }
    
    if (e.code === 'ArrowDown') {
        e.preventDefault();
        const volumeSlider = document.getElementById('volumeSlider');
        const newVolume = Math.max(0, parseInt(volumeSlider.value) - 5);
        volumeSlider.value = newVolume;
        if (player && player.setVolume) player.setVolume(newVolume);
        if (localFileManager.currentLocalTrack) localFileManager.setVolume(newVolume);
        updateVolumeIcon(newVolume);
    }
    
    // M for mute
    if (e.code === 'KeyM') {
        e.preventDefault();
        document.getElementById('volumeButton').click();
    }
    
    // N for next track
    if (e.code === 'KeyN') {
        e.preventDefault();
        playNext();
    }
    
    // P for previous track
    if (e.code === 'KeyP') {
        e.preventDefault();
        playPrevious();
    }
    
    // Escape to close modals
    if (e.code === 'Escape') {
        const modals = ['cassetteModal', 'playlistModal', 'addToPlaylistModal', 'apiModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && modal.classList.contains('active')) {
                modal.classList.remove('active');
                if (modalId === 'addToPlaylistModal') {
                    playlistManager.pendingTrack = null;
                }
            }
        });
    }
});
