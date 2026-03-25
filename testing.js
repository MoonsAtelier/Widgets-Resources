(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MoonHub = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '2.0.0';

  const LOG_STYLES = {
    prefix: 'background: #6B46C1; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    info: 'color: #3B82F6;',
    success: 'color: #10B981;',
    warning: 'color: #F59E0B;',
    error: 'color: #EF4444; font-weight: bold;',
    event: 'color: #8B5CF6;',
    platform: 'color: #EC4899; font-weight: bold;',
    data: 'color: #6B7280;'
  };

  const PLATFORM_COLORS = {
    twitch: '#9146FF',
    kick: '#53FC18',
    youtube: '#FF0000',
    tiktok: '#000000'
  };

  const EVENT_TYPE_MAP = {
    follow: ['follow', 'follower', 'subscriber', 'join'],
    subscribe: ['subscriber', 'sponsor', 'sub', 'subscription'],
    donation: ['cheer', 'tip', 'superchat', 'gift', 'bits'],
    raid: ['raid', 'host'],
    chat: ['message', 'chat'],
    reaction: ['like', 'reaction'],
    share: ['share', 'repost'],
    community_gift: ['communityGiftPurchase', 'community_gift'],
    system: ['widgetLoad', 'system', 'connected', 'disconnected']
  };

  function MoonHub(options) {
    this.options = Object.assign({
      enableLogs: true,
      logLevel: 'all',
      onEvent: null,
      onError: null,
      autoConnect: true,
      platforms: {
        twitch: { enabled: true },
        kick: { enabled: true },
        youtube: { enabled: true },
        tiktok: { enabled: true }
      }
    }, options || {});

    this.connections = {};
    this.eventQueue = [];
    this.stats = {
      twitch: { total: 0, byType: {} },
      kick: { total: 0, byType: {} },
      youtube: { total: 0, byType: {} },
      tiktok: { total: 0, byType: {} }
    };

    this._log('info', `MoonHub v${VERSION} initialized`);
    
    if (this.options.autoConnect) {
      this._setupYouTubeListener();
    }
  }

  MoonHub.prototype.enableLogs = function(enable) {
    this.options.enableLogs = enable;
    this._log('info', `Logs ${enable ? 'enabled' : 'disabled'}`);
  };

  MoonHub.prototype.setLogLevel = function(level) {
    const validLevels = ['all', 'info', 'warning', 'error', 'none'];
    if (validLevels.indexOf(level) === -1) {
      this._log('error', `Invalid log level: ${level}`);
      return;
    }
    this.options.logLevel = level;
    this._log('info', `Log level set to: ${level}`);
  };

  MoonHub.prototype._log = function(type, message, data) {
    if (!this.options.enableLogs || this.options.logLevel === 'none') return;
    
    const levels = { all: 0, info: 1, warning: 2, error: 3 };
    const currentLevel = levels[this.options.logLevel] || 0;
    const messageLevel = levels[type] || 0;
    
    if (messageLevel < currentLevel) return;

    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    
    console.log(
      `%c🌙 MoonHub%c [${timestamp}] %c${message}`,
      LOG_STYLES.prefix,
      LOG_STYLES[type] || '',
      LOG_STYLES[type] || ''
    );
    
    if (data) {
      console.log('%cData:', LOG_STYLES.data, data);
    }
  };

  MoonHub.prototype._logEvent = function(platform, type, event) {
    if (!this.options.enableLogs) return;
    
    const platformColor = `color: ${PLATFORM_COLORS[platform] || '#6B7280'}; font-weight: bold;`;
    console.log(
      `%c🌙 MoonHub%c ⚡ %c${platform.toUpperCase()}%c › %c${type}`,
      LOG_STYLES.prefix,
      '',
      platformColor,
      '',
      LOG_STYLES.event,
      event
    );
  };

  MoonHub.prototype.connectTwitch = function(token) {
    if (!this.options.platforms.twitch.enabled) {
      this._log('warning', 'Twitch platform is disabled');
      return;
    }

    const url = `wss://astro.streamelements.com/?token=${token}`;
    return this._connectWebSocket('twitch', url);
  };

  MoonHub.prototype.connectKick = function(token) {
    if (!this.options.platforms.kick.enabled) {
      this._log('warning', 'Kick platform is disabled');
      return;
    }

    const url = `wss://astro.streamelements.com/?token=${token}`;
    return this._connectWebSocket('kick', url);
  };

  MoonHub.prototype.connectTikTok = function(url) {
    if (!this.options.platforms.tiktok.enabled) {
      this._log('warning', 'TikTok platform is disabled');
      return;
    }

    return this._connectWebSocket('tiktok', url);
  };

  MoonHub.prototype._connectWebSocket = function(platform, url) {
    const self = this;

    if (this.connections[platform]) {
      this._log('warning', `${platform} already connected, closing previous connection`);
      this.connections[platform].close();
    }

    try {
      const ws = new WebSocket(url);

      ws.onopen = function() {
        self._log('success', `${platform} connected`);
      };

      ws.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          self._handleMessage(platform, data);
        } catch (e) {
          self._log('error', `Failed to parse ${platform} message`, e);
        }
      };

      ws.onerror = function(error) {
        self._log('error', `${platform} WebSocket error`, error);
        if (self.options.onError) {
          self.options.onError({ platform: platform, error: error });
        }
      };

      ws.onclose = function() {
        self._log('warning', `${platform} disconnected`);
        delete self.connections[platform];
      };

      this.connections[platform] = ws;
      return ws;

    } catch (e) {
      this._log('error', `Failed to connect to ${platform}`, e);
      return null;
    }
  };

  MoonHub.prototype._setupYouTubeListener = function() {
    if (!this.options.platforms.youtube.enabled) return;

    const self = this;
    
    if (typeof window !== 'undefined') {
      window.addEventListener('onEventReceived', function(obj) {
        if (obj && obj.detail) {
          self._handleMessage('youtube', obj.detail);
        }
      });
      this._log('success', 'YouTube listener attached');
    }
  };

  MoonHub.prototype._handleMessage = function(platform, data) {
    if (data.type === 'widgetLoad') {
      this._log('info', `${platform} widget loaded, skipping event`);
      return;
    }

    const normalized = this.normalize(data, platform);
    
    if (normalized) {
      this.stats[platform].total++;
      this.stats[platform].byType[normalized.type] = (this.stats[platform].byType[normalized.type] || 0) + 1;
      
      this._logEvent(platform, normalized.type, normalized);
      
      if (this.options.onEvent) {
        this.options.onEvent(normalized);
      }
    }
  };

  MoonHub.prototype.normalize = function(payload, platformHint) {
    if (!payload) return null;

    const platform = this._detectPlatform(payload, platformHint);
    const type = this._detectEventType(payload);

    if (!type) {
      this._log('warning', 'Could not detect event type', payload);
      return null;
    }

    const timestamp = this._extractTimestamp(payload);
    const user = this._extractUser(payload, platform);
    const amount = this._extractAmount(payload);
    const message = this._extractMessage(payload);
    const meta = this._extractMeta(payload, platform, type);

    return {
      id: this._generateId(),
      platform: platform,
      type: type,
      timestamp: timestamp,
      user: user,
      amount: amount,
      message: message,
      meta: meta,
      raw: payload
    };
  };

  MoonHub.prototype._detectPlatform = function(payload, hint) {
    if (hint) return hint.toLowerCase();

    if (payload.provider) return payload.provider.toLowerCase();
    if (payload.data && payload.data.provider) return payload.data.provider.toLowerCase();
    if (payload.channel) return 'twitch';
    
    return 'unknown';
  };

  MoonHub.prototype._detectEventType = function(payload) {
    const rawType = (
      payload.type ||
      (payload.data && payload.data.type) ||
      ''
    ).toLowerCase();

    if (rawType) {
      for (const normalizedType in EVENT_TYPE_MAP) {
        const variants = EVENT_TYPE_MAP[normalizedType];
        for (let i = 0; i < variants.length; i++) {
          if (rawType.indexOf(variants[i].toLowerCase()) !== -1) {
            return this._refineEventType(normalizedType, payload);
          }
        }
      }
    }

    const data = payload.data || payload;
    if (data.text || data.message || data.content) {
      return 'chat';
    }

    if (data.count && !data.amount) {
      return 'reaction';
    }

    return rawType || null;
  };

  MoonHub.prototype._refineEventType = function(baseType, payload) {
    if (baseType === 'follow') {
      if (payload.type === 'join') return 'follow';
      
      const data = payload.data || {};
      if (data.tier || data.amount > 0 || data.gifted !== undefined) {
        return 'subscribe';
      }
    }

    if (baseType === 'system') {
      return 'system';
    }

    return baseType;
  };

  MoonHub.prototype._extractTimestamp = function(payload) {
    const ts = (
      payload.timestamp ||
      payload.createdAt ||
      (payload.data && payload.data.timestamp) ||
      Date.now()
    );

    if (typeof ts === 'number') {
      return new Date(ts).toISOString();
    }
    
    return ts;
  };

  MoonHub.prototype._extractUser = function(payload, platform) {
    const data = payload.data || payload;
    const eventPayload = data.payload || data;

    return {
      id: (
        eventPayload.providerId ||
        eventPayload.userId ||
        eventPayload.id ||
        (eventPayload.user && typeof eventPayload.user === 'object' ? eventPayload.user.id : null) ||
        null
      ),
      name: (
        eventPayload.username ||
        eventPayload.nick ||
        eventPayload.name ||
        eventPayload.user ||
        'unknown'
      ),
      displayName: (
        eventPayload.displayName ||
        eventPayload.username ||
        eventPayload.nick ||
        eventPayload.name ||
        eventPayload.user ||
        'unknown'
      ),
      avatar: (
        eventPayload.avatar ||
        eventPayload.profilePictureUrl ||
        null
      )
    };
  };

  MoonHub.prototype._extractAmount = function(payload) {
    const data = payload.data || payload;
    const eventPayload = data.payload || data;

    const amount = (
      eventPayload.amount ||
      eventPayload.count ||
      eventPayload.quantity ||
      null
    );

    return amount !== null ? Number(amount) : null;
  };

  MoonHub.prototype._extractMessage = function(payload) {
    const data = payload.data || payload;
    const eventPayload = data.payload || data;

    return (
      eventPayload.message ||
      eventPayload.text ||
      eventPayload.content ||
      null
    );
  };

  MoonHub.prototype._extractMeta = function(payload, platform, type) {
    const data = payload.data || payload;
    const eventPayload = data.payload || data;
    const meta = {};

    if (type === 'subscribe') {
      meta.tier = eventPayload.tier || null;
      meta.gifted = eventPayload.gifted || false;
      meta.sender = eventPayload.sender || eventPayload.gifter || null;
      
      if (eventPayload.amount && eventPayload.amount > 1) {
        meta.subtype = 'resub';
      } else if (meta.gifted) {
        meta.subtype = 'gifted';
      } else {
        meta.subtype = 'new';
      }
    }

    if (type === 'raid') {
      if (payload.type === 'host') {
        meta.subtype = 'host';
      } else {
        meta.subtype = 'raid';
      }
    }

    if (type === 'chat') {
      meta.badges = eventPayload.badges || [];
      meta.emotes = eventPayload.emotes || [];
      meta.isAction = eventPayload.isAction || false;
      meta.isSponsor = eventPayload.isSponsor || false;
      meta.isModerator = eventPayload.isModerator || false;
      meta.msgId = eventPayload.msgId || eventPayload.id || null;
      
      if (platform === 'youtube') {
        meta.liveChatId = eventPayload.liveChatId || null;
      }
    }

    if (type === 'reaction') {
      meta.likeCount = eventPayload.count || 0;
      meta.likeTotal = eventPayload.total || 0;
    }

    if (type === 'share') {
      meta.socialAction = eventPayload.action || null;
      
      if (eventPayload.action && eventPayload.action.indexOf('repost') !== -1) {
        meta.subtype = 'repost';
      } else {
        meta.subtype = 'share';
      }
    }

    if (type === 'donation') {
      meta.currency = eventPayload.currency || 'USD';
      meta.giftName = eventPayload.gift || eventPayload.giftName || null;
    }

    if (type === 'system') {
      meta.status = (data.status || eventPayload.status || 'unknown');
      meta.username = data.username || null;
    }

    if (payload._id) {
      meta.originalId = payload._id;
    }

    if (payload.isMock !== undefined) {
      meta.isMock = payload.isMock;
    }

    return meta;
  };

  MoonHub.prototype._generateId = function() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 9);
    return `mh_${timestamp}_${randomPart}`;
  };

  MoonHub.prototype.getStats = function() {
    return this.stats;
  };

  MoonHub.prototype.disconnect = function(platform) {
    if (platform) {
      if (this.connections[platform]) {
        this.connections[platform].close();
        delete this.connections[platform];
        this._log('info', `${platform} disconnected`);
      }
    } else {
      for (const p in this.connections) {
        this.connections[p].close();
      }
      this.connections = {};
      this._log('info', 'All platforms disconnected');
    }
  };

  MoonHub.prototype.destroy = function() {
    this.disconnect();
    this.eventQueue = [];
    this._log('info', 'MoonHub destroyed');
  };

  MoonHub.VERSION = VERSION;

  return MoonHub;
}));
