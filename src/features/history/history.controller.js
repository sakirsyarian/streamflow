/**
 * History Controller
 * Handle HTTP requests for stream history
 */

const HistoryService = require('./history.service');
const viewHelpers = require('../../core/helpers/viewHelpers');

class HistoryController {
  /**
   * GET /history - History page
   */
  static async index(req, res) {
    try {
      const history = await HistoryService.findByUserId(req.session.userId);
      
      res.render('history', {
        active: 'history',
        title: 'Stream History',
        history,
        helpers: viewHelpers
      });
    } catch (error) {
      console.error('Error fetching stream history:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load stream history',
        error
      });
    }
  }

  /**
   * GET /api/history - Get all history for user
   */
  static async getAll(req, res) {
    try {
      const history = await HistoryService.findByUserId(req.session.userId);
      res.json({ success: true, history });
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch history' });
    }
  }

  /**
   * DELETE /api/history/:id - Delete history entry
   */
  static async delete(req, res) {
    try {
      const historyId = req.params.id;
      
      const history = await HistoryService.findById(historyId);
      
      if (!history) {
        return res.status(404).json({
          success: false,
          error: 'History entry not found'
        });
      }
      
      if (history.user_id !== req.session.userId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized'
        });
      }

      await HistoryService.delete(historyId);
      
      res.json({ success: true, message: 'History entry deleted' });
    } catch (error) {
      console.error('Error deleting history entry:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete history entry'
      });
    }
  }

  /**
   * DELETE /api/history - Delete all history for user
   */
  static async deleteAll(req, res) {
    try {
      await HistoryService.deleteAllByUserId(req.session.userId);
      res.json({ success: true, message: 'All history deleted' });
    } catch (error) {
      console.error('Error deleting all history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete history'
      });
    }
  }

  /**
   * GET /api/history/stats - Get history statistics
   */
  static async getStats(req, res) {
    try {
      const stats = await HistoryService.getStats(req.session.userId);
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching history stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
  }
}

module.exports = HistoryController;
