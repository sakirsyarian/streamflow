/**
 * View Helpers
 * Template helper functions for EJS views
 */

const viewHelpers = {
  /**
   * Get username from session
   */
  getUsername(req) {
    if (req.session && req.session.username) {
      return req.session.username;
    }
    return 'User';
  },

  /**
   * Get avatar HTML from session
   */
  getAvatar(req) {
    if (req.session && req.session.userId) {
      const avatarPath = req.session.avatar_path;
      if (avatarPath) {
        return `<img src="${avatarPath}" alt="${req.session.username || 'User'}'s Profile" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='/images/default-avatar.jpg';">`;
      }
    }
    return '<img src="/images/default-avatar.jpg" alt="Default Profile" class="w-full h-full object-cover">';
  },

  /**
   * Get platform icon name
   */
  getPlatformIcon(platform) {
    const icons = {
      'YouTube': 'youtube',
      'Facebook': 'facebook',
      'Twitch': 'twitch',
      'TikTok': 'tiktok',
      'Instagram': 'instagram',
      'Shopee Live': 'shopping-bag',
      'Restream.io': 'live-photo'
    };
    return icons[platform] || 'broadcast';
  },

  /**
   * Get platform color class
   */
  getPlatformColor(platform) {
    const colors = {
      'YouTube': 'red-500',
      'Facebook': 'blue-500',
      'Twitch': 'purple-500',
      'TikTok': 'gray-100',
      'Instagram': 'pink-500',
      'Shopee Live': 'orange-500',
      'Restream.io': 'teal-500'
    };
    return colors[platform] || 'gray-400';
  },

  /**
   * Format ISO datetime string
   */
  formatDateTime(isoString) {
    if (!isoString) return '--';
    
    const utcDate = new Date(isoString);
    
    return utcDate.toLocaleString('en-US', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  },

  /**
   * Format duration in seconds to HH:MM:SS
   */
  formatDuration(seconds) {
    if (!seconds) return '--';
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
  },

  /**
   * Format file size in bytes to human readable
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Truncate text with ellipsis
   */
  truncate(text, length = 50) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }
};

module.exports = viewHelpers;
