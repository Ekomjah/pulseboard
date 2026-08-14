const { subDays } = require("date-fns");
const Update = require("../models/Update");

async function createUpdateOnDay(authorId, daysAgo) {
  const update = await Update.create({
    author: authorId,
    text: "test update",
    status: "on-track",
  });
  update.createdAt = subDays(new Date(), daysAgo);
  await update.save({ timestamps: false });
  return update;
}

module.exports = {
  createUpdateOnDay,
};
