const express = require("express");
const User = require("../models/User");
const Update = require("../models/Update");
const { calculateStreak } = require("../utils/streak");

const router = express.Router();

router.get("/:id/streak", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const postingDays = await Update.aggregate([
      { $match: { author: user._id } },
      { $group: { _id: { $dateTrunc: { date: "$createdAt", unit: "day" } } } },
      { $sort: { _id: -1 } },
    ]);

    const streak = calculateStreak(postingDays.map((d) => d._id));

    return res.json({ userId: user._id, streak });
  } catch (err) {
    return res.status(400).json({ error: "Invalid user id" });
  }
});

module.exports = router;
