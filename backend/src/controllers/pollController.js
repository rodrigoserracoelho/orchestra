const Poll = require('../models/Poll');
const Season = require('../models/Season');

// Options plus who answered what, so the admin grid and the musician's own
// ballot can both be built from one response.
async function buildResults(pollId) {
  const [options, voters, votes] = await Promise.all([
    Poll.options(pollId),
    Poll.eligibleVoters(pollId),
    Poll.votes(pollId),
  ]);
  return { options, voters, votes };
}

const pollController = {
  async listBySeason(req, res) {
    try {
      const season = await Season.findById(req.params.seasonId);
      if (!season) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Season not found' });
      }
      const polls = await Poll.findBySeasonId(req.params.seasonId);
      res.json({ success: true, data: polls });
    } catch (error) {
      console.error('Poll list error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch polls' });
    }
  },

  async get(req, res) {
    try {
      const poll = await Poll.findById(req.params.id);
      if (!poll) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Poll not found' });
      }
      const results = await buildResults(poll.id);
      res.json({ success: true, data: { poll, ...results } });
    } catch (error) {
      console.error('Poll get error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch poll' });
    }
  },

  async create(req, res) {
    try {
      const { season_id, title, options } = req.body;
      if (!season_id || !title || !Array.isArray(options) || options.length === 0) {
        return res.status(400).json({
          success: false, error: 'validation',
          message: 'Season, title and at least one date option are required',
        });
      }
      const season = await Season.findById(season_id);
      if (!season) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Season not found' });
      }
      const poll = await Poll.create({ ...req.body, created_by: req.user.id });
      res.status(201).json({ success: true, data: poll, message: 'Poll created' });
    } catch (error) {
      console.error('Poll create error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to create poll' });
    }
  },

  async update(req, res) {
    try {
      const poll = await Poll.findById(req.params.id);
      if (!poll) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Poll not found' });
      }
      if (poll.status === 'closed') {
        return res.status(409).json({ success: false, error: 'closed', message: 'Reopen the poll before editing it' });
      }
      if (Array.isArray(req.body.options) && req.body.options.length === 0) {
        return res.status(400).json({ success: false, error: 'validation', message: 'A poll needs at least one date option' });
      }
      const updated = await Poll.update(req.params.id, req.body);
      if (Array.isArray(req.body.options)) {
        await Poll.replaceOptions(req.params.id, req.body.options);
      }
      res.json({ success: true, data: updated, message: 'Poll updated' });
    } catch (error) {
      console.error('Poll update error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to update poll' });
    }
  },

  async close(req, res) {
    try {
      const { option_id } = req.body;
      if (!option_id) {
        return res.status(400).json({ success: false, error: 'validation', message: 'Pick the winning date' });
      }
      const poll = await Poll.findById(req.params.id);
      if (!poll) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Poll not found' });
      }
      if (poll.status === 'closed') {
        return res.status(409).json({ success: false, error: 'closed', message: 'This poll is already closed' });
      }
      const result = await Poll.close(req.params.id, option_id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Date option not found' });
      }
      res.json({ success: true, data: result, message: 'Poll closed and rehearsal created' });
    } catch (error) {
      console.error('Poll close error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to close poll' });
    }
  },

  async reopen(req, res) {
    try {
      const poll = await Poll.findById(req.params.id);
      if (!poll) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Poll not found' });
      }
      const updated = await Poll.reopen(req.params.id);
      res.json({ success: true, data: updated, message: 'Poll reopened' });
    } catch (error) {
      console.error('Poll reopen error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to reopen poll' });
    }
  },

  async delete(req, res) {
    try {
      const poll = await Poll.findById(req.params.id);
      if (!poll) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Poll not found' });
      }
      await Poll.delete(req.params.id);
      res.json({ success: true, message: 'Poll deleted' });
    } catch (error) {
      console.error('Poll delete error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to delete poll' });
    }
  },

  // --- musician-facing ---

  async myOpenPolls(req, res) {
    try {
      const polls = await Poll.findOpenForUser(req.user.id);
      res.json({ success: true, data: polls });
    } catch (error) {
      console.error('My polls error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch polls' });
    }
  },

  async getForVoter(req, res) {
    try {
      const poll = await Poll.findById(req.params.id);
      if (!poll) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Poll not found' });
      }
      if (!(await Poll.isEligible(poll.id, req.user.id))) {
        return res.status(403).json({ success: false, error: 'forbidden', message: 'This poll is not addressed to you' });
      }
      const { options, votes } = await buildResults(poll.id);
      const myVotes = {};
      votes.filter((v) => v.user_id === req.user.id).forEach((v) => { myVotes[v.option_id] = v.availability; });
      res.json({ success: true, data: { poll, options, myVotes } });
    } catch (error) {
      console.error('Poll get error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to fetch poll' });
    }
  },

  async vote(req, res) {
    try {
      const { option_id, availability } = req.body;
      const poll = await Poll.findById(req.params.id);
      if (!poll) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Poll not found' });
      }
      if (poll.status === 'closed') {
        return res.status(409).json({ success: false, error: 'closed', message: 'This poll is closed' });
      }
      if (poll.closes_at && new Date(poll.closes_at) < new Date()) {
        return res.status(409).json({ success: false, error: 'closed', message: 'The deadline for this poll has passed' });
      }
      if (!(await Poll.isEligible(poll.id, req.user.id))) {
        return res.status(403).json({ success: false, error: 'forbidden', message: 'This poll is not addressed to you' });
      }
      if (!(await Poll.optionBelongsToPoll(option_id, poll.id))) {
        return res.status(404).json({ success: false, error: 'not_found', message: 'Date option not found' });
      }
      const saved = await Poll.vote(option_id, req.user.id, availability);
      if (!saved) {
        return res.status(400).json({ success: false, error: 'validation', message: 'Availability must be yes, maybe or no' });
      }
      res.json({ success: true, message: 'Response saved' });
    } catch (error) {
      console.error('Poll vote error:', error);
      res.status(500).json({ success: false, error: 'server_error', message: 'Failed to save response' });
    }
  },
};

module.exports = pollController;
