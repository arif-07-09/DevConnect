const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const EXPIRATION_DAYS = 30;

// POST /api/jobs - Create job (only for hirers)
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Get latest user from DB to check role
    const dbUser = await User.findById(req.user.id);
    if (!dbUser || dbUser.about !== 'hiring') {
      return res.status(403).json({ msg: "Only hirers can post jobs" });
    }

    const { title, description, location, salary, skills } = req.body;

    const job = await Job.create({
      title,
      description,
      location,
      salary,
      skills,
      postedBy: req.user.id,
      expiresAt: new Date(Date.now() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
    });

    res.status(201).json({ job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/jobs/:jobId/apply - Apply to a job
router.post('/:jobId/apply', authMiddleware, async (req, res) => {
  try {
    const dbUser = await User.findById(req.user.id);
    if (!dbUser || dbUser.about !== 'job_seeker') {
      return res.status(403).json({ msg: 'Only job seekers can apply' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });

    if (job.applicants.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Already applied to this job' });
    }

    job.applicants.push(req.user.id);
    await job.save();

    res.json({ msg: 'Applied successfully', job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/jobs/:jobId/withdraw - Withdraw application
router.delete('/:jobId/withdraw', authMiddleware, async (req, res) => {
  try {
    const dbUser = await User.findById(req.user.id);
    if (!dbUser || dbUser.about !== 'job_seeker') {
      return res.status(403).json({ msg: 'Only job seekers can withdraw applications' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });

    job.applicants = job.applicants.filter(
      (applicantId) => applicantId.toString() !== req.user.id
    );

    await job.save();
    res.json({ msg: 'Application withdrawn', job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/jobs/:jobId/applicants/:userId - Remove applicant (hirer only)
router.delete('/:jobId/applicants/:userId', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to remove applicants from this job' });
    }

    job.applicants = job.applicants.filter(
      (applicantId) => applicantId.toString() !== req.params.userId
    );

    await job.save();
    res.json({ msg: 'Applicant removed successfully', job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/jobs - Get all jobs with applicant details
router.get('/', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('postedBy', 'name email profilePic')
      .populate('applicants', 'name email profilePic about');

    res.json({ jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/jobs/:jobId/applicants - View applicants (only by hirer who posted)
router.get('/:jobId/applicants', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate('applicants', 'name email profilePic about');

    if (!job) return res.status(404).json({ msg: "Job not found" });

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Access denied" });
    }

    res.json({ applicants: job.applicants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE /api/jobs/:jobId - Delete job (hirer only)
router.delete('/:jobId', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Access denied" });
    }

    await job.deleteOne();
    res.json({ msg: "Job deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
