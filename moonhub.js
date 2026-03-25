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
    main: 'background: #6366f1; color: #fff; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    success: 'background: #10b981; color: #fff; padding: 2px 6px; border-radius: 3px;',
    error: 'background: #ef4444; color: #fff; padding: 2px 6px; border-radius: 3px;',
    warning: 'background: #f59e0b; color: #fff; padding: 2px 6px; border-radius: 3px;',
    info: 'background: #3b82f6; color: #fff; padding: 2px 6px; border-radius: 3px;',
    platform: {
      twitch: 'background: #9146ff; color: #fff; padding: 2px 6px; border-radius: 3px;',
      kick: 'background: #53fc18; color: #000; padding: 2px 6px; border-radius: 3px;',
      youtube: 'background: #ff0000; color: #fff; padding: 2px 6px; border-radius: 3px;',
      tiktok: 'background: #000; color: #fff; padding: 2px 6px; border-radius: 3px;'
    },
    event: 'background: #8b5cf6; color: #fff; padding: 2px 6px; border-radius: 3px;'
  };

  const EVENT_TYPES = {
    FOLLOW: 'follow',
    SUBSCRIBE: 'subscribe',
    DONATION: 'donation',
    RAID: 'raid',
    CHAT: 'chat',
    REACTION: 'reaction',
    SHARE: 'share',
    COMMUNITY_GIFT: 'community_gift',
    CHANNEL_POINTS: 'channel_points',
    JOIN: 'join',
    SYSTEM: 'system'
  };

  const PLATFORMS = {
    TWITCH: 'twitch',
    KICK: 'kick',
    YOUTUBE: 'youtube',
    TIKTOK: 'tiktok'
  };

  function generateId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomStr}`;
  }

  class Logger {
    constructor(enabled = false) {
      this.enabled = enabled;
    }

    setEnabled(enabled) {
      this.enabled = enabled;
    }

    log(level, message, data) {
      if (!this.enabled) return;
      
      const style = LOG_STYLES[level] || LOG_STYLES.info;
      console.log(`%c${level.toUpperCase()}`, style, message, data || '');
    }

    platform(platform, message, data) {
      if (!this.enabled) return;
      
      const style = LOG_STYLES.platform[platform] || LOG_STYLES.info;
      console.log(`%c${platform.toUpperCase()}`, style, message, data || '');
    }

    event(eventType, message, data) {
      if (!this.enabled) return;
      
      console.log(`%c${eventType}`, LOG_STYLES.event, message, data || '');
    }

    success(message, data) {
      this.log('success', message, data);
    }

    error(message, data) {
      this.log('error', message, data);
    }

    warning(message, data) {
      this.log('warning', message, data);
    }

    info(message, data) {
      this.log('info', message, data);
    }
  }

  class MoonHub {
    constructor(config = {}) {
      this.version = VERSION;
      this.logger = new Logger(config.enableLogs || false);
      this.config = {
        enableLogs: config.enableLogs || false,
        generateIds: config.generateIds !== false,
        keepRawData: config.keepRawData !== false,
        ...config
      };

      this.logger.log('main', `🌙 MoonHub v${VERSION} initialized`, this.config);
    }

    setLogging(enabled) {
      this.config.enableLogs = enabled;
      this.logger.setEnabled(enabled);
      this.logger.log('main', `Logging ${enabled ? 'enabled' : 'disabled'}`);
    }

    normalize(payload) {
      if (!payload || typeof payload !== 'object') {
        this.logger.error('Invalid payload received', payload);
        return null;
      }

      const type = payload.type;
      
      if (type === 'widgetLoad') {
        this.logger.warning('widgetLoad events are not processed', payload);
        return null;
      }

      let platform = this.detectPlatform(payload);
      let normalizedEvent = null;

      this.logger.platform(platform, `Processing ${type} event`);

      switch (type) {
        case 'follow':
        case 'follower':
          normalizedEvent = this.normalizeFollow(payload, platform);
          break;
        
        case 'subscriber':
          normalizedEvent = platform === 'youtube' && !payload.data?.tier && !payload.data?.amount
            ? this.normalizeFollow(payload, platform)
            : this.normalizeSubscribe(payload, platform);
          break;

        case 'join':
          normalizedEvent = this.normalizeJoin(payload, platform);
          break;

        case 'cheer':
          normalizedEvent = this.normalizeDonation(payload, platform, 'cheer');
          break;

        case 'tip':
          normalizedEvent = this.normalizeDonation(payload, platform, 'tip');
          break;

        case 'superchat':
          normalizedEvent = this.normalizeDonation(payload, platform, 'superchat');
          break;

        case 'gift':
          normalizedEvent = this.normalizeDonation(payload, platform, 'gift');
          break;

        case 'raid':
        case 'host':
          normalizedEvent = this.normalizeRaid(payload, platform);
          break;

        case 'message':
        case 'chat':
          normalizedEvent = this.normalizeChat(payload, platform);
          break;

        case 'like':
          normalizedEvent = this.normalizeReaction(payload, platform);
          break;

        case 'share':
          normalizedEvent = this.normalizeShare(payload, platform);
          break;

        case 'communityGiftPurchase':
          normalizedEvent = this.normalizeCommunityGift(payload, platform);
          break;

        case 'channelPointsRedemption':
          normalizedEvent = this.normalizeChannelPoints(payload, platform);
          break;

        case 'system':
          normalizedEvent = this.normalizeSystem(payload, platform);
          break;

        default:
          this.logger.warning(`Unknown event type: ${type}`, payload);
          normalizedEvent = this.normalizeUnknown(payload, platform);
      }

      if (normalizedEvent) {
        this.logger.event(normalizedEvent.type, 'Event normalized', normalizedEvent);
      }

      return normalizedEvent;
    }

    detectPlatform(payload) {
      if (payload.provider) return payload.provider;
      if (payload.data?.provider) return payload.data.provider;
      if (payload.channel) return PLATFORMS.TWITCH;
      return PLATFORMS.TWITCH;
    }

    normalizeFollow(payload, platform) {
      const base = this.createBaseEvent(EVENT_TYPES.FOLLOW, payload, platform);
      
      if (platform === PLATFORMS.TIKTOK) {
        base.user = this.extractTikTokUser(payload);
      } else {
        base.user = this.extractUser(payload);
      }

      return base;
    }

    normalizeSubscribe(payload, platform) {
      const base = this.createBaseEvent(EVENT_TYPES.SUBSCRIBE, payload, platform);
      base.user = this.extractUser(payload);
      
      const data = payload.data || payload;
      
      base.amount = data.amount || 1;
      base.message = data.message || null;
      
      base.meta.tier = data.tier || null;
      base.meta.gifted = data.gifted || false;
      base.meta.sender = data.sender || null;
      
      if (data.gifted) {
        base.meta.subtype = 'gifted';
      } else if (data.amount > 1) {
        base.meta.subtype = 'resub';
      } else {
        base.meta.subtype = 'new';
      }

      return base;
    }

    normalizeJoin(payload, platform) {
      const base = this.createBaseEvent(EVENT_TYPES.JOIN, payload, platform);
      base.user = this.extractTikTokUser(payload);
      return base;
    }

    normalizeDonation(payload, platform, subtype) {
      const base = this.createBaseEvent(EVENT_TYPES.DONATION, payload, platform);
      
      if (platform === PLATFORMS.TIKTOK) {
        base.user = this.extractTikTokUser(payload);
        const tiktokPayload = payload.data?.payload || payload.payload || {};
        base.amount = tiktokPayload.amount || 1;
        base.meta.giftName = tiktokPayload.gift || null;
        base.meta.subtype = 'gift';
      } else {
        base.user = this.extractUser(payload);
        const data = payload.data || payload;
        base.amount = data.amount || 0;
        base.message = data.message || null;
        base.meta.subtype = subtype;
      }

      return base;
    }

    normalizeRaid(payload, platform) {
      const base = this.createBaseEvent(EVENT_TYPES.RAID, payload, platform);
      base.user = this.extractUser(payload);
      
      const data = payload.data || payload;
      base.amount = data.amount || 0;
      base.meta.subtype = payload.type === 'host' ? 'host' : 'raid';

      return base;
    }

    normalizeChat(payload, platform) {
      const base = this.createBaseEvent(EVENT_TYPES.CHAT, payload, platform);
      
      if (platform === PLATFORMS.TIKTOK) {
        base.user = this.extractTikTokUser(payload);
        const tiktokPayload = payload.data?.payload || payload.payload || {};
        base.message = tiktokPayload.text || '';
        base.meta.msgId = tiktokPayload.id || null;
      } else if (platform === PLATFORMS.KICK) {
        const kickData = payload.data?.data || payload.data || {};
        base.user = {
          id: kickData.sender?.id?.toString() || null,
          name: kickData.sender?.username || kickData.sender?.slug || 'unknown',
          displayName: kickData.sender?.username || kickData.sender?.slug || 'unknown',
          avatar: null
        };
        base.message = kickData.content || '';
        base.meta.msgId = kickData.message_id || kickData.id || null;
        base.meta.emotes = kickData.emotes || [];
        base.meta.isAction = false;
      } else if (platform === PLATFORMS.YOUTUBE) {
        const ytData = payload.data?.data || payload.data || {};
        base.user = {
          id: ytData.userId || ytData.channel || null,
          name: ytData.nick || ytData.username || 'unknown',
          displayName: ytData.displayName || ytData.nick || 'unknown',
          avatar: ytData.profileImageUrl || null
        };
        base.message = ytData.text || ytData.message || '';
        base.meta.msgId = ytData.id || null;
        base.meta.badges = [];
        base.meta.emotes = ytData.emotes || [];
        base.meta.isAction = ytData.isAction || false;
        base.meta.isSponsor = ytData.isSponsor || false;
        base.meta.isModerator = ytData.isModerator || false;
        base.meta.liveChatId = ytData.liveChatId || null;
      } else {
        base.user = this.extractUser(payload);
        const data = payload.data || payload;
        base.message = data.text || data.message || data.body || '';
        base.meta.msgId = data.msgId || data.id || null;
        base.meta.badges = data.badges || [];
        base.meta.emotes = data.emotes || [];
        base.meta.isAction = data.isAction || false;
      }

      return base;
    }

    normalizeReaction(payload, platform) {
      const base = this.createBaseEvent(EVENT_TYPES.REACTION, payload, platform);
      base.user = this.extractTikTokUser(payload);
      
      const tiktokPayload = payload.data?.payload || payload.payload || {};
      base.meta.likeCount = tiktokPayload.count || 0;
      base.meta.likeTotal = tiktokPayload.total || null;

      return base;
    }

    normalizeShare(payload, platform) {
      const base = this.createBaseEvent(EVENT_TYPES.SHARE, payload, platform);
      base.user = this.extractTikTokUser(payload);
      
      const tiktokPayload = payload.data?.payload || payload.payload || {};
      const action = tiktokPayload.action || '';
      
      base.meta.subtype = action.includes('repost') ? 'repost' : 'share';
      base.meta.socialAction = action;

      return base;
    }

    normalizeCommunityGift(payload, platform) {
      const base = this.createBaseEvent(EVENT_TYPES.COMMUNITY_GIFT, payload, platform);
      base.user = this.extractUser(payload);
      
      const data = payload.data || payload;
      base.amount = data.amount || 0;
      base.meta.tier = data.tier || null;
      base.meta.giftCount = data.count || data.amount || 0;

      return base;
    }

    normalizeChannelPoints(payload, platform) {
      const base = this.createBaseEvent(EVENT_TYPES.CHANNEL_POINTS, payload, platform);
      base.user = this.extractUser(payload);
      
      const data = payload.data || payload;
      base.amount = data.cost || 0;
      base.message = data.message || data.input || null;
      base.meta.rewardId = data.rewardId || null;
      base.meta.rewardName = data.name || data.rewardName || null;

      return base;
    }

    normalizeSystem(payload, platform) {
      const base = this.createBaseEvent(EVENT_TYPES.SYSTEM, payload, platform);
      
      const data = payload.data || payload;
      base.meta.status = data.status || 'unknown';
      base.meta.username = data.username || null;

      return base;
    }

    normalizeUnknown(payload, platform) {
      const base = this.createBaseEvent(payload.type || 'unknown', payload, platform);
      return base;
    }

    createBaseEvent(type, payload, platform) {
      const event = {
        platform: platform,
        type: type,
        timestamp: payload.timestamp || payload.createdAt || new Date().toISOString(),
        user: null,
        amount: null,
        message: null,
        meta: {}
      };

      if (this.config.generateIds) {
        event.id = generateId();
      }

      if (this.config.keepRawData) {
        event.meta.raw = payload;
      }

      return event;
    }

    extractUser(payload) {
      const data = payload.data || payload;
      
      return {
        id: data.providerId?.toString() || data.userId?.toString() || null,
        name: data.username || data.name || data.nick || 'unknown',
        displayName: data.displayName || data.username || data.name || 'unknown',
        avatar: data.avatar || data.profileImageUrl || null
      };
    }

    extractTikTokUser(payload) {
      const tiktokPayload = payload.data?.payload || payload.payload || {};
      
      return {
        id: tiktokPayload.id || null,
        name: tiktokPayload.user || 'unknown',
        displayName: tiktokPayload.user || 'unknown',
        avatar: null
      };
    }

    getVersion() {
      return this.version;
    }

    getConfig() {
      return { ...this.config };
    }

    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      
      if (typeof newConfig.enableLogs !== 'undefined') {
        this.logger.setEnabled(newConfig.enableLogs);
      }

      this.logger.info('Configuration updated', this.config);
    }
  }

  MoonHub.VERSION = VERSION;
  MoonHub.EVENT_TYPES = EVENT_TYPES;
  MoonHub.PLATFORMS = PLATFORMS;

  return MoonHub;
}));
